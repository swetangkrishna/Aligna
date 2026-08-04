import logging
from typing import Any

import httpx

from app.core.config import Settings
from app.models.chat import ChatCompletionRequest


logger = logging.getLogger(__name__)


class ModelServiceError(RuntimeError):
    """Raised when the configured model server cannot answer."""


class ModelClient:
    def __init__(
        self,
        settings: Settings,
    ) -> None:
        self._settings = settings

    async def complete(
        self,
        request: ChatCompletionRequest,
    ) -> str:
        payload: dict[str, Any] = {
            "model": self._settings.model_name,
            "messages": [
                message.model_dump()
                for message in request.messages
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": False,
        }

        endpoint = (
            f"{str(self._settings.model_base_url).rstrip('/')}"
            "/chat/completions"
        )

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": (
                f"Bearer {self._settings.model_api_key}"
            ),
        }

        timeout = httpx.Timeout(
            self._settings.model_timeout_seconds,
            connect=20.0,
        )

        try:
            async with httpx.AsyncClient(
                timeout=timeout,
            ) as client:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                )

                response.raise_for_status()

        except httpx.TimeoutException as error:
            logger.exception(
                "Model server timed out",
            )

            raise ModelServiceError(
                "The AI model took too long to respond"
            ) from error

        except httpx.HTTPStatusError as error:
            response_text = error.response.text[:500]

            logger.error(
                "Model server returned status=%s body=%s",
                error.response.status_code,
                response_text,
            )

            raise ModelServiceError(
                "The AI model server rejected the request"
            ) from error

        except httpx.HTTPError as error:
            logger.exception(
                "Could not connect to model server",
            )

            raise ModelServiceError(
                "The AI model server is unavailable"
            ) from error

        try:
            data = response.json()

            content = (
                data["choices"][0]["message"]["content"]
            )

        except (
            KeyError,
            IndexError,
            TypeError,
            ValueError,
        ) as error:
            logger.exception(
                "Unexpected model response structure",
            )

            raise ModelServiceError(
                "The AI model returned an invalid response"
            ) from error

        if not isinstance(content, str):
            raise ModelServiceError(
                "The AI model returned non-text content"
            )

        cleaned_content = content.strip()

        if not cleaned_content:
            raise ModelServiceError(
                "The AI model returned an empty response"
            )

        return cleaned_content
