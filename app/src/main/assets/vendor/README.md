# Renderer dependency

`three.min.js` bundles Three.js 0.172.0 as the global `THREE`, produced from the official package's `build/three.module.js` with esbuild (IIFE, minified). See `THREE-LICENSE.txt`.

MediaPipe is loaded by `js/body-scan.js` using Tasks Vision 0.10.17 and pose_landmarker_full/float16/1. Analysis executes on-device; no capture image is submitted to a model API.
