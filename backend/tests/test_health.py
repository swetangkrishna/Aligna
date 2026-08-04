from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get(
        "/api/v1/health"
    )

    assert response.status_code == 200
    assert response.headers.get(
        "X-Request-ID"
    )

    data = response.json()

    assert data["status"] == "healthy"
    assert data["service"] == "Aligna API"