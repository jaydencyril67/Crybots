import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigate';
import { VOICE_COMMANDS } from '../utils/voiceNavigation';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
const VoiceCommandsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const commands = VOICE_COMMANDS.filter((command, index, all) => all.findIndex((item) => item.label === command.label) === index);
  return (
    <HybridTheme mode={themeMode}>
      <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '132px' }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)' }}>
          <button type="button" onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={17} /> Back</button>
          <h1 style={{ margin: '20px 0 8px', fontSize: '1.15rem', fontWeight: 900 }}>Voice Commands</h1>
          <p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.6 }}>Say any NowBar label to navigate. Say “Command” to open this page.</p>
          <section style={{ marginTop: '22px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, display: 'grid', gap: '10px' }}>
            {commands.map((command) => <button key={command.label} type="button" onClick={() => navigate(command.route)} style={{ display: 'grid', gap: '4px', textAlign: 'left', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', fontWeight: 800 }}><span>{command.label}</span><small style={{ color: theme.textMuted, fontWeight: 600 }}>{command.route}</small></button>)}
          </section>
        </div>
      </main>
    </HybridTheme>
  );
};

export default VoiceCommandsPage;
