import { navigate } from './navigate';

export const VOICE_MODE_STORAGE_KEY = 'nowbar_voice_navigation_enabled';
export const VOICE_MODE_CHANGED_EVENT = 'nowbar-voice-mode-changed';
export const VOICE_STATUS_EVENT = 'nowbar-voice-status-changed';

export type VoiceCommand = { label: string; route: string };

export const VOICE_COMMANDS: VoiceCommand[] = [
  { label: 'HOME', route: '/dashboard' },
  { label: 'DASHBOARD', route: '/dashboard' },
  { label: 'PROFILE', route: '/portfolio' },
  { label: 'PORTFOLIO', route: '/portfolio' },
  { label: 'AGENT', route: '/agent' },
  { label: 'TRADE', route: '/exchange' },
  { label: 'EXCHANGE', route: '/exchange' },
  { label: 'LOGS', route: '/records' },
  { label: 'RECORDS', route: '/records' },
  { label: 'ASSETS', route: '/asset' },
  { label: 'ASSET', route: '/asset' },
  { label: 'HELP', route: '/contact' },
  { label: 'CONTACT', route: '/contact' },
  { label: 'OPTION', route: '/options' },
  { label: 'OPTIONS', route: '/options' },
  { label: 'STORE', route: '/library' },
  { label: 'LIBRARY', route: '/library' },
  { label: 'ABOUT', route: '/about' },
  { label: 'DEV', route: '/developer' },
  { label: 'DEVELOPER', route: '/developer' },
  { label: 'EXIT', route: '/logout' },
  { label: 'LOGOUT', route: '/logout' },
  { label: 'MANAGE', route: '/manage' },
  { label: 'MARKET', route: '/market' },
  { label: 'MY SPACE', route: '/my-space' },
  { label: 'CONTROL CENTER', route: '/control-center' },
  { label: 'DEPOSIT', route: '/deposit' },
  { label: 'WITHDRAW', route: '/withdrawals' },
  { label: 'TRANSFER', route: '/transfer' },
  { label: 'SECURITY', route: '/security' },
  { label: 'TRANSACTIONS', route: '/transactions' },
  { label: 'NOTIFICATIONS', route: '/notifications' },
  { label: 'ALERT SETTINGS', route: '/alert-settings' },
  { label: 'APP USAGE', route: '/app-usage' },
  { label: 'THEME SETTINGS', route: '/theme-settings' },
  { label: 'NOWBAR SETTINGS', route: '/nowbar-settings' },
  { label: 'FAQ', route: '/faq' },
  { label: 'INFORMATION', route: '/information' },
  { label: 'PRIVACY POLICY', route: '/privacy-policy' },
  { label: 'COMMUNITY STANDARDS', route: '/community-standards' },
];

export const getVoiceModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(VOICE_MODE_STORAGE_KEY) === 'true';
};

export const normalizeVoiceText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const navigateFromVoice = (transcript: string) => {
  const normalized = normalizeVoiceText(transcript);
  if (normalized === 'command' || normalized.startsWith('command ') || normalized.endsWith(' command') || normalized.includes(' command ')) {
    navigate('/voice-commands');
    return true;
  }

  const command = VOICE_COMMANDS.find(({ label }) => {
    const normalizedLabel = normalizeVoiceText(label);
    return normalized === normalizedLabel || normalized.includes(normalizedLabel);
  });
  if (!command) return false;
  navigate(command.route);
  return true;
};
