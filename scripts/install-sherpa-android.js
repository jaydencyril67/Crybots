/*
 * Add the native Sherpa-ONNX bridge to the generated Capacitor Android project.
 * The generated Android project is build output, so this script is run after
 * `npx cap add android` in CI and during local Android builds.
 */
const fs = require('fs');
const https = require('https');
const path = require('path');

const android = path.resolve('android');
const app = path.join(android, 'app');
const sourceDir = path.join(app, 'src/main/java/com/kingshall/exchange');
const libsDir = path.join(app, 'libs');
const pluginPath = path.join(sourceDir, 'SherpaOnnxPlugin.kt');
const activityJavaPath = path.join(sourceDir, 'MainActivity.java');
const activityKotlinPath = path.join(app, 'src/main/java/com/kingshall/exchange/MainActivity.kt');
const gradlePath = path.join(app, 'build.gradle');
const rootGradlePath = path.join(android, 'build.gradle');
const manifestPath = path.join(app, 'src/main/AndroidManifest.xml');
const aarPath = path.join(libsDir, 'sherpa-onnx.aar');
const aarUrl = process.env.SHERPA_ONNX_AAR_URL
  || 'https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.8/sherpa-onnx-1.13.8.aar';
const jniLibsDir = path.join(app, 'src/main/jniLibs');

if (!fs.existsSync(android) || !fs.existsSync(gradlePath)) {
  throw new Error('Android project not found. Run `npx cap add android` first.');
}

fs.mkdirSync(sourceDir, { recursive: true });
fs.mkdirSync(libsDir, { recursive: true });
fs.mkdirSync(jniLibsDir, { recursive: true });

fs.writeFileSync(pluginPath, `package com.kingshall.exchange

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.k2fsa.sherpa.onnx.FeatureConfig
import com.k2fsa.sherpa.onnx.OnlineModelConfig
import com.k2fsa.sherpa.onnx.OnlineRecognizer
import com.k2fsa.sherpa.onnx.OnlineRecognizerConfig
import java.util.concurrent.Executors

@CapacitorPlugin(
    name = "SherpaOnnx",
    permissions = [Permission(strings = [Manifest.permission.RECORD_AUDIO], alias = "microphone")]
)
class SherpaOnnxPlugin : Plugin() {
    private val executor = Executors.newSingleThreadExecutor()
    @Volatile private var running = false
    private var recorder: AudioRecord? = null
    private var recognizer: OnlineRecognizer? = null
    private var stream: com.k2fsa.sherpa.onnx.OnlineStream? = null

    @PluginMethod
    fun available(call: PluginCall) {
        val assets = context.assets.list("sherpa-onnx") ?: emptyArray()
        val available = assets.any { it == "tokens.txt" } && assets.any { it.contains("encoder") }
        call.resolve(JSObject().put("available", available))
    }

    @PluginMethod
    fun start(call: PluginCall) {
        if (running) { call.resolve(); return }
        if (!hasRequiredPermissions()) {
            requestPermissionForAlias("microphone", call, "microphonePermission");
            return
        }
        startRecognition(call)
    }

    @PermissionCallback
    private fun microphonePermission(call: PluginCall) {
        if (hasRequiredPermissions()) startRecognition(call)
        else call.reject("Microphone permission is required")
    }

    private fun startRecognition(call: PluginCall) {
        try {
            val dir = "sherpa-onnx"
            val model = OnlineModelConfig(
                tokens = "$dir/tokens.txt",
                transducer = com.k2fsa.sherpa.onnx.OnlineTransducerModelConfig(
                    encoder = "$dir/encoder.onnx",
                    decoder = "$dir/decoder.onnx",
                    joiner = "$dir/joiner.onnx"
                )
            )
            val config = OnlineRecognizerConfig(
                featConfig = FeatureConfig(sampleRate = 16000, featureDim = 80),
                modelConfig = model
            )
            recognizer = OnlineRecognizer(context.assets, config)
            stream = recognizer!!.createStream()
            val buffer = AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
            recorder = AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, 16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, maxOf(buffer * 2, 4096))
            running = true
            recorder!!.startRecording()
            executor.execute { readAudio() }
            call.resolve()
        } catch (error: Exception) {
            stopRecognition()
            call.reject(error.message ?: "Unable to start offline recognition")
        }
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        stopRecognition()
        call.resolve()
    }

    private fun readAudio() {
        val samples = ShortArray(2048)
        while (running) {
            val count = recorder?.read(samples, 0, samples.size) ?: -1
            if (count <= 0) continue
            val audio = FloatArray(count) { samples[it] / 32768.0f }
            stream?.acceptWaveform(audio, 16000)
            while (recognizer?.isReady(stream!!) == true) {
                recognizer?.decode(stream!!)
                val text = recognizer?.getResult(stream!!)?.text ?: ""
                notifyListeners("partialResult", JSObject().put("text", text))
                if (recognizer?.isEndpoint(stream!!) == true && text.isNotBlank()) {
                    notifyListeners("result", JSObject().put("text", text).put("isFinal", true))
                    recognizer?.reset(stream!!)
                }
            }
        }
    }

    private fun stopRecognition() {
        running = false
        recorder?.runCatching { stop() }
        recorder?.release()
        recorder = null
        recognizer?.release()
        recognizer = null
        stream = null
    }
}
`);

const activityPath = fs.existsSync(activityKotlinPath) ? activityKotlinPath : activityJavaPath;
if (fs.existsSync(activityPath)) {
  let activity = fs.readFileSync(activityPath, 'utf8');
  if (!activity.includes('SherpaOnnxPlugin')) {
    if (activityPath.endsWith('.kt')) {
      activity = activity.replace(/(package [^\n]+\n)/, '$1\nimport com.kingshall.exchange.SherpaOnnxPlugin\n');
      activity = activity.replace(/class MainActivity : BridgeActivity\(\) \{/, 'class MainActivity : BridgeActivity() {\n    override fun onCreate(savedInstanceState: android.os.Bundle?) {\n        registerPlugin(SherpaOnnxPlugin::class.java)\n        super.onCreate(savedInstanceState)\n    }');
    } else {
      activity = activity.replace(/(package [^;]+;\n)/, '$1\nimport com.kingshall.exchange.SherpaOnnxPlugin;\n');
      activity = activity.replace(/public class MainActivity extends BridgeActivity \{/, 'public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(SherpaOnnxPlugin.class);\n        super.onCreate(savedInstanceState);\n    }');
    }
    fs.writeFileSync(activityPath, activity);
  }
}

let rootGradle = fs.readFileSync(rootGradlePath, 'utf8');
if (!rootGradle.includes('kotlin-gradle-plugin')) {
  rootGradle = rootGradle.replace(
    /(dependencies \{)/,
    '$1\n        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21"',
  );
  fs.writeFileSync(rootGradlePath, rootGradle);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');
if (!gradle.includes("org.jetbrains.kotlin.android")) {
  gradle = `${gradle}\n\napply plugin: "org.jetbrains.kotlin.android"\n\nandroid {\n    kotlinOptions {\n        jvmTarget = "21"\n    }\n}\n`;
}
if (!gradle.includes('sherpa-onnx.aar')) {
  gradle = gradle.replace(/(repositories \{)/, '$1\n        flatDir { dirs "libs" }');
  gradle = gradle.replace(/(dependencies \{)/, '$1\n    implementation(name: "sherpa-onnx", ext: "aar")');
}
fs.writeFileSync(gradlePath, gradle);

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Android manifest not found: ${manifestPath}`);
}
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android.permission.RECORD_AUDIO')) {
  manifest = manifest.replace(
    /(<manifest[^>]*>\s*)/,
    '$1    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n',
  );
}
if (!manifest.includes('android.permission.MODIFY_AUDIO_SETTINGS')) {
  manifest = manifest.replace(
    /(<manifest[^>]*>\\s*)/,
    '$1    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n',
  );
}
fs.writeFileSync(manifestPath, manifest);

const nativeSource = process.env.SHERPA_ONNX_ANDROID_LIB_DIR;
if (nativeSource) {
  const resolvedNativeSource = path.resolve(nativeSource);
  if (!fs.existsSync(resolvedNativeSource)) {
    throw new Error(`Sherpa-ONNX Android library directory does not exist: ${resolvedNativeSource}`);
  }
  fs.cpSync(resolvedNativeSource, jniLibsDir, { recursive: true });
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        download(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Unable to download Sherpa-ONNX AAR (HTTP ${response.statusCode})`));
        return;
      }
      const output = fs.createWriteStream(destination);
      response.pipe(output);
      output.on('finish', () => output.close(resolve));
      output.on('error', reject);
    }).on('error', reject);
  });
}

if (!fs.existsSync(aarPath)) {
  download(aarUrl, aarPath)
    .then(() => console.log(`Downloaded Sherpa-ONNX AAR to ${aarPath}`))
    .catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
