import logging
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


logger = logging.getLogger("aligna.requests")


class RequestContextMiddleware(BaseHTTPMiddleware):

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[
            [Request],
            Awaitable[Response],
        ],
    ) -> Response:
        supplied_request_id = request.headers.get(
            "X-Request-ID"
        )

        request_id = (
            supplied_request_id.strip()[:100]
            if supplied_request_id
            else str(uuid.uuid4())
        )

        request.state.request_id = request_id

        started_at = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (
                time.perf_counter() - started_at
            ) * 1000

            logger.exception(
                "request_failed request_id=%s "
                "method=%s path=%s duration_ms=%.2f",
                request_id,
                request.method,
                request.url.path,
                elapsed_ms,
            )

            raise

        elapsed_ms = (
            time.perf_counter() - started_at
        ) * 1000

        response.headers["X-Request-ID"] = request_id

        logger.info(
            "request_completed request_id=%s "
            "method=%s path=%s status=%s "
            "duration_ms=%.2f",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )

        return response
