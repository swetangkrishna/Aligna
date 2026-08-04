from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.passwords import (
    hash_password,
    verify_password,
)
from app.db.user import User


class EmailAlreadyRegisteredError(
    RuntimeError
):
    pass


class InvalidCredentialsError(
    RuntimeError
):
    pass


def normalize_email(
    email: str,
) -> str:
    return email.strip().lower()


async def find_user_by_email(
    session: AsyncSession,
    email: str,
) -> User | None:
    result = await session.execute(
        select(User).where(
            User.email == normalize_email(email)
        )
    )

    return result.scalar_one_or_none()


async def register_user(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    full_name: str | None,
) -> User:
    existing = await find_user_by_email(
        session,
        email,
    )

    if existing is not None:
        raise EmailAlreadyRegisteredError(
            "An account with this email already exists"
        )

    user = User(
        email=normalize_email(email),
        full_name=(
            full_name.strip()
            if full_name
            else None
        ),
        password_hash=hash_password(
            password
        ),
    )

    session.add(user)

    await session.commit()
    await session.refresh(user)

    return user


async def authenticate_user(
    session: AsyncSession,
    *,
    email: str,
    password: str,
) -> User:
    user = await find_user_by_email(
        session,
        email,
    )

    if (
        user is None
        or not verify_password(
            password,
            user.password_hash,
        )
    ):
        raise InvalidCredentialsError(
            "Incorrect email or password"
        )

    if not user.is_active:
        raise InvalidCredentialsError(
            "This account is inactive"
        )

    return user