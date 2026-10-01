from functools import lru_cache
from typing import Literal

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Aligna API"
    app_environment: Literal["development", "test", "production"] = (
        "development"
    )

    api_v1_prefix: str = "/api/v1"

    database_url: str = (
        "postgresql+asyncpg://"
        "aligna:aligna_dev_password@postgres:5432/aligna"
    )

    jwt_secret_key: str = Field(
        default="replace-with-a-long-random-secret",
        min_length=32,
    )

    jwt_algorithm: str = "HS256"

    access_token_expire_minutes: int = Field(
        default=30,
        ge=5,
        le=1440,
    )
    model_provider: Literal["ollama", "vllm", "azure"] = "ollama"
    model_base_url: HttpUrl = Field(
        default="http://host.docker.internal:11434/v1"
    )
    model_name: str = "gemma3:4b"
    model_api_key: str = "ollama"
    model_api_version: str = "2024-05-01-preview"

    model_timeout_seconds: float = Field(
        default=120.0,
        ge=5.0,
        le=600.0,
    )

    max_input_characters: int = Field(
        default=50_000,
        ge=1_000,
        le=500_000,
    )

    cors_origins: list[str] = [
        "http://localhost",
        "http://127.0.0.1",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
