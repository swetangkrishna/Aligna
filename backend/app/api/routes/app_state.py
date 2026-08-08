from datetime import datetime, timezone

from fastapi import APIRouter

from app.api.authentication import (
    CurrentUserDependency,
)
from app.api.dependencies import (
    DatabaseSessionDependency,
)
from app.models.app_state import (
    AppStateResponse,
    AppStateUpdateRequest,
)
from app.services.app_state_service import (
    find_app_state,
    save_app_state,
)


router = APIRouter(
    prefix="/state",
    tags=["state"],
)


@router.get(
    "",
    response_model=AppStateResponse,
)
async def get_state(
    current_user: CurrentUserDependency,
    session: DatabaseSessionDependency,
) -> AppStateResponse:
    record = await find_app_state(
        session,
        current_user.id,
    )

    if record is None:
        now = datetime.now(
            timezone.utc
        )

        return AppStateResponse(
            state={},
            state_version=1,
            client_updated_at=None,
            updated_at=now,
        )

    return AppStateResponse.model_validate(
        record
    )


@router.post(
    "",
    response_model=AppStateResponse,
)
async def update_state(
    payload: AppStateUpdateRequest,
    current_user: CurrentUserDependency,
    session: DatabaseSessionDependency,
) -> AppStateResponse:
    record = await save_app_state(
        session,
        user_id=current_user.id,
        state=payload.state,
        state_version=(
            payload.state_version
        ),
        client_updated_at=(
            payload.client_updated_at
        ),
    )

    return AppStateResponse.model_validate(
        record
    )