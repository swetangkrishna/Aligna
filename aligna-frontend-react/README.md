# Aligna Frontend React

This is the actual frontend project version of the redesign.

## Stack
- React
- TypeScript
- Vite
- Three.js via @react-three/fiber
- drei
- Framer Motion
- Lucide

## Existing backend/native contracts
The current uploaded Aligna frontend references these existing scripts:

- `js/aligna-actions.js`
- `js/aligna-action-adapter.js`
- `js/aligna-state-sync.js`

This React project does not change your FastAPI/PostgreSQL backend or Android/Kotlin shell.

## Development
```bash
npm install
npm run dev
```

## Android build
Put this folder at the repository root, e.g.

```text
Aligna/
├── app/
├── backend/
└── frontend/
```

Then:
```bash
cd frontend
npm install
npm run build:android
```

The Android Vite mode writes the production frontend into:

```text
app/src/main/assets/
```

Your existing Android Activity can continue loading:

```text
file:///android_asset/index.html
```

## Migration
This package is intentionally frontend-only.

Next wiring steps:
1. Replace the demo page data with selectors reading the existing `aligna_state`.
2. Route current Android bridge calls through `src/lib/nativeBridge.ts`.
3. Port the existing body scan overlay as a React modal without changing the native camera/backend.
4. Connect current AI action confirmation events to React components.
5. Keep backend APIs unchanged.

## 3D assets
Current scenes are true Three.js scenes. For production-quality models, drop optimized GLB files in:

```text
public/models/
```

and replace the procedural body/meal meshes with `useGLTF()`.
