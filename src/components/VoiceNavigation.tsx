import { useEffect } from 'react';
import { API_BASE_URL, authHeaders } from '../api/axios';
import { getVoiceModeEnabled, isVoiceOutputActive, navigateFromVoice, VOICE_DEBUG_EVENT, VOICE_MODE_CHANGED_EVENT, VOICE_OUTPUT_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';

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
    let audioChunkCount = 0;
    let lastChunkDebugAt = 0;

    const debug = (stage: string, message: string, detail?: unknown, level: 'info' | 'success' | 'warn' | 'error' = 'info') => {
      const formattedDetail = detail === undefined ? undefined : typeof detail === 'string' ? detail : JSON.stringify(detail);
      console.log(`[voice-debug] [${stage}] ${message}`, formattedDetail || '');
      window.dispatchEvent(new CustomEvent(VOICE_DEBUG_EVENT, {
        detail: {
          time: new Date().toLocaleTimeString(),
          stage,
          message,
          detail: formattedDetail,
          level,
        },
      }));
    };

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
      debug('BACKEND', 'Requesting temporary Deepgram token');
      const response = await fetch(`${API_BASE_URL}/api/voice/token`, {
        method: 'POST',
        headers: (() => {
          const headers = new Headers({
            'Content-Type': 'application/json',
            'X-KingsHall-Voice-Debug': '1',
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

      debug(
        'BACKEND',
        response.ok ? 'Token endpoint responded' : 'Token endpoint failed',
        { status: response.status, message: body.message, debug: body.debug },
        response.ok ? 'success' : 'error',
      );

      if (!response.ok) {
        throw new Error(body.message || `Voice token request failed (${response.status}).`);
      }

      if (!body.accessToken) {
        throw new Error('Voice service returned no access token.');
      }

      debug('BACKEND', 'Temporary Deepgram token received', { expiresIn: body.expiresIn ?? 300 }, 'success');
      return body.accessToken;
    };

    const start = async () => {
      if (starting || !enabled || stopped || voiceOutputActive || isVoiceOutputActive() || socket || recorder) return;
      starting = true;
      debug('START', 'Voice startup sequence started');

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Microphone access is unavailable in this APK WebView.');
        }

        debug('MIC', 'Requesting microphone stream');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (!stream) throw new Error('Microphone access was not available.');
        debug('MIC', 'Microphone stream acquired', {
          tracks: stream.getAudioTracks().map((track) => ({
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
          })),
        }, 'success');

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
        debug('WEBSOCKET', 'Connecting to Deepgram', {
          model: VOICE_MODEL,
          sampleRate: 16000,
          protocol: 'token',
        });

        socket = new WebSocket(deepgramUrl, ['token', token]);

        socket.onopen = async () => {
          debug('WEBSOCKET', 'Deepgram WebSocket opened', undefined, 'success');
          if (!socket || !stream || !enabled || stopped || voiceOutputActive || isVoiceOutputActive()) {
            cleanup();
            return;
          }

          try {
            if (!audioContext) {
              audioContext = new AudioContext();
              debug('AUDIO', 'AudioContext created', { sampleRate: audioContext.sampleRate, state: audioContext.state });
            }
            await audioContext.resume();
            debug('AUDIO', 'AudioContext resumed', { sampleRate: audioContext.sampleRate, state: audioContext.state }, 'success');

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
                audioChunkCount += 1;
                const now = Date.now();
                if (audioChunkCount === 1 || now - lastChunkDebugAt >= 3000) {
                  lastChunkDebugAt = now;
                  debug('AUDIO', 'Microphone audio is streaming', { chunksSent: audioChunkCount, bytes: pcm.byteLength }, 'success');
                }
              }
            };

            audioSource.connect(audioProcessor);
            audioProcessor.connect(audioGain);
            audioGain.connect(audioContext.destination);

            setStatus(true);
            debug('LISTENING', 'Listening state activated', undefined, 'success');
            keepAliveTimer = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              try { socket.send(JSON.stringify({ type: 'KeepAlive' })); } catch {}
            }
            }, 4000);
          } catch (error) {
            debug('AUDIO', 'Audio pipeline failed after WebSocket opened', error instanceof Error ? error.message : String(error), 'error');
            cleanup();
            scheduleStart(1500);
          }
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as DeepgramResult;
            if (message.type === 'Error') {
              debug('DEEPGRAM', 'Deepgram reported an error', message.description || 'Deepgram error', 'error');
              setStatus(false, message.description || 'Voice service error');
              return;
            }
            if (message.type === 'SpeechStarted') {
              debug('DEEPGRAM', 'Speech detected', undefined, 'success');
              setStatus(true);
              return;
            }

            const transcript = message.channel?.alternatives?.[0]?.transcript?.trim() || '';
            if (!transcript) return;

            setStatus(true, transcript);
            debug('TRANSCRIPT', message.is_final ? 'Transcript received' : 'Interim transcript', transcript, message.is_final ? 'success' : 'info');

            if (message.is_final && message.speech_final && transcript !== lastFinalTranscript) {
              lastFinalTranscript = transcript;
              const navigated = navigateFromVoice(transcript);
              debug('COMMAND', navigated ? 'Voice command matched' : 'No voice command matched', transcript, navigated ? 'success' : 'warn');
            }
          } catch (error) {
            debug('DEEPGRAM', 'Could not parse Deepgram message', error instanceof Error ? error.message : String(error), 'warn');
          }
        };

        socket.onerror = () => {
          debug('WEBSOCKET', 'Deepgram WebSocket error event fired', undefined, 'error');
          setStatus(false, 'Voice connection error');
        };

        socket.onclose = (event) => {
          debug('WEBSOCKET', 'Deepgram WebSocket closed', { code: event.code, reason: event.reason || 'none', wasClean: event.wasClean }, event.code === 1000 ? 'info' : 'error');
          cleanupAudio();
          socket = null;
          const closeReason = event.reason || (event.code !== 1000 ? `Voice connection closed (${event.code})` : '');
          setStatus(false, closeReason);
          if (enabled && !stopped && !voiceOutputActive && !isVoiceOutputActive()) {
            scheduleStart(700);
          }
        };
      } catch (error) {
        debug('START', 'Voice startup failed', error instanceof Error ? error.message : String(error), 'error');
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
      debug('MODE', enabled ? 'Voice mode enabled' : 'Voice mode disabled');
      if (enabled) {
        scheduleStart(100);
      } else {
        cleanup();
      }
    };

    debug('MODE', enabled ? 'Voice mode is enabled' : 'Voice mode is disabled');
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
