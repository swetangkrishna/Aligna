# Aligna Deployment Checklist

This document records development-only settings and production requirements.

## Critical security changes

- [ ] Remove the shared `APP_API_KEY` authentication mechanism.
- [ ] Remove `AI_API_KEY` from the Android BuildConfig.
- [ ] Never embed permanent backend secrets in the APK or AAB.
- [ ] Require user Bearer access tokens for protected API endpoints.
- [ ] Add refresh-token rotation and token revocation.
- [ ] Replace all development secrets before deployment.
- [ ] Store production secrets in the cloud secret-management service.
- [ ] Disable FastAPI `/docs` and `/redoc` in production.
- [ ] Add account email verification.
- [ ] Add password-reset flow.
- [ ] Add login rate limiting and temporary account lockout.
- [ ] Add endpoint-level rate limiting and usage quotas.

## Android changes

- [ ] Replace `http://10.0.2.2:8000` with the production HTTPS API URL.
- [ ] Remove unrestricted `android:usesCleartextTraffic="true"`.
- [ ] Use separate debug and release network-security configurations.
- [ ] Store tokens using Android encrypted storage.
- [ ] Never store passwords.
- [ ] Create a production signing key and store it securely.
- [ ] Increase `versionCode` and update `versionName`.
- [ ] Build and test the release APK.
- [ ] Build the Play Store AAB.
- [ ] Enable release minification and test ProGuard/R8 rules.
- [ ] Confirm no model files, API keys or development URLs are packaged.

## Backend changes

- [ ] Set `APP_ENVIRONMENT=production`.
- [ ] Use HTTPS only.
- [ ] Restrict CORS origins.
- [ ] Use a production PostgreSQL service.
- [ ] Use a strong production database password.
- [ ] Enable PostgreSQL TLS.
- [ ] Run Alembic migrations as a deployment step.
- [ ] Add database backups and restore testing.
- [ ] Replace development logging with structured production logging.
- [ ] Avoid logging passwords, tokens, prompts or sensitive health data.
- [ ] Add request-size and file-size limits.
- [ ] Add readiness, liveness and model health monitoring.
- [ ] Add graceful shutdown and connection-pool configuration.
- [ ] Add data export and account deletion.

## AI model service

- [ ] Replace local Ollama with the selected production model server.
- [ ] Set `MODEL_PROVIDER=vllm` or the chosen production provider.
- [ ] Replace `host.docker.internal` with the internal production model URL.
- [ ] Verify the production model licence permits commercial use.
- [ ] Verify all dependent model and tokenizer licences.
- [ ] Add per-request token accounting.
- [ ] Add context-window enforcement.
- [ ] Add multimodal file validation.
- [ ] Add model-routing and fallback policy.
- [ ] Add safety and medical-risk handling.
- [ ] Benchmark latency, throughput, GPU memory and cost.

## Privacy and compliance

- [ ] Publish a privacy policy and terms of service.
- [ ] Define lawful basis and retention periods.
- [ ] Add consent and controls for sensitive personal data.
- [ ] Add account-data export.
- [ ] Add account and data deletion.
- [ ] Add breach-response procedures.
- [ ] Review GDPR obligations for EU users.
- [ ] Review health-related product claims and applicable regulation.
- [ ] Complete a security and data-protection review.

## Current development-only values

- Android debug API URL: `http://10.0.2.2:8000`
- Android clear-text traffic: enabled
- Local model server: Ollama
- Docker-to-Ollama URL: `http://host.docker.internal:11434/v1`
- Local FastAPI-to-Ollama URL: `http://localhost:11434/v1`
- PostgreSQL development user: `aligna`
- PostgreSQL development database: `aligna`
- Shared development API key: temporary
- JWT access token duration: 30 minutes
- Email verification: not implemented
- Refresh tokens: not implemented
