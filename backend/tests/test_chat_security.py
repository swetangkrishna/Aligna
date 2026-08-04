from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_chat_requires_api_key() -> None:
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

    data = response.json()

    assert (
        data["error"]["code"]
        == "missing_api_key"
    )

    assert data["error"]["request_id"]