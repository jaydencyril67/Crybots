import { useEffect } from 'react';
import { getNativeSpeechRecognition, getVoiceModeEnabled, isVoiceOutputActive, navigateFromVoice, requestVoiceMicrophoneAccess, VOICE_MODE_CHANGED_EVENT, VOICE_OUTPUT_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';
import { getSherpaOnnxPlugin, SHERPA_ONNX_LANGUAGE, SHERPA_ONNX_MODEL_PATH, SHERPA_ONNX_SAMPLE_RATE } from '../utils/sherpaOnnx';

type SpeechRecognitionResultLike = {
  isFinal?: boolean;
  0?: { transcript: string };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type NativeSpeechRecognition = {
  available?: () => Promise<{ available: boolean }>;
  start: (options: { language: string; maxResults: number; prompt: string; popup: boolean }) => Promise<{ matches?: string[] }>;
  stop?: () => Promise<void>;
};

type SherpaListener = { remove: () => Promise<void> };

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const VoiceNavigation = () => {
  useEffect(() => {
    let recognition: SpeechRecognitionLike | null = null;
    let nativeRecognition = getNativeSpeechRecognition() as NativeSpeechRecognition | null;
    let nativeListening = false;
    let nativeUnavailable = false;
    let sherpaRecognition = getSherpaOnnxPlugin();
    let sherpaListening = false;
    let sherpaUnavailable = false;
    let sherpaListeners: SherpaListener[] = [];
    let enabled = getVoiceModeEnabled();
    let stopped = false;
    let voiceOutputActive = isVoiceOutputActive();

    const setStatus = (listening: boolean, transcript = '') => {
      window.dispatchEvent(new CustomEvent(VOICE_STATUS_EVENT, { detail: { listening, transcript } }));
    };

    const removeSherpaListeners = () => {
      const listeners = sherpaListeners;
      sherpaListeners = [];
      listeners.forEach((listener) => { void listener.remove(); });
    };

    const start = () => {
      if (!enabled || stopped || voiceOutputActive || isVoiceOutputActive()) return;
      if (sherpaRecognition && !sherpaUnavailable) {
        if (sherpaListening) return;
        sherpaListening = true;
        setStatus(true);
        void sherpaRecognition.start({
          language: SHERPA_ONNX_LANGUAGE,
          modelPath: SHERPA_ONNX_MODEL_PATH,
          sampleRate: SHERPA_ONNX_SAMPLE_RATE,
        }).catch(() => {
          sherpaUnavailable = true;
          sherpaRecognition = null;
          sherpaListening = false;
          removeSherpaListeners();
          setStatus(false);
          setup();
        });
        return;
      }
      if (nativeRecognition && !nativeUnavailable) {
        if (nativeListening) return;
        nativeListening = true;
        setStatus(true);
        void nativeRecognition.start({ language: 'en-US', maxResults: 3, prompt: 'Say a KingsHall page or say Kings for help.', popup: true })
          .then((result) => {
            const transcript = result.matches?.[0]?.trim();
            if (transcript) {
              setStatus(true, transcript);
              navigateFromVoice(transcript);
            }
          })
          .catch(() => {
            // Some Android devices expose the native bridge but have no installed
            // speech engine. Fall back to the Web Speech API instead of retrying
            // the failing Google recognizer indefinitely.
            nativeUnavailable = true;
            nativeRecognition = null;
            setStatus(false);
            setup();
          })
          .finally(() => {
            nativeListening = false;
            if (!nativeUnavailable) {
              setStatus(false);
              if (enabled && !stopped && !voiceOutputActive && !isVoiceOutputActive()) window.setTimeout(start, 250);
            }
          });
        return;
      }
      if (!recognition) return;
      try {
        recognition.start();
        setStatus(true);
      } catch {
        // Recognition is already running or unavailable.
      }
    };

    function setup() {
      if (sherpaRecognition && !sherpaUnavailable) {
        if (!sherpaRecognition.addListener) {
          sherpaUnavailable = true;
          sherpaRecognition = null;
          setup();
          return;
        }
        const handleSherpaPartialResult = (result: { text?: string }) => {
          const transcript = result.text?.trim();
          if (transcript && !voiceOutputActive && !isVoiceOutputActive()) setStatus(true, transcript);
        };
        const handleSherpaResult = (result: { text?: string }) => {
          const transcript = result.text?.trim();
          if (!transcript || voiceOutputActive || isVoiceOutputActive()) return;
          setStatus(true, transcript);
          navigateFromVoice(transcript);
        };
        const handleSherpaError = () => {
          sherpaUnavailable = true;
          sherpaRecognition = null;
          sherpaListening = false;
          removeSherpaListeners();
          setStatus(false);
          setup();
        };
        void Promise.all([
          sherpaRecognition.addListener('partialResult', handleSherpaPartialResult),
          sherpaRecognition.addListener('result', handleSherpaResult),
          sherpaRecognition.addListener('error', handleSherpaError),
        ]).then((listeners) => {
          sherpaListeners = listeners.filter((listener): listener is SherpaListener => Boolean(listener));
          if (enabled) void requestVoiceMicrophoneAccess().then((granted) => {
            if (granted) start();
            else setStatus(false);
          });
        }).catch(() => {
          sherpaUnavailable = true;
          sherpaRecognition = null;
          setup();
        });
        return;
      }
      if (nativeRecognition && !nativeUnavailable) {
        const useNativeRecognition = (available: boolean) => {
          if (!available) {
            nativeUnavailable = true;
            nativeRecognition = null;
            setup();
            return;
          }
          if (enabled) void requestVoiceMicrophoneAccess().then((granted) => {
            if (granted) start();
            else setStatus(false);
          });
        };
        if (nativeRecognition.available) {
          void nativeRecognition.available()
            .then(({ available }) => useNativeRecognition(available))
            .catch(() => useNativeRecognition(false));
        } else {
          useNativeRecognition(true);
        }
        return;
      }
      const speechWindow = window as SpeechWindow;
      const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
      if (!Recognition) {
        setStatus(false);
        return;
      }
      recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        if (voiceOutputActive || isVoiceOutputActive()) return;
        const result = event.results[event.results.length - 1];
        const transcript = result?.[0]?.transcript;
        if (transcript) {
          setStatus(true, transcript);
          if (result?.isFinal) navigateFromVoice(transcript);
        }
      };
      recognition.onend = () => {
        setStatus(false);
        if (enabled && !stopped && !voiceOutputActive && !isVoiceOutputActive()) window.setTimeout(start, 250);
      };
      recognition.onerror = () => setStatus(false);
      if (enabled) {
        void requestVoiceMicrophoneAccess().then((granted) => {
          if (!granted) setStatus(false);
          if (granted) start();
        });
      }
    }

    const handleVoiceOutput = (event: Event) => {
      voiceOutputActive = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      if (voiceOutputActive) {
        recognition?.stop();
        sherpaListening = false;
        void sherpaRecognition?.stop();
        void nativeRecognition?.stop?.();
      } else if (enabled && !stopped) window.setTimeout(start, 350);
    };

    const handleModeChange = () => {
      enabled = getVoiceModeEnabled();
      if (enabled && nativeUnavailable) nativeUnavailable = false;
      if (enabled && sherpaUnavailable) {
        sherpaUnavailable = false;
        sherpaRecognition = getSherpaOnnxPlugin();
      }
      if (enabled) {
        if (!recognition) setup();
        else start();
      } else {
        recognition?.stop();
        sherpaListening = false;
        void sherpaRecognition?.stop();
        void nativeRecognition?.stop?.();
        setStatus(false);
      }
    };

    setup();
    window.addEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
    window.addEventListener(VOICE_OUTPUT_EVENT, handleVoiceOutput);
    return () => {
      stopped = true;
      recognition?.stop();
      sherpaListening = false;
      void sherpaRecognition?.stop();
      void nativeRecognition?.stop?.();
      removeSherpaListeners();
      setStatus(false);
      window.removeEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
      window.removeEventListener(VOICE_OUTPUT_EVENT, handleVoiceOutput);
    };
  }, []);

  return null;
};

export default VoiceNavigation;
