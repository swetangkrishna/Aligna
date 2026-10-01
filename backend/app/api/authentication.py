from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.api.dependencies import (
    DatabaseSessionDependency,
    SettingsDependency,
)
from app.core.tokens import (
    InvalidTokenError,
    decode_access_token,
)
from app.db.user import User
from app.services.user_service import (
    find_user_by_id,
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)


async def get_current_user(
    token: Annotated[
        str,
        Depends(oauth2_scheme),
    ],
    session: DatabaseSessionDependency,
    settings: SettingsDependency,
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "invalid_access_token",
            "message": (
                "The access token is invalid or expired"
            ),
        },
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        user_id = decode_access_token(
            token,
            settings,
        )
    except InvalidTokenError as error:
        raise credentials_error from error

    user = await find_user_by_id(
        session,
        user_id,
    )

    if user is None:
        raise credentials_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "inactive_account",
                "message": (
                    "This user account is inactive"
                ),
            },
        )

    return user


CurrentUserDependency = Annotated[
    User,
    Depends(get_current_user),
]
