import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import chat, health
from app.core.config import get_settings


logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s %(levelname)s "
        "%(name)s %(message)s"
    ),
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs"
    if settings.app_environment != "production"
    else None,
    redoc_url="/redoc"
    if settings.app_environment != "production"
    else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
)

app.include_router(
    health.router,
    prefix=settings.api_v1_prefix,
)

app.include_router(
    chat.router,
    prefix=settings.api_v1_prefix,
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "status": "running",
    }
