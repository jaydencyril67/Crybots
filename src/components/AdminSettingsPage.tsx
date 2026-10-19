import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

const EDGE_LIGHT_STORAGE_KEY = 'nowbar_edge_light';
const BUTTON_COLOR_ENABLED_STORAGE_KEY = 'nowbar_button_color_enabled';
const SWIPE_NAVIGATION_STORAGE_KEY = 'nowbar_swipe_navigation_enabled';
const EXPAND_MODE_STORAGE_KEY = 'nowbar_expand_mode_enabled';

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
  page: { minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 90 },
  shell: { width: '100%', maxWidth: 920, margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' as const },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
  title: { margin: '20px 0 0', fontSize: '1.25rem', fontWeight: 900 },
  text: { margin: '8px 0 0', color: theme.textMuted, lineHeight: 1.6 },
  card: { marginTop: 22, padding: 18, borderRadius: 22, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
  heading: { margin: 0, fontSize: '1.05rem', fontWeight: 850 },
  cardText: { margin: '6px 0 16px', color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
  list: { display: 'grid', gap: 10 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
  content: { minWidth: 0 },
  label: { margin: 0, fontWeight: 800, fontSize: '0.92rem' },
  description: { margin: '3px 0 0', color: theme.textMuted, fontSize: '0.78rem', lineHeight: 1.35 },
  button: { borderRadius: 999, border: `1px solid ${theme.borderGlass}`, padding: '9px 13px', fontWeight: 800, color: theme.text, background: theme.surfaceMuted, cursor: 'pointer', flexShrink: 0 },
  active: { background: theme.primary, color: theme.textInverse, border: `1px solid ${theme.primary}` },
  danger: { background: '#dc2626', color: '#fff', borderColor: '#dc2626' },
});

const AdminSettingsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);
  const [edgeLightEnabled, setEdgeLightEnabled] = useState(false);
  const [buttonColorEnabled, setButtonColorEnabled] = useState(false);
  const [swipeNavigationEnabled, setSwipeNavigationEnabled] = useState(true);
  const [expandModeEnabled, setExpandModeEnabled] = useState(true);

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    try {
      const edge = JSON.parse(localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) || '{}') as { enabled?: boolean };
      setEdgeLightEnabled(Boolean(edge.enabled));
      setButtonColorEnabled(localStorage.getItem(BUTTON_COLOR_ENABLED_STORAGE_KEY) === 'true');
      const swipe = localStorage.getItem(SWIPE_NAVIGATION_STORAGE_KEY);
      const expand = localStorage.getItem(EXPAND_MODE_STORAGE_KEY);
      if (swipe !== null) setSwipeNavigationEnabled(swipe === 'true');
      if (expand !== null) setExpandModeEnabled(expand === 'true');
    } catch {
      // Keep the default NowBar settings when saved data is invalid.
    }
  }, []);

  if (!isAdminToken(localStorage.getItem('token'))) return null;

  const toggleEdgeLight = () => {
    const next = !edgeLightEnabled;
    setEdgeLightEnabled(next);
    let saved: { color?: string; mode?: string } = {};
    try { saved = JSON.parse(localStorage.getItem(EDGE_LIGHT_STORAGE_KEY) || '{}') as typeof saved; } catch { /* use defaults */ }
    localStorage.setItem(EDGE_LIGHT_STORAGE_KEY, JSON.stringify({ ...saved, enabled: next }));
    window.dispatchEvent(new Event('nowbar-edge-light-changed'));
  };

  const toggleNowBarSetting = (key: string, value: boolean, setValue: (next: boolean) => void, eventName = 'nowbar-feature-settings-changed') => {
    setValue(value);
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event(eventName));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('kingshall_user');
    localStorage.removeItem('firstName');
    localStorage.removeItem('kingshall_first_name');
    window.dispatchEvent(new Event('ke:force-logout'));
    navigate('/signin');
  };

  const toggleRows = [
    { label: 'Edge lighting', description: 'Show the selected lighting effect around the NowBar.', enabled: edgeLightEnabled, onClick: toggleEdgeLight },
    { label: 'Button color', description: 'Use the selected NowBar color on navigation buttons.', enabled: buttonColorEnabled, onClick: () => toggleNowBarSetting(BUTTON_COLOR_ENABLED_STORAGE_KEY, !buttonColorEnabled, setButtonColorEnabled, 'nowbar-button-color-changed') },
    { label: 'Swipe navigation', description: 'Navigate between related admin pages by swiping on the NowBar.', enabled: swipeNavigationEnabled, onClick: () => toggleNowBarSetting(SWIPE_NAVIGATION_STORAGE_KEY, !swipeNavigationEnabled, setSwipeNavigationEnabled) },
    { label: 'Expand mode', description: 'Allow holding the NowBar to expand its navigation buttons.', enabled: expandModeEnabled, onClick: () => toggleNowBarSetting(EXPAND_MODE_STORAGE_KEY, !expandModeEnabled, setExpandModeEnabled) },
  ];

  return <HybridTheme mode={themeMode}><main style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/admin-home')}><ArrowLeft size={17} /> Admin dashboard</button>
    <h1 style={styles.title}>Admin settings</h1>
    <p style={styles.text}>Manage the administrator appearance, NowBar controls, and session.</p>
    <section style={styles.card}><h2 style={styles.heading}>Appearance</h2><p style={styles.cardText}>CryBots always uses its dark glass theme.</p></section>
    <section style={styles.card}><h2 style={styles.heading}>NowBar controls</h2><p style={styles.cardText}>Customize the administrator NowBar just like the user controls.</p><div style={styles.list}>{toggleRows.map((row) => <div key={row.label} style={styles.row}><div style={styles.content}><p style={styles.label}>{row.label}</p><p style={styles.description}>{row.description}</p></div><button type="button" style={{ ...styles.button, ...(row.enabled ? styles.active : {}) }} onClick={row.onClick} aria-pressed={row.enabled}>{row.enabled ? 'Enabled' : 'Enable'}</button></div>)}</div></section>
    <section style={styles.card}><h2 style={styles.heading}>Session</h2><p style={styles.cardText}>Sign out of the administrator account on this device.</p><button type="button" style={{ ...styles.button, ...styles.danger }} onClick={logout}><LogOut size={15} /> Log out</button></section>
  </div><NowBar admin /></main></HybridTheme>;
};

export default AdminSettingsPage;
