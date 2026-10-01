from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class AppStateUpdateRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    state: dict[str, Any] = Field(
        default_factory=dict,
    )

    state_version: int = Field(
        default=1,
        ge=1,
        le=1000,
    )

    client_updated_at: (
        datetime | None
    ) = None


class AppStateResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    state: dict[str, Any]

    state_version: int

    client_updated_at: (
        datetime | None
    )

    updated_at: datetime
