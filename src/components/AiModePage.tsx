import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mic, ShieldCheck } from 'lucide-react';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';
import { requestVoiceMicrophoneAccess, VOICE_MODE_CHANGED_EVENT, VOICE_MODE_STORAGE_KEY } from '../utils/voiceNavigation';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px', background: theme.background, color: theme.text },
  shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  card: { marginTop: '22px', padding: '16px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  heading: { margin: 0, fontSize: '1.08rem', fontWeight: 850 },
  description: { margin: '8px 0 16px', color: theme.textMuted, fontSize: '0.88rem', lineHeight: 1.55 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  button: { width: '100%', borderRadius: '12px', border: `1px solid ${theme.primary}`, padding: '12px 16px', fontWeight: 850, color: theme.textInverse, background: theme.primary, cursor: 'pointer', marginTop: '14px' },
  muted: { color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.5, margin: '12px 0 0' },
});

const AiModePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setEnabled(window.localStorage.getItem(VOICE_MODE_STORAGE_KEY) === 'true');
  }, []);

  const toggleAiMode = async () => {
    if (requesting) return;
    setMessage('');
    if (enabled) {
      window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, 'false');
      window.dispatchEvent(new Event(VOICE_MODE_CHANGED_EVENT));
      setEnabled(false);
      setMessage('AI Mode is disabled.');
      return;
    }

    setRequesting(true);
    try {
      const granted = await requestVoiceMicrophoneAccess();
      if (!granted) {
        setMessage('Microphone access is needed to enable AI Mode. Check your app permissions and try again.');
        return;
      }
      window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, 'true');
      window.dispatchEvent(new Event(VOICE_MODE_CHANGED_EVENT));
      setEnabled(true);
      setMessage('AI Mode is enabled. You can now use supported voice commands while navigating CryBots.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" style={styles.back} onClick={() => navigate('/help')}><ArrowLeft size={17} /> Help</button>
          <section style={styles.card}>
            <h1 style={styles.heading}>🤖 AI Mode</h1>
            <p style={styles.description}>Use voice-powered AI to navigate CryBots and interact with supported controls using natural language. AI Mode requires microphone permission.</p>
            <div style={styles.row}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                {enabled ? <ShieldCheck size={24} /> : <Mic size={24} />}
                <div>
                  <p style={{ margin: 0, fontWeight: 800 }}>AI Mode</p>
                  <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.82rem' }}>{enabled ? 'Currently enabled' : 'Currently disabled'}</p>
                </div>
              </div>
            </div>
            <button type="button" style={styles.button} onClick={() => void toggleAiMode()} disabled={requesting} aria-pressed={enabled}>
              {requesting ? 'Requesting microphone…' : enabled ? 'Disable AI mode' : 'Enable AI mode'}
            </button>
            <p role="status" aria-live="polite" style={styles.muted}>{message || 'Your setting is saved on this device. You can change it here whenever you need.'}</p>
          </section>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default AiModePage;
