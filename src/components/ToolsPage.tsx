import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NowBar from './NowBar';

type Dashboard = { agent: { code: string | null } };

const ToolsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Dashboard>('/api/referrals/dashboard').then(({ data: response }) => setData(response)).catch((err: any) => setError(err?.response?.data?.message || 'Unable to load your referral tools.')).finally(() => setLoading(false));
  }, []);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  };

  return <HybridTheme><div style={styles.page(theme)}><main style={styles.shell}><button type="button" style={styles.back(theme)} onClick={() => navigate('/agent')}><ArrowLeft size={16} /> Agent</button>{error && <p style={{ ...styles.text(theme), color: '#f87171' }}>{error}</p>}<div style={styles.rowList(theme)}><section style={styles.card(theme)}><h2 style={styles.cardTitle}>Referral code</h2><div style={styles.itemValue}>{loading ? <LoadingDots /> : <strong style={styles.code}>{data?.agent.code || '—'}</strong>}<button type="button" style={styles.secondary(theme)} disabled={!data?.agent.code} onClick={() => void copy(data?.agent.code || '', 'code')}><Copy size={16} /> {copied === 'code' ? 'Copied' : 'Copy code'}</button></div></section></div></main><NowBar /></div></HybridTheme>;
};

const styles = {
  page: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ minHeight: '100vh', paddingBottom: '90px', background: theme.background, color: theme.text }),
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '8px 12px', background: theme.surfaceGlass, color: theme.text, fontSize: '0.86rem', cursor: 'pointer', fontWeight: 700 }),
  text: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, maxWidth: '62ch', color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }),
  rowList: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 0, marginTop: 18, padding: '8px 16px', borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }),
  card: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, minWidth: 0, padding: '16px 2px', borderRadius: 0, border: 'none', borderBottom: `1px solid ${theme.borderGlass}`, background: 'transparent' }),
  cardTitle: { margin: 0, fontSize: '0.78rem', fontWeight: 800, color: 'inherit' },
  itemValue: { display: 'grid', justifyItems: 'end', gap: 8, minWidth: 0, textAlign: 'right' as const },
  codeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' as const },
  label: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'block', marginBottom: 7, color: theme.textMuted, fontSize: '0.78rem' }),
  code: { display: 'block', fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', letterSpacing: '0.08em', overflowWrap: 'anywhere' as const },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  primary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 42, border: `1px solid ${theme.primary}`, borderRadius: 999, background: theme.primary, color: theme.textInverse, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  secondary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38, padding: '9px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 999, background: theme.surfaceMuted, color: theme.text, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  loading: { display: 'flex', justifyContent: 'center', padding: 32 },
};

export default ToolsPage;
