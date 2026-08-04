from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.services.model_client import ModelClient


SettingsDependency = Annotated[
    Settings,
    Depends(get_settings),
]


def get_model_client(
    settings: SettingsDependency,
) -> ModelClient:
    return ModelClient(
        settings=settings,
    )


ModelClientDependency = Annotated[
    ModelClient,
    Depends(get_model_client),
]
