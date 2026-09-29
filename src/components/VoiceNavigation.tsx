import { useEffect } from 'react';
import { getVoiceModeEnabled, isVoiceOutputActive, navigateFromVoice, requestVoiceMicrophoneAccess, VOICE_MODE_CHANGED_EVENT, VOICE_OUTPUT_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';

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
    let voiceOutputActive = isVoiceOutputActive();

    const setStatus = (listening: boolean, transcript = '') => {
      window.dispatchEvent(new CustomEvent(VOICE_STATUS_EVENT, { detail: { listening, transcript } }));
    };

    const start = () => {
      if (!enabled || stopped || voiceOutputActive || isVoiceOutputActive() || !recognition) return;
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
    };

    const handleVoiceOutput = (event: Event) => {
      voiceOutputActive = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      if (voiceOutputActive) recognition?.stop();
      else if (enabled && !stopped) window.setTimeout(start, 350);
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
    window.addEventListener(VOICE_OUTPUT_EVENT, handleVoiceOutput);
    return () => {
      stopped = true;
      recognition?.stop();
      setStatus(false);
      window.removeEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
      window.removeEventListener(VOICE_OUTPUT_EVENT, handleVoiceOutput);
    };
  }, []);

  return null;
};

export default VoiceNavigation;
