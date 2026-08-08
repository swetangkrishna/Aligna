import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.db.app_state import UserAppState


async def find_app_state(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> UserAppState | None:
    result = await session.execute(
        select(UserAppState).where(
            UserAppState.user_id == user_id
        )
    )

    return result.scalar_one_or_none()


async def save_app_state(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    state: dict[str, Any],
    state_version: int,
    client_updated_at: datetime | None,
) -> UserAppState:
    record = await find_app_state(
        session,
        user_id,
    )

    if record is None:
        record = UserAppState(
            user_id=user_id,
            state=state,
            state_version=state_version,
            client_updated_at=(
                client_updated_at
            ),
        )

        session.add(record)
    else:
        record.state = state
        record.state_version = (
            state_version
        )
        record.client_updated_at = (
            client_updated_at
        )

    await session.commit()
    await session.refresh(record)

    return record