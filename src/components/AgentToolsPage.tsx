import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type Dashboard = { agent: { code: string | null; link: string | null } };

const AgentToolsPage = () => {
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

  const share = async () => {
    if (!data?.agent.link) return;
    if (navigator.share) await navigator.share({ title: 'Join KingsHall Exchange', text: 'Join me on KingsHall Exchange.', url: data.agent.link });
    else await copy(data.agent.link, 'link');
  };

  return <HybridTheme><div style={styles.page(theme)}><main style={styles.shell}><button type="button" style={styles.back(theme)} onClick={() => navigate('/agent')}><ArrowLeft size={16} /> Agent</button>{error && <p style={{ ...styles.text(theme), color: '#f87171' }}>{error}</p>}<div style={styles.rowList(theme)}><section style={styles.card(theme)}><h2 style={styles.cardTitle}>Referral code</h2>{loading ? <LoadingDots /> : <strong style={styles.code}>{data?.agent.code || '—'}</strong>}<button type="button" style={styles.secondary(theme)} disabled={!data?.agent.code} onClick={() => void copy(data?.agent.code || '', 'code')}><Copy size={16} /> {copied === 'code' ? 'Copied' : 'Copy code'}</button></section><section style={styles.card(theme)}><h2 style={styles.cardTitle}>Referral link</h2>{loading ? <LoadingDots /> : <p style={styles.link(theme)}>{data?.agent.link || '—'}</p>}<div style={styles.actions}>{data?.agent.link && <button type="button" style={styles.primary(theme)} onClick={() => void copy(data.agent.link || '', 'link')}>{copied === 'link' ? <Check size={16} /> : <Copy size={16} />} {copied === 'link' ? 'Copied' : 'Copy link'}</button>}<button type="button" style={styles.secondary(theme)} disabled={!data?.agent.link} onClick={() => void share()}><Share2 size={16} /> Share invite</button></div></section><section style={styles.card(theme)}><h2 style={styles.cardTitle}>QR code</h2><div style={styles.qr}>{data?.agent.link ? <QRCodeSVG value={data.agent.link} size={180} bgColor="transparent" fgColor={theme.text} /> : <LoadingDots />}</div><p style={styles.text(theme)}>Scan this code to share your referral link.</p></section></div></main></div></HybridTheme>;
};

const styles = {
  page: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }),
  shell: { width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' as const },
  back: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '8px 12px', background: theme.surfaceGlass, color: theme.text, fontSize: '0.86rem', cursor: 'pointer', fontWeight: 700 }),
  text: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, maxWidth: '62ch', color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }),
  rowList: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 10, marginTop: 18, padding: 18, borderRadius: 22, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }),
  card: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'grid', gap: 16, padding: 14, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted }),
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: 800 },
  codeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' as const },
  qr: { display: 'flex', justifyContent: 'center', padding: '8px 0' },
  label: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'block', marginBottom: 7, color: theme.textMuted, fontSize: '0.78rem' }),
  code: { display: 'block', fontSize: 'clamp(1.5rem, 5vw, 2rem)', letterSpacing: '0.08em' },
  link: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ margin: 0, color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.6, wordBreak: 'break-all' as const }),
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  primary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 42, border: `1px solid ${theme.primary}`, borderRadius: 999, background: theme.primary, color: theme.textInverse, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  secondary: (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38, marginTop: 10, padding: '9px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 999, background: theme.surfaceMuted, color: theme.text, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }),
  loading: { display: 'flex', justifyContent: 'center', padding: 32 },
};

export default AgentToolsPage;
