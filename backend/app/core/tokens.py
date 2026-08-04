from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

import jwt

from app.core.config import Settings


class InvalidTokenError(RuntimeError):
    pass


def create_access_token(
    *,
    user_id: uuid.UUID,
    settings: Settings,
) -> str:
    now = datetime.now(
        timezone.utc
    )

    expires_at = now + timedelta(
        minutes=(
            settings.access_token_expire_minutes
        )
    )

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(
    token: str,
    settings: Settings,
) -> uuid.UUID:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[
                settings.jwt_algorithm,
            ],
        )

        if payload.get("type") != "access":
            raise InvalidTokenError(
                "Incorrect token type"
            )

        subject = payload.get("sub")

        if not isinstance(subject, str):
            raise InvalidTokenError(
                "Token subject is missing"
            )

        return uuid.UUID(subject)

    except (
        jwt.InvalidTokenError,
        ValueError,
    ) as error:
        raise InvalidTokenError(
            "Invalid or expired access token"
        ) from error