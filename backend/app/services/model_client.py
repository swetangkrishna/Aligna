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

    def _headers(self) -> dict[str, str]:
        if self._settings.model_provider == "azure":
            return {"api-key": self._settings.model_api_key}
        return {"Authorization": f"Bearer {self._settings.model_api_key}"}

    async def check_health(self) -> bool:
        if self._settings.model_provider == "azure":
            # Called only by explicit readiness checks, not container probes.
            try:
                await self.complete(ChatCompletionRequest(
                    messages=[{"role": "user", "content": "Reply OK"}],
                    max_tokens=2,
                ))
                return True
            except ModelServiceError:
                return False
        base_url = str(
            self._settings.model_base_url
        ).rstrip("/")

        models_endpoint = f"{base_url}/models"

        timeout = httpx.Timeout(
            10.0,
            connect=5.0,
        )

        try:
            async with httpx.AsyncClient(
                trust_env=False,
                timeout=timeout,
            ) as client:
                response = await client.get(
                    models_endpoint,
                    headers=self._headers(),
                )

            logger.info(
                "Model health response "
                "endpoint=%s status=%s",
                models_endpoint,
                response.status_code,
            )

            return response.is_success

        except Exception as error:
            logger.exception(
                "Model health check failed "
                "endpoint=%s error_type=%s error=%s",
                models_endpoint,
                type(error).__name__,
                str(error),
            )

            return False

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
            **self._headers(),
        }

        timeout = httpx.Timeout(
            self._settings.model_timeout_seconds,
            connect=20.0,
        )

        try:
            async with httpx.AsyncClient(
                trust_env=False,
                timeout=timeout,
            ) as client:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    params={"api-version": self._settings.model_api_version}
                    if self._settings.model_provider == "azure" else None,
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
            logger.error(
                "Model server returned "
                "status=%s",
                error.response.status_code,
            )

            raise ModelServiceError(
                "The AI model server rejected the request"
            ) from error

        except httpx.HTTPError as error:
            logger.exception(
                "Could not connect to model server "
                "endpoint=%s error_type=%s error=%s",
                endpoint,
                type(error).__name__,
                str(error),
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
