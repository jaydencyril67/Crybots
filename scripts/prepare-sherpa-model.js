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
const resolvedSource = path.resolve(source);
if (!fs.existsSync(resolvedSource) || !fs.statSync(resolvedSource).isDirectory()) {
  console.error(`Sherpa-ONNX model directory does not exist: ${resolvedSource}`);
  process.exit(1);
}

const modelFiles = {
  tokens: 'tokens.txt',
  encoder: findModelFile('encoder.onnx', /^encoder(?:[-_].*)?\.onnx$/i),
  decoder: findModelFile('decoder.onnx', /^decoder(?:[-_].*)?\.onnx$/i),
  joiner: findModelFile('joiner.onnx', /^joiner(?:[-_].*)?\.onnx$/i),
};
const missingFiles = Object.entries(modelFiles)
  .filter(([, file]) => !file)
  .map(([name]) => name === 'tokens' ? 'tokens.txt' : `${name}*.onnx`);
if (!fs.existsSync(path.join(resolvedSource, modelFiles.tokens))) {
  missingFiles.unshift('tokens.txt');
}
if (missingFiles.length) {
  console.error(`Sherpa-ONNX model is missing: ${missingFiles.join(', ')}`);
  process.exit(1);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(resolvedSource, destination, { recursive: true });
for (const name of ['encoder', 'decoder', 'joiner']) {
  const file = modelFiles[name];
  if (file !== `${name}.onnx`) {
    fs.copyFileSync(path.join(resolvedSource, file), path.join(destination, `${name}.onnx`));
  }
}
console.log(`Packaged Sherpa-ONNX model in ${destination}`);

function findModelFile(expectedName, pattern) {
  if (fs.existsSync(path.join(resolvedSource, expectedName))) {
    return expectedName;
  }
  const candidates = fs.readdirSync(resolvedSource)
    .filter(file => pattern.test(file))
    .sort();
  return candidates[0];
}
