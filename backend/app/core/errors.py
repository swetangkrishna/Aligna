import logging

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


logger = logging.getLogger(__name__)


def get_request_id(
    request: Request,
) -> str | None:
    return getattr(
        request.state,
        "request_id",
        None,
    )


async def http_exception_handler(
    request: Request,
    exception: HTTPException,
) -> JSONResponse:
    detail = exception.detail

    if isinstance(detail, dict):
        code = str(
            detail.get(
                "code",
                "http_error",
            )
        )
        message = str(
            detail.get(
                "message",
                "The request failed",
            )
        )
    else:
        code = "http_error"
        message = str(detail)

    return JSONResponse(
        status_code=exception.status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "request_id": get_request_id(request),
            }
        },
        headers=exception.headers,
    )


async def validation_exception_handler(
    request: Request,
    exception: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "The request data is invalid",
                "request_id": get_request_id(request),
                "details": exception.errors(),
            }
        },
    )


async def unexpected_exception_handler(
    request: Request,
    exception: Exception,
) -> JSONResponse:
    request_id = get_request_id(request)

    logger.exception(
        "Unhandled server error request_id=%s",
        request_id,
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_server_error",
                "message": (
                    "An unexpected server error occurred"
                ),
                "request_id": request_id,
            }
        },
    )