/*
 * Copy a downloaded Sherpa-ONNX model into the generated Capacitor Android
 * project. Model binaries are intentionally not committed to this repository.
 *
 * Usage:
 *   SHERPA_ONNX_MODEL_DIR=/path/to/model node scripts/prepare-sherpa-model.js
 */
const fs = require('fs');
const path = require('path');

const source = process.env.SHERPA_ONNX_MODEL_DIR;
const destination = path.resolve('android/app/src/main/assets/sherpa-onnx');

if (!source) {
  console.error('Sherpa-ONNX model not supplied. Set SHERPA_ONNX_MODEL_DIR to a streaming transducer model directory before building Android.');
  process.exit(1);
}
const requiredFiles = ['tokens.txt', 'encoder.onnx', 'decoder.onnx', 'joiner.onnx'];

const resolvedSource = path.resolve(source);
if (!fs.existsSync(resolvedSource) || !fs.statSync(resolvedSource).isDirectory()) {
  console.error(`Sherpa-ONNX model directory does not exist: ${resolvedSource}`);
  process.exit(1);
}

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(resolvedSource, file)));
if (missingFiles.length) {
  console.error(`Sherpa-ONNX model is missing: ${missingFiles.join(', ')}`);
  process.exit(1);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(resolvedSource, destination, { recursive: true });
console.log(`Packaged Sherpa-ONNX model in ${destination}`);
