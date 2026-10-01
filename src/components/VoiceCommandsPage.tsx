import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigate';
import { AUTHENTICATED_NOWBAR_PAGE_ROUTES, NOWBAR_COMMAND_EVENT } from '../utils/voiceNavigation';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
const VoiceCommandsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const commands = [
    ...AUTHENTICATED_NOWBAR_PAGE_ROUTES.map((command) => ({ ...command, action: () => navigate(command.route) })),
    { label: 'EXPAND', description: 'Expand the compact NowBar', action: () => window.dispatchEvent(new CustomEvent(NOWBAR_COMMAND_EVENT, { detail: { command: 'expand' } })) },
    { label: 'SCROLL LEFT', description: 'Scroll the compact NowBar left', action: () => window.dispatchEvent(new CustomEvent(NOWBAR_COMMAND_EVENT, { detail: { command: 'left' } })) },
    { label: 'SCROLL RIGHT', description: 'Scroll the compact NowBar right', action: () => window.dispatchEvent(new CustomEvent(NOWBAR_COMMAND_EVENT, { detail: { command: 'right' } })) },
  ];
  return (
    <HybridTheme mode={themeMode}>
      <main style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)' }}>
          <button type="button" onClick={() => navigate('/home')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={17} /> Back</button>
          <h1 style={{ margin: '20px 0 8px', fontSize: '1.15rem', fontWeight: 900 }}>Voice Commands</h1>
          <p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.6 }}>Say “King” or “Kings” for a spoken welcome. Say any NowBar label to navigate. Say “Up” or “Down” to scroll the page. Say “Off” or “Of” to turn voice mode off. Say “Command” to open this full page menu.</p>
          <section style={{ marginTop: '22px', padding: '18px', borderRadius: '22px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, display: 'grid', gap: '10px' }}>
            {commands.map((command) => <button key={command.label} type="button" onClick={command.action} style={{ display: 'grid', gap: '4px', textAlign: 'left', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', fontWeight: 800 }}><span>{command.label}</span><small style={{ color: theme.textMuted, fontWeight: 600 }}>{'route' in command ? command.route : command.description}</small></button>)}
          </section>
        </div>
      </main>
      <NowBar />
    </HybridTheme>
  );
};

export default VoiceCommandsPage;
