import { useEffect, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';

type Dashboard = { agent: { code: string | null; link: string | null } };

const AgentToolsPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [data, setData] = useState<Dashboard | null>(null);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Dashboard>('/api/referrals/dashboard').then(({ data: response }) => setData(response)).catch((err: any) => setError(err?.response?.data?.message || 'Unable to load your referral tools.'));
  }, []);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const share = async () => {
    if (!data?.agent.link) return;
    if (navigator.share) await navigator.share({ title: 'Join KingsHall Exchange', text: 'Join me on KingsHall Exchange.', url: data.agent.link });
    else await copy(data.agent.link, 'link');
  };

  return <HybridTheme><div style={styles.page(theme)}><main style={styles.shell}><section style={styles.section}><h1 style={styles.title}>Agent tools</h1><p style={styles.text(theme)}>Share your referral code and invite link with your community.</p></section>{error && <p style={{ ...styles.text(theme), color: '#f87171' }}>{error}</p>}{!data ? <div style={styles.loading}><LoadingDots /></div> : <section style={styles.card(theme)}><div style={styles.codeRow}><div><span style={styles.label(theme)}>Referral code</span><strong style={styles.code}>{data.agent.code || '—'}</strong><button type="button" style={styles.secondary(theme)} onClick={() => void copy(data.agent.code || '', 'code')}><Copy size={16} /> {copied === 'code' ? 'Copied' : 'Copy code'}</button></div>{data.agent.link && <QRCodeSVG value={data.agent.link} size={150} bgColor="transparent" fgColor={theme.text} />}</div><span style={styles.label(theme)}>Referral link</span><p style={styles.link(theme)}>{data.agent.link || '—'}</p><div style={styles.actions}>{data.agent.link && <button type="button" style={styles.primary(theme)} onClick={() => void copy(data.agent.link || '', 'link')}>{copied === 'link' ? <Check size={16} /> : <Copy size={16} />} {copied === 'link' ? 'Copied' : 'Copy link'}</button>}<button type="button" style={styles.secondary(theme)} onClick={() => void share()}><Share2 size={16} /> Share invite</button></div></section>}</main></div></HybridTheme>;
};

const styles = {
  page: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }),
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  section: { display: 'grid', gap: 10, marginTop: 18 },
  title: { margin: 0, fontSize: '1.45rem', fontWeight: 900 },
  text: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, maxWidth: '62ch', color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }),
  card: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 16, marginTop: 22, padding: 18, borderRadius: 18, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }),
  codeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' as const },
  label: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'block', marginBottom: 7, color: theme.textMuted, fontSize: '0.78rem' }),
  code: { display: 'block', fontSize: 'clamp(1.5rem, 5vw, 2rem)', letterSpacing: '0.08em' },
  link: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.6, wordBreak: 'break-all' as const }),
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  primary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 42, border: `1px solid ${theme.primary}`, borderRadius: 999, background: theme.primary, color: theme.textInverse, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  secondary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38, marginTop: 10, padding: '9px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 999, background: theme.surfaceMuted, color: theme.text, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  loading: { display: 'flex', justifyContent: 'center', padding: 32 },
};

export default AgentToolsPage;
