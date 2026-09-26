import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, Plus, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NotificationBanner, { type NotificationTone } from './NotificationBanner';
import LoadingDots from './LoadingDots';

type PercentValue = number | '';
type AutoSellRule = { enabled: boolean; minPercent: PercentValue; maxPercent: PercentValue; points: number };
type TakeProfitRule = { enabled: boolean; minPercent: PercentValue; maxPercent: PercentValue };
type MarketRangeNotificationRule = { enabled: boolean; minPercent: PercentValue; maxPercent: PercentValue };
type Status = { tone: NotificationTone; message: string } | null;

type RuleFieldsProps = {
  minPercent: PercentValue;
  maxPercent: PercentValue;
  onChange: (field: 'minPercent' | 'maxPercent', value: PercentValue) => void;
  theme: typeof HYBRID_THEME_TOKENS.dark;
};

const RuleFields = ({ minPercent, maxPercent, onChange, theme }: RuleFieldsProps) => {
  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '10px 11px', borderRadius: '9px', border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text, fontSize: '0.9rem' };
  return <>
    <label style={{ display: 'grid', gap: '5px', flex: 1 }}><span style={{ color: theme.textMuted, fontSize: '0.76rem' }}>Range starts at (%)</span><input style={inputStyle} type="number" min="0" max="3" step="0.01" value={minPercent} onChange={(event) => onChange('minPercent', event.target.value === '' ? '' : Number(event.target.value))} /></label>
    <label style={{ display: 'grid', gap: '5px', flex: 1 }}><span style={{ color: theme.textMuted, fontSize: '0.76rem' }}>Range ends at (%)</span><input style={inputStyle} type="number" min="0" max="3" step="0.01" value={maxPercent} onChange={(event) => onChange('maxPercent', event.target.value === '' ? '' : Number(event.target.value))} /></label>
  </>;
};

const ControlCenterPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [autoSellRules, setAutoSellRules] = useState<AutoSellRule[]>([]);
  const [takeProfitRules, setTakeProfitRules] = useState<TakeProfitRule[]>([]);
  const [marketRangeNotificationRules, setMarketRangeNotificationRules] = useState<MarketRangeNotificationRule[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const styles = {
    page: { minHeight: '100vh', paddingBottom: '118px', background: theme.background, color: theme.text },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
    back: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    section: { display: 'grid', gap: '10px', marginTop: '16px' },
    title: { margin: 0, fontSize: '0.96rem', fontWeight: 900 },
    card: { padding: '14px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, display: 'grid', gap: '12px' },
    description: { margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.5 },
    rule: { display: 'grid', gap: '11px', padding: '13px', borderRadius: '13px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted },
    ruleTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
    row: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
    button: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '9px', padding: '9px 12px', background: theme.surfaceGlass, color: theme.text, fontWeight: 800, cursor: 'pointer' },
    primary: { borderColor: theme.primary, background: theme.primary, color: theme.textInverse },
    iconButton: { border: 0, background: 'transparent', color: theme.textMuted, cursor: 'pointer', padding: '4px' },
    toggle: { accentColor: theme.primary },
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ autoSellRules: AutoSellRule[]; takeProfitRules: TakeProfitRule[]; marketRangeNotificationRules: MarketRangeNotificationRule[] }>('/api/control-center');
        setAutoSellRules(data.autoSellRules || []);
        setTakeProfitRules(data.takeProfitRules || []);
        setMarketRangeNotificationRules(data.marketRangeNotificationRules || []);
      } catch {
        setStatus({ tone: 'error', message: 'Unable to load your Control Center settings.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const updateAutoSell = (index: number, field: keyof AutoSellRule, value: number | boolean | '') => setAutoSellRules((rules) => rules.map((rule, ruleIndex) => field === 'enabled' && value === true ? { ...rule, enabled: ruleIndex === index } : ruleIndex === index ? { ...rule, [field]: value } : rule));
  const updateTakeProfit = (index: number, field: keyof TakeProfitRule, value: number | boolean | '') => setTakeProfitRules((rules) => rules.map((rule, ruleIndex) => field === 'enabled' && value === true ? { ...rule, enabled: ruleIndex === index } : ruleIndex === index ? { ...rule, [field]: value } : rule));
  const updateMarketNotification = (index: number, field: keyof MarketRangeNotificationRule, value: number | boolean | '') => setMarketRangeNotificationRules((rules) => rules.map((rule, ruleIndex) => field === 'enabled' && value === true ? { ...rule, enabled: ruleIndex === index } : ruleIndex === index ? { ...rule, [field]: value } : rule));
  const addAutoSell = () => setAutoSellRules((rules) => [...rules, { enabled: rules.every((rule) => !rule.enabled), minPercent: 0, maxPercent: 1, points: 1 }]);
  const addTakeProfit = () => setTakeProfitRules((rules) => [...rules, { enabled: rules.every((rule) => !rule.enabled), minPercent: 0, maxPercent: 1 }]);
  const addMarketNotification = () => setMarketRangeNotificationRules((rules) => [...rules, { enabled: rules.every((rule) => !rule.enabled), minPercent: 0, maxPercent: 1 }]);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const toNumber = (value: PercentValue) => value === '' ? Number.NaN : value;
      const normalizedAutoSellRules = autoSellRules.map((rule) => ({ ...rule, minPercent: toNumber(rule.minPercent), maxPercent: toNumber(rule.maxPercent) }));
      const normalizedTakeProfitRules = takeProfitRules.map((rule) => ({ ...rule, minPercent: toNumber(rule.minPercent), maxPercent: toNumber(rule.maxPercent) }));
      const normalizedMarketNotificationRules = marketRangeNotificationRules.map((rule) => ({ ...rule, minPercent: toNumber(rule.minPercent), maxPercent: toNumber(rule.maxPercent) }));
      const { data } = await api.put('/api/control-center', { autoSellRules: normalizedAutoSellRules, takeProfitRules: normalizedTakeProfitRules, marketRangeNotificationRules: normalizedMarketNotificationRules });
      setAutoSellRules(data.autoSellRules || []);
      setTakeProfitRules(data.takeProfitRules || []);
      setMarketRangeNotificationRules(data.marketRangeNotificationRules || []);
      setStatus({ tone: 'success', message: 'Control Center settings saved.' });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setStatus({ tone: 'error', message: message || 'Unable to save your Control Center settings.' });
    } finally {
      setSaving(false);
    }
  };

  const rangeFields = (rule: AutoSellRule | TakeProfitRule, onChange: RuleFieldsProps['onChange']) => <div style={styles.row}><RuleFields minPercent={rule.minPercent} maxPercent={rule.maxPercent} onChange={onChange} theme={theme} /></div>;

  return <HybridTheme><Helmet><title>Control Center | KingsHall</title></Helmet><div style={styles.page}><div style={styles.shell}>
    <button type="button" style={styles.back} onClick={() => navigate('/exchange')}><ArrowLeft size={17} /> Exchange</button>
    <h1 style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '9px' }}><Bot size={23} /> Control Center</h1>
    <p style={{ ...styles.description, marginTop: '7px' }}>Set rules that respond to the live market automatically. Rules only run when your points are active.</p>
    {status ? <div style={{ marginTop: '14px' }}><NotificationBanner tone={status.tone} title="Control Center" message={status.message} /></div> : null}
    <section style={styles.section}><h2 style={styles.title}>Auto-sell points</h2><div style={styles.card}><p style={styles.description}>When the market is inside a selected range, withdraw the chosen number of active points into your USDT balance. Each rule triggers once per market entry.</p>
        {loading ? <LoadingDots /> : autoSellRules.map((rule, index) => <div style={styles.rule} key={`auto-${index}`}><div style={styles.ruleTop}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}><input style={styles.toggle} type="checkbox" checked={rule.enabled} onChange={(event) => updateAutoSell(index, 'enabled', event.target.checked)} /> Rule {index + 1}</label><button type="button" aria-label="Remove auto-sell rule" style={styles.iconButton} onClick={() => setAutoSellRules((rules) => rules.filter((_, ruleIndex) => ruleIndex !== index))}><Trash2 size={17} /></button></div>{rangeFields(rule, (field, value) => updateAutoSell(index, field, value))}<label style={{ display: 'grid', gap: '5px' }}><span style={{ color: theme.textMuted, fontSize: '0.76rem' }}>Points to withdraw</span><input style={{ width: '100%', boxSizing: 'border-box', padding: '10px 11px', borderRadius: '9px', border: `1px solid ${theme.borderGlass}`, background: theme.background, color: theme.text, fontSize: '0.9rem' }} type="number" min="1" max="1000000" step="0.01" value={rule.points} onChange={(event) => updateAutoSell(index, 'points', Number(event.target.value))} /></label></div>)}
        <button type="button" style={styles.button} onClick={addAutoSell}><Plus size={16} /> Add auto-sell rule</button>
      </div></section>
      <section style={styles.section}><h2 style={styles.title}>Market range notifications</h2><div style={styles.card}><p style={styles.description}>Get notified when the market enters one of these ranges. These rules only send alerts and never sell or withdraw points. Delivery follows your enabled market and notification channel preferences.</p>
        {loading ? <LoadingDots /> : marketRangeNotificationRules.map((rule, index) => <div style={styles.rule} key={`notification-${index}`}><div style={styles.ruleTop}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}><input style={styles.toggle} type="checkbox" checked={rule.enabled} onChange={(event) => updateMarketNotification(index, 'enabled', event.target.checked)} /> Rule {index + 1}</label><button type="button" aria-label="Remove market notification rule" style={styles.iconButton} onClick={() => setMarketRangeNotificationRules((rules) => rules.filter((_, ruleIndex) => ruleIndex !== index))}><Trash2 size={17} /></button></div>{rangeFields(rule, (field, value) => updateMarketNotification(index, field, value))}</div>)}
        <button type="button" style={styles.button} onClick={addMarketNotification}><Plus size={16} /> Add market notification</button>
      </div></section>
      <section style={styles.section}><h2 style={styles.title}>Take profits</h2><div style={styles.card}><p style={styles.description}>Take-profit rules sell only points earned above your original capital. Your initial points bought stay invested.</p>
        {loading ? <LoadingDots /> : takeProfitRules.map((rule, index) => <div style={styles.rule} key={`profit-${index}`}><div style={styles.ruleTop}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}><input style={styles.toggle} type="checkbox" checked={rule.enabled} onChange={(event) => updateTakeProfit(index, 'enabled', event.target.checked)} /> Rule {index + 1}</label><button type="button" aria-label="Remove take-profit rule" style={styles.iconButton} onClick={() => setTakeProfitRules((rules) => rules.filter((_, ruleIndex) => ruleIndex !== index))}><Trash2 size={17} /></button></div>{rangeFields(rule, (field, value) => updateTakeProfit(index, field, value))}</div>)}
        <button type="button" style={styles.button} onClick={addTakeProfit}><Plus size={16} /> Add take-profit rule</button>
      </div></section>
      <button type="button" style={{ ...styles.button, ...styles.primary, width: '100%', marginTop: '18px' }} disabled={saving || loading} onClick={() => void save()}>{saving ? <><LoadingDots /> Saving…</> : 'Save Control Center settings'}</button>
  </div></div></HybridTheme>;
};

export default ControlCenterPage;
