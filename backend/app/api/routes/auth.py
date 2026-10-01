from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from app.api.dependencies import (
    DatabaseSessionDependency,
    SettingsDependency,
)
from app.core.tokens import (
    create_access_token,
)
from app.models.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.user_service import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    authenticate_user,
    register_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: RegisterRequest,
    session: DatabaseSessionDependency,
    settings: SettingsDependency,
) -> TokenResponse:
    try:
        user = await register_user(
            session,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
        )

    except EmailAlreadyRegisteredError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "email_already_registered",
                "message": str(error),
            },
        ) from error

    token = create_access_token(
        user_id=user.id,
        settings=settings,
    )

    return TokenResponse(
        access_token=token,
        expires_in=(
            settings.access_token_expire_minutes
            * 60
        ),
        user=user,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    request: LoginRequest,
    session: DatabaseSessionDependency,
    settings: SettingsDependency,
) -> TokenResponse:
    try:
        user = await authenticate_user(
            session,
            email=request.email,
            password=request.password,
        )

    except InvalidCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "invalid_credentials",
                "message": str(error),
            },
        ) from error

    token = create_access_token(
        user_id=user.id,
        settings=settings,
    )

    return TokenResponse(
        access_token=token,
        expires_in=(
            settings.access_token_expire_minutes
            * 60
        ),
        user=user,
    )
