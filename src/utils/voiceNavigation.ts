import { navigate } from './navigate';
import { API_BASE_URL, authHeaders } from '../api/axios';

export const VOICE_MODE_STORAGE_KEY = 'nowbar_voice_navigation_enabled';
export const VOICE_MODE_CHANGED_EVENT = 'nowbar-voice-mode-changed';
export const VOICE_STATUS_EVENT = 'nowbar-voice-status-changed';
export const VOICE_OUTPUT_EVENT = 'nowbar-voice-output-changed';

export const VOICE_DEBUG_EVENT = 'nowbar-voice-debug';
const VOICE_DEBUG_STORAGE_KEY = 'crybots_voice_debug_logs';
export type VoiceDebugLog = { time: string; level: 'info' | 'error' | 'warn' | 'debug'; message: string };

export const getVoiceDebugLogs = (): VoiceDebugLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(VOICE_DEBUG_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(-80) : [];
  } catch {
    return [];
  }
};

export const logVoiceDebug = (level: VoiceDebugLog['level'], message: string) => {
  if (typeof window === 'undefined') return;
  const entry: VoiceDebugLog = {
    time: new Date().toLocaleTimeString(),
    level,
    message: message.slice(0, 1000),
  };
  const logs = [...getVoiceDebugLogs(), entry].slice(-80);
  window.localStorage.setItem(VOICE_DEBUG_STORAGE_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent(VOICE_DEBUG_EVENT));
  if (level === 'error') console.error('[CryBots Voice]', message);
  else console.log('[CryBots Voice]', message);
};

export type VoiceCommand = { label: string; route: string };

// Route labels used by the NowBar UI.
export const PAGE_ROUTES: VoiceCommand[] = [
  { label: 'SIGN UP', route: '/signup' },
  { label: 'SIGN UP CONFIRMATION', route: '/signup-confirmation-sent' },
  { label: 'VERIFY EMAIL', route: '/verify-email' },
  { label: 'ACCOUNT CONFIRMED', route: '/account-confirmed' },
  { label: 'SIGN IN', route: '/signin' },
  { label: 'FORGOT PASSWORD', route: '/forgot-password' },
  { label: 'HOME', route: '/home' },
  { label: 'DETAILS', route: '/details' },
  { label: 'MANAGE', route: '/manage' },
  { label: 'THEME', route: '/theme' },
  { label: 'EDGE LIGHTING', route: '/nowbar-color' },
  { label: 'BUTTON COLOR', route: '/nowbar-button-color' },
  { label: 'NOWBAR', route: '/nowbar' },
  { label: 'NOWBAR COLOR', route: '/nowbar-color' },
  { label: 'NOWBAR BUTTON COLOR', route: '/nowbar-button-color' },
  { label: 'STATISTICS', route: '/statistics' },
  { label: 'PROFILE', route: '/profile' },
  { label: 'EXIT', route: '/exit' },
  { label: 'AUTO EXIT', route: '/auto-exit' },
  { label: 'MANUAL EXIT', route: '/manual-exit' },
  { label: 'AGENT', route: '/agent' },
  { label: 'STATS', route: '/stats' },
  { label: 'TOOLS', route: '/tools' },
  { label: 'MENU', route: '/menu' },
  { label: 'TRADE', route: '/trade' },
  { label: 'CHART', route: '/chart' },
  { label: 'MARKET', route: '/market' },
  { label: 'PORTFOLIO', route: '/portfolio' },
  { label: 'CREATION', route: '/creation' },
  { label: 'RENTALS', route: '/rentals' },
  { label: 'COMMERCE', route: '/commerce' },
  { label: 'MY BOTS', route: '/bots' },
  { label: 'LOGS', route: '/logs' },
  { label: 'HELP', route: '/help' },
  { label: 'FAQ', route: '/faq' },
  { label: 'OPTIONS', route: '/options' },
  { label: 'STORE', route: '/store' },
  { label: 'ABOUT', route: '/about' },
  { label: 'INFORMATION', route: '/information' },
  { label: 'PRIVACY POLICY', route: '/privacy-policy' },
  { label: 'COMMUNITY STANDARDS', route: '/community-standards' },
  { label: 'DEV', route: '/dev' },
  { label: 'API KEYS', route: '/api-keys' },
  { label: 'WEBHOOKS', route: '/webhooks' },
  { label: 'CONFIGURE', route: '/configure' },
  { label: 'ASSETS', route: '/asset' },
  { label: 'DANGER', route: '/danger' },
  { label: 'PENDING DELETION', route: '/pending-deletion' },
  { label: 'ENABLE ACCOUNT', route: '/enable-account' },
  { label: 'SECURITY', route: '/security' },
  { label: 'WITHDRAWALS', route: '/withdrawals' },
  { label: 'TRANSFER', route: '/transfer' },
  { label: 'DEPOSIT', route: '/deposit' },
  { label: 'TRANSACTIONS', route: '/transactions' },
  { label: 'NOTIFICATIONS', route: '/notifications' },
  { label: 'TICKETS', route: '/tickets' },
  { label: 'ALERT', route: '/alert' },
  { label: 'NOTIFICATION COLOR', route: '/notification-color' },
  { label: 'APP USAGE', route: '/app-usage' },
  { label: 'ADMIN CHAT', route: '/admin/chat' },
];

export const getVoiceModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(VOICE_MODE_STORAGE_KEY) === 'true';
};

type CapacitorVoice = {
  name?: string;
  lang?: string;
  localService?: boolean;
  voiceURI?: string;
};

type CapacitorPlugin = {
  speak?: (options: { text: string; lang: string; rate: number; pitch: number; volume: number; voice?: number }) => Promise<void>;
  getSupportedVoices?: () => Promise<{ voices?: CapacitorVoice[] }>;
};

type CapacitorBridge = {
  Plugins?: Record<string, CapacitorPlugin>;
  registerPlugin?: (name: string) => CapacitorPlugin;
};

const getCapacitorPlugin = (name: 'TextToSpeech'): CapacitorPlugin | null => {
  if (typeof window === 'undefined') return null;
  const capacitor = (window as Window & { Capacitor?: CapacitorBridge }).Capacitor;
  return capacitor?.Plugins?.[name] || capacitor?.registerPlugin?.(name) || null;
};

export const requestVoiceMicrophoneAccess = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
};

let voiceConversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

export const disableVoiceMode = () => {
  voiceConversationHistory = [];
  if (typeof window === 'undefined' || !getVoiceModeEnabled()) return;
  window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, 'false');
  window.dispatchEvent(new Event(VOICE_MODE_CHANGED_EVENT));
};

export const normalizeVoiceText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const FEMALE_VOICE_PATTERN = /(^|[\\s_-])(female|samantha|zira|jenny|aria|ava|emma|susan|karen|victoria|sara|sarah|google us english)([\\s_-]|$)/i;
const ENGLISH_VOICE_PATTERN = /^(en|en[-_])/i;

const getPreferredFemaleWebVoice = (voices: SpeechSynthesisVoice[]) => voices
  .filter((voice) => ENGLISH_VOICE_PATTERN.test(voice.lang))
  .sort((first, second) => {
    const firstFemale = FEMALE_VOICE_PATTERN.test(first.name) ? 2 : 0;
    const secondFemale = FEMALE_VOICE_PATTERN.test(second.name) ? 2 : 0;
    const firstLocal = first.localService ? 1 : 0;
    const secondLocal = second.localService ? 1 : 0;
    return (secondFemale + secondLocal) - (firstFemale + firstLocal);
  })[0];

const getPreferredFemaleNativeVoice = async (plugin: CapacitorPlugin) => {
  if (!plugin.getSupportedVoices) return undefined;
  try {
    const result = await plugin.getSupportedVoices();
    const voices = Array.isArray(result?.voices) ? result.voices : [];
    const englishVoices = voices.filter((voice) => ENGLISH_VOICE_PATTERN.test(voice.lang || ''));
    const preferred = englishVoices.find((voice) => FEMALE_VOICE_PATTERN.test(voice.name || ''))
      || englishVoices.find((voice) => /female/i.test(voice.name || ''));
    if (!preferred) return undefined;
    return voices.indexOf(preferred);
  } catch {
    return undefined;
  }
};

export const isVoiceOutputActive = () => typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
export const speakVoiceResponse = (message: string) => {
  const text = message.trim();
  if (!text) return;

  const nativeTextToSpeech = getCapacitorPlugin('TextToSpeech');
  if (nativeTextToSpeech?.speak) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: true } }));
    void getPreferredFemaleNativeVoice(nativeTextToSpeech).then((voice) =>
      nativeTextToSpeech.speak({ text, lang: 'en-US', rate: 0.98, pitch: 1.08, volume: 1, ...(voice !== undefined ? { voice } : {}) }),
    )
      .catch(() => undefined)
      .finally(() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
      });
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const preferredFemaleVoice = getPreferredFemaleWebVoice(window.speechSynthesis.getVoices());
  if (preferredFemaleVoice) utterance.voice = preferredFemaleVoice;
  utterance.pitch = 1.08;
  utterance.rate = 0.98;
  const finish = () => window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
  window.speechSynthesis.cancel();
  window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: true } }));
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
};

type VoiceAssistantAction = { type?: string; route?: string } | null;
type VoiceAssistantResponse = { reply?: string; action?: VoiceAssistantAction; debug?: { requestId?: string; elapsedMs?: number; providerStatus?: number } };

export const askVoiceAssistant = async (message: string) => {
  logVoiceDebug('info', `Assistant request: ${message.trim().slice(0, 500)}`);
  const trimmed = message.trim();
  if (!trimmed) return false;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/voice/assistant`, {
    method: 'POST',
    headers: (() => {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const auth = authHeaders();
      if (auth.Authorization) headers.set('Authorization', auth.Authorization);
      return headers;
    })(),
    body: JSON.stringify({
      message: trimmed,
      currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
      history: voiceConversationHistory.slice(-8),
    }),
  });

  const body = await response.json().catch(() => ({})) as VoiceAssistantResponse & { message?: string };
  if (!response.ok) {
    logVoiceDebug('error', `Assistant HTTP error ${response.status}: ${body.message || body.reply || 'no response body'}`);
    if (body.reply) speakVoiceResponse(body.reply);
    else if (response.status === 503) speakVoiceResponse('The conversational assistant is not configured yet.');
    return false;
  }

  const reply = typeof body.reply === 'string' ? body.reply.trim() : '';
  logVoiceDebug('info', `Assistant response: ${reply || '[empty reply]'}`);
  if (body.debug?.requestId) logVoiceDebug('debug', `Backend request ${body.debug.requestId}${typeof body.debug.elapsedMs === 'number' ? ` (${body.debug.elapsedMs}ms)` : ''}`);
  if (reply) {
    voiceConversationHistory.push({ role: 'user', content: trimmed });
    voiceConversationHistory.push({ role: 'assistant', content: reply });
    voiceConversationHistory = voiceConversationHistory.slice(-8);
    window.dispatchEvent(new CustomEvent(VOICE_STATUS_EVENT, { detail: { listening: false, transcript: reply, assistant: true } }));
    speakVoiceResponse(reply);
  }

  if (body.action?.type === 'navigate' && body.action.route) {
    logVoiceDebug('info', `Assistant action: navigate ${body.action.route}`);
    navigate(body.action.route);
  }

  return Boolean(reply);
  } catch (error) {
    logVoiceDebug('error', `Assistant request failed: ${error instanceof Error ? error.message : String(error)}`);
    speakVoiceResponse('I could not reach the voice assistant right now.');
    return false;
  }
};


