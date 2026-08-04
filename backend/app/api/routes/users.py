from fastapi import APIRouter

from app.api.authentication import (
    CurrentUserDependency,
)
from app.models.auth import UserResponse


router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_my_account(
    current_user: CurrentUserDependency,
) -> UserResponse:
    return UserResponse.model_validate(
        current_user
    )