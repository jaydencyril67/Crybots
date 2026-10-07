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
  const styles = {
    page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: '90px' },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
    back: { display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    heading: { margin: '20px 0 8px', fontSize: '1.15rem', fontWeight: 900 },
    intro: { margin: 0, color: theme.textMuted, lineHeight: 1.6, fontSize: '0.86rem' },
    card: { marginTop: '22px', padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    list: { display: 'grid', gap: '10px' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '13px 14px', borderRadius: '15px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
    rowContent: { minWidth: 0 },
    label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
    description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
    button: { borderRadius: '999px', border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', flexShrink: 0, fontSize: '0.82rem' },
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" onClick={() => navigate('/home')} style={styles.back}><ArrowLeft size={17} /> Back</button>
          <h1 style={styles.heading}>Voice Commands</h1>
          <p style={styles.intro}>Say “Hi”, “Hello”, or “Hey” for a spoken welcome. Say any NowBar label to navigate. Say “Up” or “Down” to scroll the page. Say “Off” or “Of” to turn voice mode off. Say “Command” to open this full page menu.</p>

          <section style={styles.card}>
            <div style={styles.list}>
              {commands.map((command) => (
                <div key={command.label} style={styles.row}>
                  <div style={styles.rowContent}>
                    <p style={styles.label}>{command.label}</p>
                    <p style={styles.description}>{'route' in command ? command.route : command.description}</p>
                  </div>
                  <button type="button" onClick={command.action} style={styles.button}>Use</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <NowBar />
    </HybridTheme>
  );
};

export default VoiceCommandsPage;
