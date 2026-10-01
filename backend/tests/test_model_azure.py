import httpx
import pytest
from app.core.config import Settings
from app.models.chat import ChatCompletionRequest
from app.services.model_client import ModelClient, ModelServiceError

@pytest.mark.asyncio
@pytest.mark.parametrize('provider', ['azure', 'ollama'])
async def test_provider_protocol(monkeypatch, provider):
    def handler(request):
        if provider == 'azure':
            assert request.headers['api-key'] == 'test-key'
            assert 'authorization' not in request.headers
            assert request.url.params['api-version'] == '2024-05-01-preview'
        else:
            assert request.headers['authorization'] == 'Bearer test-key'
            assert 'api-version' not in request.url.params
        return httpx.Response(200, json={'choices': [{'message': {'content': ' OK '}}]})
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kw: original(transport=httpx.MockTransport(handler), **kw))
    client = ModelClient(Settings(model_provider=provider, model_api_key='test-key', model_base_url='https://example.test/models'))
    assert await client.complete(ChatCompletionRequest(messages=[{'role':'user','content':'Hello'}])) == 'OK'

@pytest.mark.asyncio
async def test_upstream_error_body_not_logged(monkeypatch, caplog):
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kw: original(transport=httpx.MockTransport(lambda r: httpx.Response(403, text='sensitive-upstream-details')), **kw))
    client = ModelClient(Settings(model_provider='azure', model_base_url='https://example.test/models'))
    with pytest.raises(ModelServiceError):
        await client.complete(ChatCompletionRequest(messages=[{'role':'user','content':'Hello'}]))
    assert 'sensitive-upstream-details' not in caplog.text
