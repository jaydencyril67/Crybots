import { useEffect } from 'react';
import { API_BASE_URL, authHeaders } from '../api/axios';
import { getVoiceModeEnabled, isVoiceOutputActive, navigateFromVoice, requestVoiceMicrophoneAccess, VOICE_MODE_CHANGED_EVENT, VOICE_OUTPUT_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';

type DeepgramResult = {
  type?: string;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: {
    alternatives?: Array<{ transcript?: string }>;
  };
  description?: string;
};

const VOICE_MODEL = 'nova-3';

const getRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

const VoiceNavigation = () => {
  useEffect(() => {
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let socket: WebSocket | null = null;
    let enabled = getVoiceModeEnabled();
    let stopped = false;
    let voiceOutputActive = isVoiceOutputActive();
    let starting = false;
    let reconnectTimer: number | null = null;
    let lastFinalTranscript = '';

    const setStatus = (listening: boolean, transcript = '') => {
      window.dispatchEvent(new CustomEvent(VOICE_STATUS_EVENT, { detail: { listening, transcript } }));
    };

    const clearReconnect = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const cleanupAudio = () => {
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch {}
      }
      recorder = null;
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    const cleanupSocket = () => {
      if (socket) {
        try {
          socket.close();
        } catch {}
      }
      socket = null;
    };

    const cleanup = () => {
      clearReconnect();
      cleanupAudio();
      cleanupSocket();
      setStatus(false);
    };

    const scheduleStart = (delay = 350) => {
      clearReconnect();
      if (!enabled || stopped || voiceOutputActive || isVoiceOutputActive()) return;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void start();
      }, delay);
    };

    const fetchToken = async () => {
      const response = await fetch(`${API_BASE_URL}/api/voice/token`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message || 'Unable to start the voice service.');
      }

      const data = await response.json() as { accessToken?: string };
      if (!data.accessToken) throw new Error('Voice service returned no access token.');
      return data.accessToken;
    };

    const start = async () => {
      if (starting || !enabled || stopped || voiceOutputActive || isVoiceOutputActive() || socket || recorder) return;
      starting = true;

      try {
        const granted = await requestVoiceMicrophoneAccess();
        if (!granted) {
          setStatus(false);
          return;
        }

        const token = await fetchToken();
        if (!enabled || stopped || voiceOutputActive || isVoiceOutputActive()) return;

        const mimeType = getRecorderMimeType();
        if (!mimeType) throw new Error('This device does not support browser audio recording.');

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!stream) throw new Error('Microphone access was not available.');

        const params = new URLSearchParams({
          model: VOICE_MODEL,
          language: 'en-US',
          smart_format: 'true',
          interim_results: 'true',
          endpointing: '300',
          punctuate: 'true',
        });

        ['KingsHall', 'Kings Hall', 'portfolio', 'notifications', 'transactions', 'withdrawals', 'rentals', 'commerce', 'webhooks', 'API keys'].forEach((term) => {
          params.append('keyterm', term);
        });

        socket = new WebSocket(`wss://api.deepgram.com/v1/listen?${params.toString()}`, ['token', token]);

        socket.onopen = () => {
          if (!socket || !stream || !enabled || stopped || voiceOutputActive || isVoiceOutputActive()) {
            cleanup();
            return;
          }

          const options: MediaRecorderOptions = { mimeType };
          recorder = new MediaRecorder(stream, options);
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          };
          recorder.onerror = () => {
            setStatus(false);
          };
          recorder.onstop = () => {
            if (socket?.readyState === WebSocket.OPEN) {
              try { socket.send(JSON.stringify({ type: 'Finalize' })); } catch {}
            }
          };

          recorder.start(250);
          setStatus(true);
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as DeepgramResult;
            if (message.type === 'Error') {
              console.error('[voice/deepgram]', message.description || 'Deepgram error');
              return;
            }

            const transcript = message.channel?.alternatives?.[0]?.transcript?.trim() || '';
            if (!transcript) return;

            setStatus(true, transcript);

            if (message.is_final && message.speech_final && transcript !== lastFinalTranscript) {
              lastFinalTranscript = transcript;
              navigateFromVoice(transcript);
            }
          } catch {
            // Ignore non-JSON or malformed Deepgram messages.
          }
        };

        socket.onerror = () => {
          setStatus(false);
        };

        socket.onclose = () => {
          cleanupAudio();
          socket = null;
          setStatus(false);
          if (enabled && !stopped && !voiceOutputActive && !isVoiceOutputActive()) {
            scheduleStart(700);
          }
        };
      } catch (error) {
        console.error('[voice] startup failed', error);
        cleanup();
        if (enabled && !stopped && !voiceOutputActive && !isVoiceOutputActive()) {
          scheduleStart(1500);
        }
      } finally {
        starting = false;
      }
    };

    const handleVoiceOutput = (event: Event) => {
      voiceOutputActive = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      if (voiceOutputActive) {
        cleanup();
      } else if (enabled && !stopped) {
        scheduleStart(350);
      }
    };

    const handleModeChange = () => {
      enabled = getVoiceModeEnabled();
      if (enabled) {
        scheduleStart(100);
      } else {
        cleanup();
      }
    };

    void start();
    window.addEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
    window.addEventListener(VOICE_OUTPUT_EVENT, handleVoiceOutput);

    return () => {
      stopped = true;
      cleanup();
      window.removeEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
      window.removeEventListener(VOICE_OUTPUT_EVENT, handleVoiceOutput);
    };
  }, []);

  return null;
};

export default VoiceNavigation;
