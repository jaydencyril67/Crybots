import { useEffect } from 'react';
import { getVoiceModeEnabled, navigateFromVoice, VOICE_MODE_CHANGED_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';

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

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const VoiceNavigation = () => {
  useEffect(() => {
    let recognition: SpeechRecognitionLike | null = null;
    let enabled = getVoiceModeEnabled();
    let stopped = false;

    const setStatus = (listening: boolean, transcript = '') => {
      window.dispatchEvent(new CustomEvent(VOICE_STATUS_EVENT, { detail: { listening, transcript } }));
    };

    const requestMicrophoneAccess = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        setStatus(false);
        return false;
      }
    };

    const start = () => {
      if (!enabled || stopped || !recognition) return;
      try {
        recognition.start();
        setStatus(true);
      } catch {
        // Recognition is already running or unavailable.
      }
    };

    const setup = () => {
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
        const result = event.results[event.results.length - 1];
        const transcript = result?.[0]?.transcript;
        if (transcript) {
          setStatus(true, transcript);
          if (result?.isFinal) navigateFromVoice(transcript);
        }
      };
      recognition.onend = () => {
        setStatus(false);
        if (enabled && !stopped) window.setTimeout(start, 250);
      };
      recognition.onerror = () => setStatus(false);
      if (enabled) {
        void requestMicrophoneAccess().then((granted) => {
          if (granted) start();
        });
      }
    };

    const handleModeChange = () => {
      enabled = getVoiceModeEnabled();
      if (enabled) {
        if (!recognition) setup();
        else start();
      } else {
        recognition?.stop();
        setStatus(false);
      }
    };

    setup();
    window.addEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
    return () => {
      stopped = true;
      recognition?.stop();
      setStatus(false);
      window.removeEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
    };
  }, []);

  return null;
};

export default VoiceNavigation;
