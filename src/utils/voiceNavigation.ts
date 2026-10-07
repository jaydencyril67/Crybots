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

export const requestVoiceMicrophoneAccess = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    logVoiceDebug('error', 'Microphone access is unavailable in this app.');
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    logVoiceDebug('info', 'Microphone permission granted');
    return true;
  } catch (error) {
    logVoiceDebug('error', `Microphone permission failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

let voiceConversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

export const disableVoiceMode = () => {
  voiceConversationHistory = [];
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, 'false');
  window.dispatchEvent(new Event(VOICE_MODE_CHANGED_EVENT));
};

export const getVoiceModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(VOICE_MODE_STORAGE_KEY) === 'true';
};

export type VoiceUiButton = {
  id: string;
  label: string;
  disabled: boolean;
};

const normalizeButtonLabel = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const getButtonLabel = (button: HTMLButtonElement) =>
  normalizeButtonLabel(
    button.getAttribute('aria-label')
      || button.getAttribute('title')
      || button.innerText
      || button.textContent
      || '',
  );

const getButtonContext = (button: HTMLButtonElement) => {
  const row = button.closest('[role="row"], li, tr, section, article, div');
  if (!row) return '';

  const texts = Array.from(row.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, h5, label, span'))
    .map((element) => normalizeButtonLabel(element.innerText || element.textContent || ''))
    .filter(Boolean)
    .filter((text) => text !== getButtonLabel(button));

  return texts.slice(0, 2).join(' — ');
};

const isVisibleButton = (button: HTMLButtonElement) => {
  if (button.disabled || button.dataset.voiceExclude === 'true') return false;
  const style = window.getComputedStyle(button);
  const rect = button.getBoundingClientRect();
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && Number(style.opacity) > 0
    && rect.width > 0
    && rect.height > 0;
};

export const getVisibleVoiceButtons = (): VoiceUiButton[] => {
  if (typeof document === 'undefined') return [];
  const counts = new Map<string, number>();
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .filter(isVisibleButton)
    .map((button) => {
      const rawLabel = getButtonLabel(button) || 'unlabelled button';
      const context = getButtonContext(button);
      const label = context ? `${rawLabel} — ${context}` : rawLabel;
      const base = normalizeButtonLabel(label).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'button';
      const count = (counts.get(base) || 0) + 1;
      counts.set(base, count);
      const id = `voice-button-${base}-${count}`;
      button.dataset.voiceId = id;
      return { id, label, disabled: button.disabled };
    })
    .slice(0, 60);
};

const isSensitiveVoiceButton = (label: string) =>
  /\b(withdraw|transfer|delete|remove|disable|revoke|reset|change password|security code|confirm deletion|close account)\b/i.test(label);

export const executeVoiceUiAction = (action: { type?: string; target?: string } | null | undefined) => {
  if (!action || action.type !== 'click' || !action.target || typeof document === 'undefined') return false;
  const buttons = getVisibleVoiceButtons();
  const button = buttons.find((item) => item.id === action.target);
  if (!button) {
    logVoiceDebug('warn', `Voice click target not found: ${action.target}`);
    return false;
  }
  if (isSensitiveVoiceButton(button.label)) {
    logVoiceDebug('warn', `Blocked sensitive voice click: ${button.label}`);
    speakVoiceResponse('That button requires your explicit confirmation before I can activate it.');
    return false;
  }

  const element = document.querySelector<HTMLButtonElement>(`button[data-voice-id="${CSS.escape(action.target)}"]`);
  if (!element || !isVisibleButton(element)) {
    logVoiceDebug('warn', `Voice click target is no longer visible: ${action.target}`);
    return false;
  }

  logVoiceDebug('info', `Executing Gemini UI click: ${button.label} (${action.target})`);
  element.click();
  return true;
};

export const isVoiceOutputActive = () => typeof window !== 'undefined' && Boolean((window as Window & { __crybotsVoiceAudio?: HTMLAudioElement }).__crybotsVoiceAudio?.paused === false);

export const speakVoiceResponse = (message: string) => {
  const text = message.trim();
  if (!text || typeof window === 'undefined') return;

  const audioState = window as Window & { __crybotsVoiceAudio?: HTMLAudioElement; __crybotsVoiceAudioUrl?: string };
  if (audioState.__crybotsVoiceAudio) {
    audioState.__crybotsVoiceAudio.pause();
    audioState.__crybotsVoiceAudio.currentTime = 0;
  }
  if (audioState.__crybotsVoiceAudioUrl) {
    URL.revokeObjectURL(audioState.__crybotsVoiceAudioUrl);
    audioState.__crybotsVoiceAudioUrl = undefined;
  }

  window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: true } }));
  logVoiceDebug('info', 'Requesting Gemini TTS audio');

  const headers = (() => {
    const result = new Headers();
    const auth = authHeaders();
    if (auth.Authorization) result.set('Authorization', auth.Authorization);
    result.set('Content-Type', 'application/json');
    return result;
  })();

  void fetch(`${API_BASE_URL}/api/voice/tts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: text.slice(0, 2000) }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Gemini TTS HTTP ${response.status}: ${detail.slice(0, 300)}`);
      }
      return response.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioState.__crybotsVoiceAudio = audio;
      audioState.__crybotsVoiceAudioUrl = url;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioState.__crybotsVoiceAudioUrl = undefined;
        audioState.__crybotsVoiceAudio = undefined;
        window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioState.__crybotsVoiceAudioUrl = undefined;
        audioState.__crybotsVoiceAudio = undefined;
        window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
        logVoiceDebug('error', 'Gemini TTS audio playback failed');
      };
      return audio.play();
    })
    .catch((error) => {
      window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
      logVoiceDebug('error', error instanceof Error ? error.message : String(error));
    });
};

type VoiceAssistantAction = { type?: string; route?: string; target?: string; direction?: string; amount?: number } | null;
type VoiceAssistantResponse = { reply?: string; action?: VoiceAssistantAction; debug?: { requestId?: string; elapsedMs?: number; providerStatus?: number } };

export const askVoiceAssistant = async (message: string) => {
  logVoiceDebug('info', `Assistant request: ${message.trim().slice(0, 500)}`);
  const trimmed = message.trim();
  if (!trimmed) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/voice/assistant`, {
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
        uiButtons: getVisibleVoiceButtons(),
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

    if (body.action?.type === 'click') {
      logVoiceDebug('info', `Assistant action: click ${body.action.target || ''}`);
      executeVoiceUiAction(body.action);
    }

    if (body.action?.type === 'scroll_page' || body.action?.type === 'scroll_nowbar') {
      const direction = body.action.direction === 'up' || body.action.direction === 'left' ? -1 : 1;
      const amount = Math.max(100, Math.min(Number(body.action.amount) || 500, 1200));
      if (body.action.type === 'scroll_page') {
        window.scrollBy({ top: direction * amount, behavior: 'smooth' });
        logVoiceDebug('info', `Gemini scrolled page ${direction < 0 ? 'up' : 'down'} ${amount}px`);
      } else {
        window.dispatchEvent(new CustomEvent('crybots-voice-nowbar-scroll', {
          detail: { direction: body.action.direction === 'left' ? -1 : 1, amount },
        }));
        logVoiceDebug('info', `Gemini scrolled NowBar ${body.action.direction === 'left' ? 'left' : 'right'} ${amount}px`);
      }
    }

    if (body.action?.type === 'expand_nowbar' || body.action?.type === 'collapse_nowbar') {
      window.dispatchEvent(new CustomEvent('crybots-voice-nowbar-mode', {
        detail: { mode: body.action.type === 'expand_nowbar' ? 'expanded' : 'compact' },
      }));
      logVoiceDebug('info', `Gemini set NowBar mode: ${body.action.type === 'expand_nowbar' ? 'expanded' : 'compact'}`);
    }

    return Boolean(reply);
  } catch (error) {
    logVoiceDebug('error', `Assistant request failed: ${error instanceof Error ? error.message : String(error)}`);
    speakVoiceResponse('I could not reach the voice assistant right now.');
    return false;
  }
};
