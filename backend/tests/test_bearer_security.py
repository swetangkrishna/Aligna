from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_chat_requires_bearer_token() -> None:
    response = client.post(
        "/api/v1/chat/completions",
        json={
            "messages": [
                {
                    "role": "user",
                    "content": "Hello",
                }
            ]
        },
    )

    assert response.status_code == 401
    assert (
        response.headers.get(
            "WWW-Authenticate"
        )
        == "Bearer"
    )
