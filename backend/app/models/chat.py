from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(
        min_length=1,
        max_length=50_000,
    )

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Message content cannot be blank")

        return cleaned


class ChatCompletionRequest(BaseModel):
    messages: list[ChatMessage] = Field(
        min_length=1,
        max_length=100,
    )

    temperature: float = Field(
        default=0.2,
        ge=0.0,
        le=1.5,
    )

    max_tokens: int = Field(
        default=1024,
        ge=1,
        le=8192,
    )


class ChatCompletionResponse(BaseModel):
    content: str
    model: str
    provider: str
