/**
 * Contract for the native Sherpa-ONNX Capacitor bridge.
 *
 * The Android build places the model files in app/src/main/assets/sherpa-onnx
 * and the native bridge loads them from that directory. Keeping this contract
 * separate from the Web Speech API means Android does not depend on Google's
 * installed speech provider.
 */
export type SherpaOnnxResult = {
  text?: string;
  isFinal?: boolean;
};

export type SherpaOnnxPlugin = {
  available: () => Promise<{ available: boolean }>;
  start: (options: {
    language: string;
    modelPath: string;
    sampleRate: number;
  }) => Promise<void>;
  stop: () => Promise<void>;
  addListener?: (
    eventName: 'partialResult' | 'result' | 'error',
    listener: (result: SherpaOnnxResult | { message?: string }) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
};

export const SHERPA_ONNX_MODEL_PATH = 'sherpa-onnx';
export const SHERPA_ONNX_LANGUAGE = 'en';
export const SHERPA_ONNX_SAMPLE_RATE = 16000;

// Capacitor's generated runtime exposes registerPlugin on Android. The
// optional lookup keeps web/PWA builds safe and allows the existing Web Speech
// implementation to remain the browser fallback.
export const getSherpaOnnxPlugin = (): SherpaOnnxPlugin | null => {
  if (typeof window === 'undefined') return null;
  const capacitor = (window as Window & {
    Capacitor?: {
      Plugins?: Record<string, SherpaOnnxPlugin>;
      registerPlugin?: (name: string) => SherpaOnnxPlugin;
      isNativePlatform?: () => boolean;
    };
  }).Capacitor;

  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.SherpaOnnx
    || capacitor.registerPlugin?.('SherpaOnnx')
    || null;
};
