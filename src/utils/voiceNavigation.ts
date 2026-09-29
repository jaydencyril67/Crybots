import { navigate } from './navigate';

export const VOICE_MODE_STORAGE_KEY = 'nowbar_voice_navigation_enabled';
export const VOICE_MODE_CHANGED_EVENT = 'nowbar-voice-mode-changed';
export const VOICE_STATUS_EVENT = 'nowbar-voice-status-changed';
export const VOICE_OUTPUT_EVENT = 'nowbar-voice-output-changed';
export const NOWBAR_COMMAND_EVENT = 'nowbar-voice-command';

export type VoiceCommand = { label: string; route: string };

// Canonical route catalog used by the command page. Keep one entry per application route.
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
  { label: 'COMMANDS', route: '/voice-commands' },
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
  { label: 'MY SPACE', route: '/my-space' },
  { label: 'MARKET', route: '/market' },
  { label: 'CONTROL CENTER', route: '/control-center' },
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
  { label: 'ALERT', route: '/alert' },
  { label: 'APP USAGE', route: '/app-usage' },
];

const AUTHENTICATED_ROUTES = new Set([
  '/home', '/details', '/manage', '/theme', '/nowbar', '/voice-commands',
  '/nowbar-color', '/nowbar-button-color', '/profile', '/exit', '/auto-exit',
  '/manual-exit', '/statistics', '/agent', '/tools', '/stats', '/menu', '/trade',
  '/my-space', '/market', '/control-center', '/logs', '/help', '/faq', '/options',
  '/store', '/about', '/dev', '/api-keys', '/webhooks', '/configure', '/asset',
  '/danger', '/security', '/withdrawals', '/transfer', '/deposit', '/transactions',
  '/notifications', '/alert', '/app-usage', '/information', '/privacy-policy',
  '/community-standards',
]);

// These are the authenticated routes represented by the NowBar.
export const NOWBAR_ROUTES = new Set([
  ...AUTHENTICATED_ROUTES,
]);

export const AUTHENTICATED_NOWBAR_PAGE_ROUTES = PAGE_ROUTES.filter(({ route }) =>
  AUTHENTICATED_ROUTES.has(route) && NOWBAR_ROUTES.has(route),
);

export const VOICE_COMMANDS: VoiceCommand[] = [
  { label: 'COMMAND', route: '/voice-commands' },
  { label: 'COMMANDS', route: '/voice-commands' },
  { label: 'HOME', route: '/home' },
  { label: 'PROFILE', route: '/profile' },
  { label: 'DETAILS', route: '/details' },
  { label: 'STATISTICS', route: '/statistics' },
  { label: 'AGENT', route: '/agent' },
  { label: 'TRADE', route: '/trade' },
  { label: 'LOGS', route: '/logs' },
  { label: 'ASSETS', route: '/asset' },
  { label: 'ASSET', route: '/asset' },
  { label: 'HELP', route: '/help' },
  { label: 'OPTION', route: '/options' },
  { label: 'OPTIONS', route: '/options' },
  { label: 'STORE', route: '/store' },
  { label: 'ABOUT', route: '/about' },
  { label: 'DEV', route: '/dev' },
  { label: 'EXIT', route: '/exit' },
  { label: 'MANAGE', route: '/manage' },
  { label: 'MARKET', route: '/market' },
  { label: 'MY SPACE', route: '/my-space' },
  { label: 'CONTROL CENTER', route: '/control-center' },
  { label: 'DEPOSIT', route: '/deposit' },
  { label: 'WITHDRAW', route: '/withdrawals' },
  { label: 'WITHDRAWALS', route: '/withdrawals' },
  { label: 'TRANSFER', route: '/transfer' },
  { label: 'SECURITY', route: '/security' },
  { label: 'TRANSACTIONS', route: '/transactions' },
  { label: 'NOTIFICATIONS', route: '/notifications' },
  { label: 'ALERT', route: '/alert' },
  { label: 'APP USAGE', route: '/app-usage' },
  { label: 'THEME', route: '/theme' },
  { label: 'NOWBAR', route: '/nowbar' },
  { label: 'FAQ', route: '/faq' },
  { label: 'INFORMATION', route: '/information' },
  { label: 'PRIVACY POLICY', route: '/privacy-policy' },
  { label: 'COMMUNITY STANDARDS', route: '/community-standards' },
];

export const getVoiceModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(VOICE_MODE_STORAGE_KEY) === 'true';
};

export const disableVoiceMode = () => {
  if (typeof window === 'undefined' || !getVoiceModeEnabled()) return;
  window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, 'false');
  window.dispatchEvent(new Event(VOICE_MODE_CHANGED_EVENT));
};

export const normalizeVoiceText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const VOICE_PROMPTS = [
  'Where would you like to navigate today?',
  'What is your interest today?',
  'What is on your mind today?',
  'Which part of KingsHall would you like to explore?',
  'How may I help with your navigation journey today?',
  'What would you like to discover next?',
  'Which page may I open for you?',
  'Where shall we go from here?',
];

const getVoiceIdentity = () => {
  if (typeof window === 'undefined') return { name: 'there', title: '' };
  try {
    const user = JSON.parse(window.localStorage.getItem('user') || '{}') as { firstName?: string; gender?: string };
    const name = window.localStorage.getItem('firstName')?.trim() || user.firstName?.trim() || 'there';
    const gender = user.gender?.toLowerCase();
    const title = gender === 'male' || gender === 'man' || gender === 'm'
      ? 'Sir'
      : gender === 'female' || gender === 'woman' || gender === 'f' ? 'Mrs' : '';
    return { name, title };
  } catch {
    return { name: 'there', title: '' };
  }
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const isVoiceWakeWord = (transcript: string) => /(^|\s)kings?(?=\s|$)/i.test(transcript.trim());

export const speakVoiceGreeting = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const lastPrompt = window.sessionStorage.getItem('kingshall_voice_prompt');
  const availablePrompts = VOICE_PROMPTS.filter((prompt) => prompt !== lastPrompt);
  const prompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
  const { name, title } = getVoiceIdentity();
  const address = title ? `${name}, ${title}` : name;
  const message = `${getTimeGreeting()} ${address}. ${prompt} If you need help, kindly say Command and I will display the full page menu for you.`;
  const utterance = new SpeechSynthesisUtterance(message);
  const voices = window.speechSynthesis.getVoices();
  const maleVoice = voices.find((voice) => /male|david|alex|daniel|fred|mark|george/i.test(voice.name));
  if (maleVoice) utterance.voice = maleVoice;
  utterance.pitch = 1.08;
  utterance.rate = 1.02;
  const finish = () => window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: false } }));
  window.speechSynthesis.cancel();
  window.sessionStorage.setItem('kingshall_voice_prompt', prompt);
  window.dispatchEvent(new CustomEvent(VOICE_OUTPUT_EVENT, { detail: { active: true } }));
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
};

export const isVoiceOutputActive = () => typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;

type NowBarCommand = 'expand' | 'collapse' | 'left' | 'right';

const dispatchNowBarCommand = (command: NowBarCommand) => {
  window.dispatchEvent(new CustomEvent(NOWBAR_COMMAND_EVENT, { detail: { command } }));
};

export const navigateFromVoice = (transcript: string) => {
  const normalized = normalizeVoiceText(transcript);
  if (isVoiceWakeWord(transcript)) {
    speakVoiceGreeting();
    return true;
  }
  const normalizedTranscript = ` ${normalized} `;

  if (normalizedTranscript.includes(' off ') || normalizedTranscript.includes(' of ')) {
    window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, 'false');
    window.dispatchEvent(new Event(VOICE_MODE_CHANGED_EVENT));
    return true;
  }
  if (/(^|\s)(go\s+)?back(\s|$)/.test(normalized) || normalizedTranscript.includes(' previous page ')) {
    window.history.back();
    return true;
  }
  if (normalizedTranscript.includes(' up ') || normalizedTranscript.includes(' scroll up ')) {
    window.scrollBy({ top: -Math.round(window.innerHeight * 0.8), behavior: 'smooth' });
    return true;
  }
  if (normalizedTranscript.includes(' down ') || normalizedTranscript.includes(' scroll down ')) {
    window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: 'smooth' });
    return true;
  }
  const nowBarCommand = (['expand', 'collapse', 'left', 'right'] as NowBarCommand[]).find((command) =>
    normalizedTranscript.includes(` ${command} `),
  );
  if (nowBarCommand) {
    dispatchNowBarCommand(nowBarCommand);
    return true;
  }
  const commandsBySpecificity = [...VOICE_COMMANDS, ...AUTHENTICATED_NOWBAR_PAGE_ROUTES]
    .map((command) => ({
      ...command,
      normalizedLabel: normalizeVoiceText(command.label),
    }))
    .sort((first, second) => second.normalizedLabel.length - first.normalizedLabel.length);
  const command = commandsBySpecificity.find(({ normalizedLabel }) =>
    normalizedTranscript.includes(` ${normalizedLabel} `),
  );

  if (!command) return false;
  navigate(command.route);
  return true;
};
