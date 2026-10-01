# Aligna

Android fitness and wellbeing app with a Kotlin WebView shell, a FastAPI backend, Supabase PostgreSQL, and Azure-hosted AI.

## Body Studio

Progress → **Create body avatar** opens a four-view camera scan. Front, back, left and right photos are analysed on-device with MediaPipe Pose Landmarker. The scanner extracts body outlines and pose landmarks, combines front/back widths with side-view depth, and builds a rotatable Three.js avatar. Shoulders, torso taper, hips and limb proportions vary with the captured silhouette rather than a body-type preset.

This is a **prototype estimate of visible shape**, not photogrammetric reconstruction or a body-composition measurement. Clothing, camera angle and segmentation quality affect the result. It does not infer muscle mass, weight, body fat, facial identity or medical measurements. Faces, hands and surface detail are simplified. Consistency checks reject incomplete/cropped captures and substantially mismatched views, but cannot prove left/right/front/back orientation or measurement accuracy.

Photos and avatar parameters are stored locally in IndexedDB, scoped to the signed-in user. They are not sent to the backend or Llama. Deleting a scan removes the current account's saved photos and avatar. The earlier unscoped photo-only scanner's records are not migrated; take a new scan. The first analysis needs internet to download the pinned MediaPipe runtime/model. The 3D renderer is bundled.

## Android development

Open this repository root in Android Studio. Use the IDE's bundled JDK and your installed Android SDK. `local.properties` is machine-local and must not be committed.

The `alignaApiUrl` Gradle property points at the deployed test backend. To override it:

```sh
./gradlew assembleDebug -PalignaApiUrl=https://your-backend.example
```

The APK is produced at `app/build/outputs/apk/debug/app-debug.apk`. This is a debug/test build, not a Play Store release.

## Backend

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Configure database, JWT secret and model settings privately.
alembic upgrade head
fastapi run app/main.py
```

For Azure inference, set `MODEL_PROVIDER=azure`, `MODEL_BASE_URL` to the resource's `/models` endpoint, `MODEL_NAME` to the deployment name, and `MODEL_API_KEY` privately. Keep credentials on the server, never in the APK.

The current deployment uses Azure Container Apps in Italy North, Supabase project `qekxexjdnqevlgqksfaz`, and the user-approved shared `llama70b` deployment. The backend URL is configured in `gradle.properties`. The Supabase public CA certificate is bundled for verified TLS; passwords and keys are excluded. RLS is enabled on backend-owned tables; the backend uses its own authentication and user-scoped queries.

## Tests

```sh
npm ci
npm test
cd backend
python -m pytest -q
```

Scanner tests cover silhouette-dependent shape, camera aspect ratio, bad captures, four-view consistency, account separation, camera cancellation, permission failure and deletion isolation. Backend tests cover authentication boundaries and Azure/Ollama request formats.

The Android APK builds successfully. A browser security-policy failure prevented visual preview verification in the development session; real-phone camera quality and avatar appearance still need testing. No claim of measurement accuracy is made.

## Repository hygiene

Generated Gradle/IDE files previously tracked in the repository have been removed from tracking. Local databases, secrets, signing keys, build output and APKs are excluded. The original Mac project is not modified by this branch.

Three.js 0.172.0 is vendored with its MIT license. MediaPipe Tasks Vision 0.10.17 and the full pose model v1 are loaded from their pinned public distribution URLs.
