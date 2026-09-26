import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NotificationBanner, { type NotificationTone } from './NotificationBanner';
import LoadingDots from './LoadingDots';

type PercentValue = number | '';
type AutoSellRule = { enabled: boolean; minPercent: PercentValue; maxPercent: PercentValue; points: number };
type RangeRule = { enabled: boolean; minPercent: PercentValue; maxPercent: PercentValue };
type FunctionKey = 'autoSell' | 'marketNotification' | 'takeProfit';
type Status = { tone: NotificationTone; message: string } | null;
type RulesResponse = { autoSellRules: AutoSellRule[]; takeProfitRules: RangeRule[]; marketRangeNotificationRules: RangeRule[] };

type RuleFieldsProps = { minPercent: PercentValue; maxPercent: PercentValue; onChange: (field: 'minPercent' | 'maxPercent', value: PercentValue) => void; theme: typeof HYBRID_THEME_TOKENS.dark };

const RuleFields = ({ minPercent, maxPercent, onChange, theme }: RuleFieldsProps) => {
  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '10px 11px', borderRadius: '9px', border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text, fontSize: '0.9rem' };
  return <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
    <label style={{ display: 'grid', gap: '5px', flex: 1, minWidth: '160px' }}><span style={{ color: theme.textMuted, fontSize: '0.76rem' }}>Range starts at (%)</span><input style={inputStyle} type="number" min="0" max="3" step="0.01" value={minPercent} onChange={(event) => onChange('minPercent', event.target.value === '' ? '' : Number(event.target.value))} /></label>
    <label style={{ display: 'grid', gap: '5px', flex: 1, minWidth: '160px' }}><span style={{ color: theme.textMuted, fontSize: '0.76rem' }}>Range ends at (%)</span><input style={inputStyle} type="number" min="0" max="3" step="0.01" value={maxPercent} onChange={(event) => onChange('maxPercent', event.target.value === '' ? '' : Number(event.target.value))} /></label>
  </div>;
};

const ControlCenterPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [autoSell, setAutoSell] = useState<AutoSellRule>({ enabled: false, minPercent: 0, maxPercent: 1, points: 1 });
  const [marketNotification, setMarketNotification] = useState<RangeRule>({ enabled: false, minPercent: 0, maxPercent: 1 });
  const [takeProfit, setTakeProfit] = useState<RangeRule>({ enabled: false, minPercent: 0, maxPercent: 1 });
  const [status, setStatus] = useState<Record<FunctionKey, Status>>({ autoSell: null, marketNotification: null, takeProfit: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<FunctionKey | null>(null);

  const styles = {
    page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
    back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    section: { display: 'grid', gap: '10px', marginTop: '16px' },
    title: { margin: 0, fontSize: '0.96rem', fontWeight: 900 },
    card: { padding: '14px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, display: 'grid', gap: '12px' },
    rule: { display: 'grid', gap: '11px', padding: '13px', borderRadius: '13px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
    description: { margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.5 },
    button: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: `1px solid ${theme.primary}`, borderRadius: '9px', padding: '9px 12px', background: theme.primary, color: theme.textInverse, fontWeight: 800, cursor: 'pointer' },
    toggle: { accentColor: theme.primary },
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<RulesResponse>('/api/control-center');
        if (data.autoSellRules?.[0]) setAutoSell(data.autoSellRules[0]);
        if (data.marketRangeNotificationRules?.[0]) setMarketNotification(data.marketRangeNotificationRules[0]);
        if (data.takeProfitRules?.[0]) setTakeProfit(data.takeProfitRules[0]);
      } catch {
        const message = 'Unable to load your Control Center settings.';
        setStatus({ autoSell: { tone: 'error', message }, marketNotification: { tone: 'error', message }, takeProfit: { tone: 'error', message } });
      } finally { setLoading(false); }
    };
    void load();
  }, []);

  const updateRule = <T extends AutoSellRule | RangeRule>(setter: React.Dispatch<React.SetStateAction<T>>, field: keyof T, value: number | boolean | '') => setter((rule) => ({ ...rule, [field]: value }));
  const save = async (functionKey: FunctionKey, rule: AutoSellRule | RangeRule) => {
    setSaving(functionKey);
    setStatus((current) => ({ ...current, [functionKey]: null }));
    try {
      const normalized = { ...rule, minPercent: rule.minPercent === '' ? Number.NaN : rule.minPercent, maxPercent: rule.maxPercent === '' ? Number.NaN : rule.maxPercent };
      await api.put('/api/control-center', { function: functionKey, rule: normalized });
      setStatus((current) => ({ ...current, [functionKey]: { tone: 'success', message: 'Settings saved.' } }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to save these settings.';
      setStatus((current) => ({ ...current, [functionKey]: { tone: 'error', message } }));
    } finally { setSaving(null); }
  };

  const renderSection = (key: FunctionKey, title: string, description: string, rule: AutoSellRule | RangeRule, onChange: (field: 'enabled' | 'minPercent' | 'maxPercent' | 'points', value: number | boolean | '') => void, points = false) => (
    <section style={styles.section}><h2 style={styles.title}>{title}</h2><div style={styles.card}><p style={styles.description}>{description}</p>
      {loading ? <LoadingDots /> : <div style={styles.rule}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}><input style={styles.toggle} type="checkbox" checked={rule.enabled} onChange={(event) => onChange('enabled', event.target.checked)} /> Enable this function</label><RuleFields minPercent={rule.minPercent} maxPercent={rule.maxPercent} onChange={onChange} theme={theme} />{points && <label style={{ display: 'grid', gap: '5px' }}><span style={{ color: theme.textMuted, fontSize: '0.76rem' }}>Points to withdraw</span><input style={{ width: '100%', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '9px', border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text, fontSize: '0.9rem' }} type="number" min="1" max="1000000" step="0.01" value={(rule as AutoSellRule).points} onChange={(event) => onChange('points', Number(event.target.value))} /></label>}</div>}
      {status[key] ? <NotificationBanner tone={status[key]!.tone} title={title} message={status[key]!.message} /> : null}<button type="button" style={styles.button} disabled={saving !== null || loading} onClick={() => void save(key, rule)}>{saving === key ? <><LoadingDots /> Saving…</> : `Save ${title}`}</button>
    </div></section>
  );

  return <HybridTheme><Helmet><title>Control Center | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button><h1 style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '9px' }}><Bot size={23} /> Control Center</h1><p style={{ ...styles.description, marginTop: '7px' }}>Set rules that respond to the live market automatically. Rules only run when your points are active.</p>
    {renderSection('autoSell', 'Auto-sell points', 'When the market is inside the selected range, withdraw the chosen number of active points into your USDT balance. The rule triggers once per market entry.', autoSell, (field, value) => updateRule(setAutoSell, field, value), true)}
    {renderSection('marketNotification', 'Market range notifications', 'Get notified when the market enters the selected range. This rule only sends alerts and never sells or withdraws points.', marketNotification, (field, value) => updateRule(setMarketNotification, field, value))}
    {renderSection('takeProfit', 'Take profits', 'Take-profit rules sell only points earned above your original capital. Your initial points bought stay invested.', takeProfit, (field, value) => updateRule(setTakeProfit, field, value))}
  </div></div></HybridTheme>;
};

export default ControlCenterPage;
