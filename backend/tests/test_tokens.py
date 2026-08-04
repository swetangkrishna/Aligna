import uuid

import pytest

from app.core.config import Settings
from app.core.tokens import (
    InvalidTokenError,
    create_access_token,
    decode_access_token,
)


def test_access_token_round_trip() -> None:
    settings = Settings(
        jwt_secret_key=(
            "test-secret-that-is-at-least-32-characters"
        ),
    )

    user_id = uuid.uuid4()

    token = create_access_token(
        user_id=user_id,
        settings=settings,
    )

    decoded_user_id = decode_access_token(
        token,
        settings,
    )

    assert decoded_user_id == user_id


def test_invalid_access_token_is_rejected() -> None:
    settings = Settings(
        jwt_secret_key=(
            "test-secret-that-is-at-least-32-characters"
        ),
    )

    with pytest.raises(
        InvalidTokenError
    ):
        decode_access_token(
            "not-a-valid-token",
            settings,
        )