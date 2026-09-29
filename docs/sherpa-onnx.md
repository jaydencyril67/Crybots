# Offline Android voice mode

Android voice mode is designed to use a native Sherpa-ONNX Capacitor bridge rather than the Google speech provider. The bridge must implement the contract in `src/utils/sherpaOnnx.ts` and emit `partialResult`, `result`, and `error` events.

## Model packaging

Model binaries are not stored in Git. Before building an APK, set `SHERPA_ONNX_MODEL_DIR` to a downloaded Sherpa-ONNX Android-compatible model directory. It must contain at least `tokens.txt`; the native bridge must use the remaining files required by the selected model type (for example an online transducer's encoder, decoder, and joiner files).

```sh
SHERPA_ONNX_MODEL_DIR=/path/to/model node scripts/prepare-sherpa-model.js
```

The script copies the model to `android/app/src/main/assets/sherpa-onnx`. The CI workflows download and package the small English streaming model automatically. For a local build, download an Android-compatible model and set `SHERPA_ONNX_MODEL_DIR` before running the script; the build intentionally fails when the model is missing so an APK cannot be produced with a non-working voice mode.

The model is local at runtime and requires no Azure, Deepgram, Google account, API key, or network connection. The one-time build download needs internet access. It does increase the APK size, so use a small English model appropriate for the device's memory and CPU.
