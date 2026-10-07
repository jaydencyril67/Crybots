import { useEffect } from 'react';
import { API_BASE_URL, authHeaders } from '../api/axios';
import { getVoiceModeEnabled, isVoiceOutputActive, navigateFromVoice, VOICE_MODE_CHANGED_EVENT, VOICE_OUTPUT_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';

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

const downsampleTo16kPcm = (input: Float32Array, inputSampleRate: number) => {
  const targetSampleRate = 16000;
  if (inputSampleRate === targetSampleRate) {
    const pcm = new Int16Array(input.length);
    for (let index = 0; index < input.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, input[index]));
      pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return pcm;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const pcm = new Int16Array(outputLength);

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const sourcePosition = outputIndex * ratio;
    const sourceIndex = Math.floor(sourcePosition);
    const nextIndex = Math.min(sourceIndex + 1, input.length - 1);
    const fraction = sourcePosition - sourceIndex;
    const sample = input[sourceIndex] + (input[nextIndex] - input[sourceIndex]) * fraction;
    const clamped = Math.max(-1, Math.min(1, sample));
    pcm[outputIndex] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return pcm;
};

const VoiceNavigation = () => {
  useEffect(() => {
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let audioContext: AudioContext | null = null;
    let audioSource: MediaStreamAudioSourceNode | null = null;
    let audioProcessor: ScriptProcessorNode | null = null;
    let audioGain: GainNode | null = null;
    let socket: WebSocket | null = null;
    let enabled = getVoiceModeEnabled();
    let stopped = false;
    let voiceOutputActive = isVoiceOutputActive();
    let starting = false;
    let reconnectTimer: number | null = null;
    let lastFinalTranscript = '';
    let keepAliveTimer: number | null = null;

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

      try { audioProcessor?.disconnect(); } catch {}
      try { audioSource?.disconnect(); } catch {}
      try { audioGain?.disconnect(); } catch {}
      audioProcessor = null;
      audioSource = null;
      audioGain = null;

      if (audioContext) {
        void audioContext.close().catch(() => undefined);
      }
      audioContext = null;

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
      if (keepAliveTimer !== null) {
        window.clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
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
        headers: (() => {
          const headers = new Headers({
            'Content-Type': 'application/json',
          });
          const auth = authHeaders();
          if (auth.Authorization) headers.set('Authorization', auth.Authorization);
          return headers;
        })(),
      });

      const body = await response.json().catch(() => ({})) as {
        message?: string;
        accessToken?: string;
        expiresIn?: number;
        debug?: Record<string, unknown>;
      };

      if (!response.ok) {
        throw new Error(body.message || `Voice token request failed (${response.status}).`);
      }

      if (!body.accessToken) {
        throw new Error('Voice service returned no access token.');
      }

      return body.accessToken;
    };

    const start = async () => {
      if (starting || !enabled || stopped || voiceOutputActive || isVoiceOutputActive() || socket || recorder) return;
      starting = true;

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Microphone access is unavailable in this APK WebView.');
        }

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (error) {
          throw error;
        }
        if (!stream) throw new Error('Microphone access was not available.');
        const token = await fetchToken();
        if (!enabled || stopped || voiceOutputActive || isVoiceOutputActive()) return;

        const params = new URLSearchParams({
          model: VOICE_MODEL,
          language: 'en-US',
          smart_format: 'true',
          interim_results: 'true',
          endpointing: '300',
          utterance_end_ms: '1000',
          punctuate: 'true',
          encoding: 'linear16',
          sample_rate: '16000',
          channels: '1',
          vad_events: 'true',
        });

        ['KingsHall', 'Kings Hall', 'portfolio', 'notifications', 'transactions', 'withdrawals', 'rentals', 'commerce', 'webhooks', 'API keys'].forEach((term) => {
          params.append('keyterm', term);
        });

        const deepgramUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
        socket = new WebSocket(deepgramUrl, ['bearer', token]);

        socket.onopen = async () => {
          if (!socket || !stream || !enabled || stopped || voiceOutputActive || isVoiceOutputActive()) {
            cleanup();
            return;
          }

          try {
            if (!audioContext) {
              audioContext = new AudioContext();
            }
            await audioContext.resume();

            audioSource = audioContext.createMediaStreamSource(stream);
          audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          audioGain = audioContext.createGain();
          audioGain.gain.value = 0;

            audioProcessor.onaudioprocess = (event) => {
              if (socket?.readyState !== WebSocket.OPEN) return;
              const input = event.inputBuffer.getChannelData(0);
              const pcm = downsampleTo16kPcm(input, audioContext?.sampleRate || 16000);
              if (pcm.byteLength > 0 && socket?.readyState === WebSocket.OPEN) {
                socket.send(pcm.buffer);
              }
            };

            audioSource.connect(audioProcessor);
            audioProcessor.connect(audioGain);
            audioGain.connect(audioContext.destination);

            setStatus(true);
            keepAliveTimer = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              try { socket.send(JSON.stringify({ type: 'KeepAlive' })); } catch {}
            }
            }, 4000);
          } catch (error) {
            cleanup();
            scheduleStart(1500);
          }
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as DeepgramResult;
            if (message.type === 'Error') {
              setStatus(false, message.description || 'Voice service error');
              return;
            }
            if (message.type === 'SpeechStarted') {
              setStatus(true);
              return;
            }

            const transcript = message.channel?.alternatives?.[0]?.transcript?.trim() || '';
            if (!transcript) return;

            setStatus(true, transcript);

            if (message.is_final && message.speech_final && transcript !== lastFinalTranscript) {
              lastFinalTranscript = transcript;
              const navigated = navigateFromVoice(transcript);
            }
          } catch (error) {
          }
        };

        socket.onerror = () => {
          setStatus(false, 'Voice connection error');
        };

        socket.onclose = (event) => {
          cleanupAudio();
          socket = null;
          const closeReason = event.reason || (event.code !== 1000 ? `Voice connection closed (${event.code})` : '');
          setStatus(false, closeReason);
          if (enabled && !stopped && !voiceOutputActive && !isVoiceOutputActive()) {
            scheduleStart(700);
          }
        };
      } catch (error) {
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
