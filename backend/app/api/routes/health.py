from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.services.model_client import ModelClient


router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "healthy",
    }


@router.get("/health/ready")
async def readiness() -> dict[str, str]:
    settings = get_settings()
    model_client = ModelClient(settings)

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
        "model": settings.model_name,
        "provider": settings.model_provider,
    }