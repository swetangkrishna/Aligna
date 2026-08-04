import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from app.core.config import Settings, get_settings


api_key_header = APIKeyHeader(
    name="X-Aligna-API-Key",
    auto_error=False,
)


async def require_api_key(
    supplied_key: Annotated[
        str | None,
        Depends(api_key_header),
    ],
    settings: Annotated[
        Settings,
        Depends(get_settings),
    ],
) -> None:
    if supplied_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "missing_api_key",
                "message": "An API key is required",
            },
        )

    if not secrets.compare_digest(
        supplied_key,
        settings.app_api_key,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "invalid_api_key",
                "message": "The supplied API key is invalid",
            },
        )