from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from app.api.dependencies import (
    ModelClientDependency,
    SettingsDependency,
)


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


@router.get("/ready")
async def readiness(
    settings: SettingsDependency,
    model_client: ModelClientDependency,
) -> dict[str, str]:
    model_available = (
        await model_client.check_health()
    )

    if not model_available:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "code": "model_unavailable",
                "message": (
                    "The configured model server "
                    "is unavailable"
                ),
            },
        )

    return {
        "status": "ready",
        "model_provider": settings.model_provider,
        "model": settings.model_name,
    }