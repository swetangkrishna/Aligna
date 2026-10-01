import uuid
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class RegisterRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=10,
        max_length=128,
    )

    full_name: str | None = Field(
        default=None,
        max_length=150,
    )

    @field_validator("password")
    @classmethod
    def validate_password(
        cls,
        value: str,
    ) -> str:
        if value.lower() == value:
            raise ValueError(
                "Password must contain an uppercase letter"
            )

        if not any(
            character.isdigit()
            for character in value
        ):
            raise ValueError(
                "Password must contain a number"
            )

        return value


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128,
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    is_active: bool
    is_verified: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
