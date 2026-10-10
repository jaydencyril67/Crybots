import { navigate } from './navigate';
import { GENERATED_PAGE_ROUTES } from './generatedPageRoutes';
import { prepareMediaOutput, releaseMediaOutput } from './mediaAudio';
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

export const PAGE_ROUTES: VoiceCommand[] = GENERATED_PAGE_ROUTES;

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
let voiceBrainContext: Record<string, unknown> = {};

export const disableVoiceMode = () => {
  voiceConversationHistory = [];
  voiceBrainContext = {};
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
  const buttonLabel = getButtonLabel(button);
  const candidates: string[] = [];

  const addCandidate = (value: string | null | undefined) => {
    const text = normalizeButtonLabel(value || '');
    if (!text || text === buttonLabel || text.length > 120) return;
    if (!candidates.includes(text)) candidates.push(text);
  };

  addCandidate(button.getAttribute('data-label'));
  addCandidate(button.getAttribute('data-name'));
  addCandidate(button.getAttribute('data-section'));
  addCandidate(button.getAttribute('data-title'));

  let container: HTMLElement | null = button.parentElement;
  let depth = 0;
  while (container && depth < 5) {
    const heading = container.querySelector<HTMLElement>(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > legend, :scope > [role="heading"]',
    );
    if (heading) addCandidate(heading.innerText || heading.textContent);

    const labelledBy = container.getAttribute('aria-labelledby');
    if (labelledBy) {
      labelledBy.split(/\s+/).forEach((id) => addCandidate(document.getElementById(id)?.innerText));
    }

    const label = container.querySelector<HTMLElement>(':scope > label');
    if (label) addCandidate(label.innerText || label.textContent);

    const descriptive = container.querySelector<HTMLElement>(
      ':scope > p, :scope > small, :scope > [data-description], :scope > [role="note"]',
    );
    if (descriptive) addCandidate(descriptive.innerText || descriptive.textContent);

    const siblings = Array.from(container.children)
      .filter((child) => child !== button && !(child as HTMLElement).querySelector('button'))
      .map((child) => (child as HTMLElement).innerText || child.textContent || '')
      .flatMap((text) => text.split(/\n+/))
      .map((text) => normalizeButtonLabel(text))
      .filter((text) => text && text !== buttonLabel && text.length <= 100);
    siblings.slice(0, 2).forEach(addCandidate);

    container = container.parentElement;
    depth += 1;
  }

  const pageHeading = document.querySelector<HTMLElement>(
    'main h1, main h2, [role="main"] h1, [role="main"] h2, body > h1, body > h2',
  );
  if (pageHeading) addCandidate(pageHeading.innerText || pageHeading.textContent);

  return candidates.slice(0, 3).join(' — ');
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

  logVoiceDebug('info', `Executing Brain UI click: ${button.label} (${action.target})`);
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
  logVoiceDebug('info', 'Requesting Deepgram TTS audio');

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
        throw new Error(`Deepgram TTS HTTP ${response.status}: ${detail.slice(0, 300)}`);
      }
      return response.blob();
    })
    .then(async (blob) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioState.__crybotsVoiceAudio = audio;
      audioState.__crybotsVoiceAudioUrl = url;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioState.__crybotsVoiceAudioUrl = undefined;
        audioState.__crybotsVoiceAudio = undefined;
        void releaseMediaOutput();
        window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioState.__crybotsVoiceAudioUrl = undefined;
        audioState.__crybotsVoiceAudio = undefined;
        void releaseMediaOutput();
        window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
        logVoiceDebug('error', 'Deepgram TTS audio playback failed');
      };
      await prepareMediaOutput();
      logVoiceDebug('info', 'Prepared Android media audio output');
      return audio.play();
    })
    .catch((error) => {
      void releaseMediaOutput();
      window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
      logVoiceDebug('error', error instanceof Error ? error.message : String(error));
    });
};

type VoiceAssistantAction = {
  type?: string;
  route?: string;
  target?: string;
  direction?: string;
  amount?: number;
  position?: 'top' | 'bottom';
} | null;

type VoiceAssistantResponse = {
  reply?: string;
  context?: Record<string, unknown>;
  action?: VoiceAssistantAction;
  debug?: { requestId?: string; elapsedMs?: number; providerStatus?: number };
};

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
        transcript: trimmed,
        currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
        pageRoutes: PAGE_ROUTES,
        uiButtons: getVisibleVoiceButtons(),
        history: voiceConversationHistory.slice(-8),
        context: voiceBrainContext,
      }),
    });

    const body = await response.json().catch(() => ({})) as VoiceAssistantResponse & { message?: string };
    if (!response.ok) {
      logVoiceDebug('error', `Assistant HTTP error ${response.status}: ${body.message || body.reply || 'no response body'}`);
      if (body.reply) speakVoiceResponse(body.reply);
      else if (response.status === 503) speakVoiceResponse('The conversational assistant is not configured yet.');
      return false;
    }

    if (body.context && typeof body.context === 'object' && !Array.isArray(body.context)) {
      voiceBrainContext = body.context;
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

    if (body.action?.type === 'back') {
      logVoiceDebug('info', 'Assistant action: browser back');
      window.history.back();
    }

    if (body.action?.type === 'forward') {
      logVoiceDebug('info', 'Assistant action: browser forward');
      window.history.forward();
    }

    if (body.action?.type === 'click') {
      logVoiceDebug('info', `Assistant action: click ${body.action.target || ''}`);
      executeVoiceUiAction(body.action);
    }

    if (body.action?.type === 'scroll_page' || body.action?.type === 'scroll_nowbar') {
      const direction = body.action.direction === 'up' || body.action.direction === 'left' ? -1 : 1;
      const amount = Math.max(100, Math.min(Number(body.action.amount) || 500, 1200));
      if (body.action.type === 'scroll_page') {
        if (body.action.position === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          logVoiceDebug('info', 'Brain scrolled page to top');
        } else if (body.action.position === 'bottom') {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          logVoiceDebug('info', 'Brain scrolled page to bottom');
        } else {
          window.scrollBy({ top: direction * amount, behavior: 'smooth' });
          logVoiceDebug('info', `Brain scrolled page ${direction < 0 ? 'up' : 'down'} ${amount}px`);
        }
      } else {
        window.dispatchEvent(new CustomEvent('crybots-voice-nowbar-scroll', {
          detail: { direction: body.action.direction === 'left' ? -1 : 1, amount },
        }));
        logVoiceDebug('info', `Brain scrolled NowBar ${body.action.direction === 'left' ? 'left' : 'right'} ${amount}px`);
      }
    }

    if (body.action?.type === 'expand_nowbar' || body.action?.type === 'collapse_nowbar') {
      window.dispatchEvent(new CustomEvent('crybots-voice-nowbar-mode', {
        detail: { mode: body.action.type === 'expand_nowbar' ? 'expanded' : 'compact' },
      }));
      logVoiceDebug('info', `Brain set NowBar mode: ${body.action.type === 'expand_nowbar' ? 'expanded' : 'compact'}`);
    }

    return Boolean(reply);
  } catch (error) {
    logVoiceDebug('error', `Assistant request failed: ${error instanceof Error ? error.message : String(error)}`);
    speakVoiceResponse('I could not reach the voice assistant right now.');
    return false;
  }
};
