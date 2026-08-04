from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import (
    ModelClientDependency,
    SettingsDependency,
)
from app.models.chat import (
    ChatCompletionRequest,
    ChatCompletionResponse,
)
from app.services.model_client import ModelServiceError


router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)


@router.post(
    "/completions",
    response_model=ChatCompletionResponse,
)
async def create_chat_completion(
    request: ChatCompletionRequest,
    settings: SettingsDependency,
    model_client: ModelClientDependency,
) -> ChatCompletionResponse:
    total_characters = sum(
        len(message.content)
        for message in request.messages
    )

    if total_characters > settings.max_input_characters:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                "Combined message content exceeds "
                "the permitted input size"
            ),
        )

    try:
        content = await model_client.complete(
            request=request,
        )

    except ModelServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    return ChatCompletionResponse(
        content=content,
        model=settings.model_name,
        provider=settings.model_provider,
    )
