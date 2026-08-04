from fastapi import APIRouter

from app.api.dependencies import SettingsDependency


router = APIRouter(
    prefix="/health",
    tags=["health"],
)


@router.get("")
async def health(
    settings: SettingsDependency,
) -> dict[str, str]:
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.app_environment,
        "model_provider": settings.model_provider,
        "model": settings.model_name,
    }
