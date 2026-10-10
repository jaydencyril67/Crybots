import { useEffect, useRef, useState } from 'react';
import api, { API_BASE_URL, authHeaders } from '../api/axios';
import { releaseMediaOutput } from '../utils/mediaAudio';
import { askVoiceAssistant, getVoiceModeEnabled, isVoiceOutputActive, logVoiceDebug, speakVoiceResponse, VOICE_API_CONFIRMATION_EVENT, VOICE_MODE_CHANGED_EVENT, VOICE_OUTPUT_EVENT, VOICE_STATUS_EVENT } from '../utils/voiceNavigation';

type PendingBrainApiAction = {
  type: 'api';
  operation: 'bot_activate' | 'bot_deactivate' | 'bot_withdraw';
  target: string;
  parameters?: Record<string, string>;
  requiresConfirmation: true;
};

const actionTitle = (action: PendingBrainApiAction) => {
  if (action.operation === 'bot_activate') return 'Activate bot investment';
  if (action.operation === 'bot_deactivate') return 'Request bot deactivation';
  return 'Withdraw available bot funds';
};

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
  const [pendingApiAction, setPendingApiAction] = useState<PendingBrainApiAction | null>(null);
  const [executingApiAction, setExecutingApiAction] = useState(false);
  const pendingApiActionRef = useRef<PendingBrainApiAction | null>(null);

  const clearPendingApiAction = () => {
    pendingApiActionRef.current = null;
    setPendingApiAction(null);
  };

  useEffect(() => {
    const handleApiConfirmationRequest = (event: Event) => {
      const raw = (event as CustomEvent<unknown>).detail;
      if (!raw || typeof raw !== 'object') return;
      const candidate = raw as Partial<PendingBrainApiAction>;
      const operations = ['bot_activate', 'bot_deactivate', 'bot_withdraw'];
      if (
        candidate.type !== 'api'
        || !candidate.requiresConfirmation
        || !candidate.target
        || !/^[a-z0-9][a-z0-9._-]{2,119}$/i.test(candidate.target)
        || !candidate.operation
        || !operations.includes(candidate.operation)
      ) {
        logVoiceDebug('warn', 'Discarded an invalid Brain API confirmation request');
        return;
      }
      if (pendingApiActionRef.current) {
        logVoiceDebug('warn', 'Ignored a second Brain API proposal while another is awaiting a decision');
        speakVoiceResponse('Please approve or cancel the current operation before preparing another one.');
        return;
      }
      const parameters = candidate.parameters && typeof candidate.parameters === 'object'
        ? candidate.parameters
        : {};
      if (candidate.operation !== 'bot_deactivate') {
        const amount = Number(parameters.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          logVoiceDebug('warn', 'Discarded a Brain API action with an invalid amount');
          speakVoiceResponse('The requested amount is invalid, so I did not prepare an executable action.');
          return;
        }
      }
      const action = {
        type: 'api' as const,
        operation: candidate.operation as PendingBrainApiAction['operation'],
        target: candidate.target,
        parameters: candidate.operation === 'bot_deactivate' ? {} : { amount: String(Number(parameters.amount)) },
        requiresConfirmation: true as const,
      };
      pendingApiActionRef.current = action;
      setPendingApiAction(action);
      logVoiceDebug('info', `Showing confirmation panel for ${action.operation} on bot ${action.target}`);
    };

    window.addEventListener(VOICE_API_CONFIRMATION_EVENT, handleApiConfirmationRequest);
    return () => window.removeEventListener(VOICE_API_CONFIRMATION_EVENT, handleApiConfirmationRequest);
  }, []);

  const confirmApiAction = async () => {
    const action = pendingApiActionRef.current;
    if (!action || executingApiAction) return;
    setExecutingApiAction(true);
    logVoiceDebug('info', `User approved Brain API action ${action.operation} for ${action.target}`);
    try {
      const operationStartedAt = new Date().toISOString();
      let response;
      const botPath = `/api/bot-investments/${encodeURIComponent(action.target)}`;
      if (action.operation === 'bot_activate') {
        response = await api.post(`${botPath}/activate`, { amount: Number(action.parameters?.amount) });
      } else if (action.operation === 'bot_deactivate') {
        response = await api.post(`${botPath}/deactivate`);
      } else {
        response = await api.post(`${botPath}/withdraw`, { amount: Number(action.parameters?.amount) });
      }

      if (response.status < 200 || response.status >= 300 || typeof response.data?.message !== 'string' || !response.data.message.trim()) {
        clearPendingApiAction();
        logVoiceDebug('warn', `Brain API request returned HTTP ${response.status} without a clear operation result`);
        speakVoiceResponse('CryBots returned a response without a clear result message. Please check My Bots and your transaction history before repeating the request.');
        return;
      }

      const resultMessage = response.data.message.trim();
      clearPendingApiAction();
      logVoiceDebug('info', `CryBots API accepted ${action.operation} for ${action.target}: HTTP ${response.status}; checking authoritative bot records`);

      try {
        const verification = await api.post('/api/voice/verify-operation', {
          operation: action.operation,
          botId: action.target,
          amount: action.operation === 'bot_deactivate' ? undefined : Number(action.parameters?.amount),
          startedAt: operationStartedAt,
        });
        const verificationStatus = verification.data?.status;
        const verificationMessage = typeof verification.data?.message === 'string' ? verification.data.message.trim() : '';
        if (verificationStatus === 'verified' && verificationMessage) {
          logVoiceDebug('info', `Brain verified ${action.operation} for ${action.target} against backend records`);
          speakVoiceResponse(verificationMessage);
        } else if (verificationStatus === 'pending' && verificationMessage) {
          logVoiceDebug('warn', `Brain operation remains pending verification: ${action.operation} for ${action.target}`);
          speakVoiceResponse(verificationMessage + ' Original server response: ' + resultMessage);
        } else {
          logVoiceDebug('warn', `Brain could not verify final state for ${action.operation} on ${action.target}`);
          speakVoiceResponse((verificationMessage || 'CryBots accepted the request, but I could not independently verify the updated backend record.') + ' Original server response: ' + resultMessage + ' Do not repeat the operation until you check My Bots and your transaction history.');
        }
      } catch (verificationError) {
        const detail = verificationError as { response?: { status?: number }; message?: string };
        logVoiceDebug('error', `Operation response received but backend verification failed: ${detail.message || 'verification request failed'}`);
        speakVoiceResponse('CryBots returned a response, but I could not verify the updated backend records. Do not repeat the operation yet; check My Bots and your transaction history first.');
      }
    } catch (error) {
      const failure = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      clearPendingApiAction();
      if (failure.response?.status) {
        const message = failure.response.data?.message || `CryBots rejected the request (HTTP ${failure.response.status}).`;
        logVoiceDebug('warn', `Brain API request rejected: HTTP ${failure.response.status}: ${message}`);
        speakVoiceResponse(message);
      } else {
        logVoiceDebug('error', `Brain API request outcome is unknown: ${failure.message || 'network error'}`);
        speakVoiceResponse('I could not verify the server response. Check My Bots and your transaction history before trying again.');
      }
    } finally {
      setExecutingApiAction(false);
    }
  };

  const cancelApiAction = () => {
    if (executingApiAction) return;
    const action = pendingApiActionRef.current;
    clearPendingApiAction();
    if (action) logVoiceDebug('info', `User cancelled Brain API action ${action.operation} for ${action.target}; no request sent`);
    speakVoiceResponse('Cancelled. I did not send that operation to CryBots.');
  };

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
    let processingVoiceRequest = false;

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
      void releaseMediaOutput();
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
      if (!enabled || stopped || voiceOutputActive || isVoiceOutputActive() || processingVoiceRequest) return;
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
      if (starting || !enabled || stopped || voiceOutputActive || isVoiceOutputActive() || processingVoiceRequest || socket || recorder) return;
      starting = true;
      logVoiceDebug('info', 'Voice start requested');

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
        logVoiceDebug('info', 'Deepgram token acquired');
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

        ['CryBots', 'CryBots', 'portfolio', 'notifications', 'transactions', 'withdrawals', 'rentals', 'commerce', 'webhooks', 'API keys'].forEach((term) => {
          params.append('keyterm', term);
        });

        const deepgramUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
        logVoiceDebug('info', `Opening Deepgram socket: ${VOICE_MODEL}`);
        socket = new WebSocket(deepgramUrl, ['bearer', token]);

        socket.onopen = async () => {
          logVoiceDebug('info', 'Deepgram WebSocket opened');
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
            logVoiceDebug('info', 'Microphone streaming started; listening');
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
              logVoiceDebug('error', `Deepgram error: ${message.description || 'unknown error'}`);
              setStatus(false, message.description || 'Voice service error');
              return;
            }
            if (message.type === 'SpeechStarted') {
              logVoiceDebug('info', 'SpeechStarted');
              setStatus(true);
              return;
            }

            const transcript = message.channel?.alternatives?.[0]?.transcript?.trim() || '';
            if (!transcript) return;

            setStatus(true, transcript);
            logVoiceDebug('info', `Transcript${message.is_final ? ' final' : ' interim'}: ${transcript}`);

            if (message.is_final && message.speech_final && transcript !== lastFinalTranscript) {
              lastFinalTranscript = transcript;
              processingVoiceRequest = true;
              logVoiceDebug('info', `Processing final transcript: ${transcript}`);

              // IMPORTANT: fully leave microphone capture before processing or TTS.
              // A live getUserMedia() track makes the browser's audio session
              // "play-and-record", which can route output like a call instead of
              // normal media playback. Stop every capture resource first.
              setStatus(false);
              clearReconnect();
              cleanupAudio();
              cleanupSocket();
              logVoiceDebug('info', 'Microphone and AudioContext fully stopped before assistant processing');
              logVoiceDebug('info', 'Sending transcript to /api/voice/assistant');

              void askVoiceAssistant(transcript)
                .then((handled) => {
                  processingVoiceRequest = false;

                  // If the assistant did not start TTS, safely return to listening.
                  // If TTS did start, VOICE_OUTPUT_EVENT owns the restart and keeps
                  // the microphone off until playback has completely finished.
                  if (!handled && !voiceOutputActive && !isVoiceOutputActive() && enabled && !stopped) {
                    scheduleStart(350);
                  }
                })
                .catch((error) => {
                  const errorMessage = error instanceof Error
                    ? error.message
                    : 'I could not process that request right now.';
                  processingVoiceRequest = false;
                  logVoiceDebug('error', `Assistant request failed: ${errorMessage}`);
                  setStatus(false, errorMessage);
                  speakVoiceResponse('Sorry, I could not process that request right now. Please try again.');
                });
            }
          } catch (error) {
          }
        };

        socket.onerror = () => {
          logVoiceDebug('error', 'Deepgram WebSocket error');
          setStatus(false, 'Voice connection error');
        };

        socket.onclose = (event) => {
          cleanupAudio();
          socket = null;
          const closeReason = event.reason || (event.code !== 1000 ? `Voice connection closed (${event.code})` : '');
          setStatus(false, closeReason);
          logVoiceDebug('error', `Deepgram socket closed: ${closeReason || 'normal close'}`);
          if (enabled && !stopped && !voiceOutputActive && !isVoiceOutputActive() && !processingVoiceRequest) {
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
      } else if (enabled && !stopped && !processingVoiceRequest) {
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

  return pendingApiAction ? (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
        background: 'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="crybots-brain-api-title"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '20px',
          padding: '22px',
          background: 'var(--surface, #10182b)',
          color: 'var(--text, #f8fafc)',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.48)',
        }}
      >
        <p style={{ margin: '0 0 7px', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
          CryBots Brain · API execution
        </p>
        <h2 id="crybots-brain-api-title" style={{ margin: '0 0 14px', fontSize: '1.2rem', lineHeight: 1.35 }}>
          Review before execution
        </h2>
        <div style={{ display: 'grid', gap: '10px', padding: '14px', borderRadius: '14px', background: 'rgba(148, 163, 184, 0.09)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>Operation</p>
            <p style={{ margin: '4px 0 0', fontWeight: 750 }}>{actionTitle(pendingApiAction)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>Bot ID</p>
            <p style={{ margin: '4px 0 0', fontWeight: 750, overflowWrap: 'anywhere' }}>{pendingApiAction.target}</p>
          </div>
          {pendingApiAction.operation !== 'bot_deactivate' && (
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>Amount</p>
              <p style={{ margin: '4px 0 0', fontWeight: 750 }}>{Number(pendingApiAction.parameters?.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} USDT</p>
            </div>
          )}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: '0.84rem', lineHeight: 1.5, opacity: 0.82 }}>
          Confirming sends this request to the authenticated CryBots API. CryBots will recheck account access, bot eligibility, balances, and its own operation rules. If the response cannot be verified, check your records before retrying.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '18px' }}>
          <button
            type="button"
            disabled={executingApiAction}
            onClick={cancelApiAction}
            style={{ minHeight: '44px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.45)', background: 'transparent', color: 'inherit', font: 'inherit', fontWeight: 700, cursor: executingApiAction ? 'not-allowed' : 'pointer', opacity: executingApiAction ? 0.55 : 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={executingApiAction}
            onClick={() => { void confirmApiAction(); }}
            style={{ minHeight: '44px', borderRadius: '12px', border: 'none', background: '#7357ff', color: '#fff', font: 'inherit', fontWeight: 750, cursor: executingApiAction ? 'wait' : 'pointer', opacity: executingApiAction ? 0.7 : 1 }}
          >
            {executingApiAction ? 'Sending…' : 'Approve & execute'}
          </button>
        </div>
      </section>
    </div>
  ) : null;
};

export default VoiceNavigation;
