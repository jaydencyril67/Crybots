import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Copy, Filter, ListFilter, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { navigate } from '../utils/navigate';
import api from '../api/axios';
import LoadingDots from './LoadingDots';
import NotificationBanner, { NotificationTone } from './NotificationBanner';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';

type HistoryType = 'all' | 'profit' | 'loss' | 'financial';
type HistoryStatus = 'all' | 'completed' | 'pending' | 'failed';
type BotHistoryEntry = {
  id: string;
  kind: 'financial' | 'performance';
  title: string;
  amountValue: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
  direction: 'inbound' | 'outbound';
  reference: string;
  botId?: string;
  symbol?: string;
  dailyRate?: number | null;
  tradeDirection?: string;
};

const TradeHistory = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [entries, setEntries] = useState<BotHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<HistoryType>('all');
  const [statusFilter, setStatusFilter] = useState<HistoryStatus>('all');
  const [query, setQuery] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ tone: NotificationTone; title: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      setLoading(true);
      setAlert(null);
      try {
        const { data } = await api.get<{ history?: BotHistoryEntry[] }>('/api/bot-investments/history');
        if (cancelled) return;
        const valid = Array.isArray(data?.history) ? data.history.filter((entry) =>
          Boolean(entry?.id && entry.title && entry.currency && entry.status && entry.date && entry.reference)
          && typeof entry.amountValue === 'number'
        ) : [];
        setEntries(valid);
        if (!Array.isArray(data?.history)) setAlert({ tone: 'info', title: 'No history returned', message: 'The backend did not return bot history records.' });
      } catch {
        if (!cancelled) {
          setEntries([]);
          setAlert({ tone: 'error', title: 'Unable to load trade history', message: 'Bot financial activities and profit/loss records could not be loaded. Please try again later.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadHistory();
    return () => { cancelled = true; };
  }, []);

  const styles = {
    page: { minHeight: '100vh', background: theme.background, color: theme.text, overflowX: 'hidden' as const, overflowY: 'auto' as const, paddingBottom: '90px' },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' as const },
    content: { display: 'grid', gap: '14px', marginTop: '10px' },
    back: { alignSelf: 'start', justifySelf: 'start', width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid ${theme.borderGlass}`, borderRadius: '10px', padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem', marginBottom: '12px' },
    rowList: { display: 'grid', gap: '10px', width: '100%', minWidth: 0, padding: '10px', borderRadius: '16px', border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxSizing: 'border-box' as const },
    card: { width: '100%', maxWidth: '100%', background: theme.surfaceMuted, border: `1px solid ${theme.borderGlass}`, borderRadius: '15px', padding: '13px 14px', display: 'grid', gap: '12px', textAlign: 'left' as const, minWidth: 0, boxSizing: 'border-box' as const, overflow: 'hidden' as const },
    cardTitle: { margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const },
    cardText: { margin: '4px 0 0', color: theme.textMuted, lineHeight: 1.5, fontSize: '0.86rem' },
    filters: { display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '14px' },
    field: { display: 'grid', gap: '8px' },
    label: { fontSize: '0.82rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
    input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem' },
    select: { border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text, borderRadius: '14px', padding: '11px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const },
    overviewList: { display: 'grid', gap: '7px' },
    overviewItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: theme.surfaceMuted, padding: '13px 14px' },
    overviewLabel: { margin: 0, color: theme.text, fontSize: '0.9rem', fontWeight: 700 },
    overviewValue: { margin: 0, fontSize: '1rem', fontWeight: 900, textAlign: 'right' as const, flexShrink: 0 },
    pill: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap' as const },
    tableWrap: { overflowX: 'auto' as const, width: '100%', boxSizing: 'border-box' as const },
    table: { width: '100%', borderCollapse: 'collapse' as const, minWidth: '340px', fontSize: '0.78rem' },
    th: { textAlign: 'left' as const, fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: theme.textMuted, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, background: theme.surfaceMuted },
    td: { padding: '12px', borderBottom: `1px solid ${theme.border}`, verticalAlign: 'top' as const, fontSize: '0.78rem' },
    muted: { color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
    button: { border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '12px', padding: '9px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px' },
  };

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const kind = entry.kind === 'performance' ? (entry.amountValue >= 0 ? 'profit' : 'loss') : 'financial';
    const matchesType = typeFilter === 'all' || kind === typeFilter;
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesQuery = !query.trim() || `${entry.title} ${entry.reference} ${entry.description} ${entry.botId || ''} ${entry.symbol || ''}`.toLowerCase().includes(query.trim().toLowerCase());
    const amount = Math.abs(entry.amountValue);
    const min = amountMin ? Number(amountMin) : Number.NEGATIVE_INFINITY;
    const max = amountMax ? Number(amountMax) : Number.POSITIVE_INFINITY;
    return matchesType && matchesStatus && matchesQuery && amount >= min && amount <= max;
  }), [entries, typeFilter, statusFilter, query, amountMin, amountMax]);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const profits = filteredEntries.filter((entry) => entry.kind === 'performance' && entry.amountValue > 0).reduce((sum, entry) => sum + entry.amountValue, 0);
  const losses = filteredEntries.filter((entry) => entry.kind === 'performance' && entry.amountValue < 0).reduce((sum, entry) => sum + Math.abs(entry.amountValue), 0);
  const financialCount = filteredEntries.filter((entry) => entry.kind === 'financial').length;

  const clearFilters = () => {
    setTypeFilter('all'); setStatusFilter('all'); setQuery(''); setAmountMin(''); setAmountMax(''); setPage(1);
  };

  const copyReference = async (reference: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(reference);
      else {
        const textArea = document.createElement('textarea');
        textArea.value = reference; textArea.style.position = 'fixed'; textArea.style.opacity = '0';
        document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea);
      }
      setAlert({ tone: 'success', title: 'Reference copied', message: 'The bot activity reference has been copied to your clipboard.' });
    } catch {
      setAlert({ tone: 'error', title: 'Copy failed', message: 'Could not copy this reference. Please try again.' });
    }
  };

  const localDateTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? { date: value, time: '—' } : {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  const money = (value: number, currency: string) => `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)} ${currency}`;

  return (
    <HybridTheme mode={themeMode}>
      <style>{`@media (max-width: 640px) { .trade-history-filters { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; } .trade-history-filters > div { min-width: 0; } .trade-history-filters input, .trade-history-filters select, .trade-history-filters button { min-width: 0; font-size: 0.78rem; padding-left: 9px; padding-right: 9px; } }`}</style>
      <div data-shadow-free-page="trade-history" style={styles.page}>
        <Helmet><title>Trade History | CryBots</title></Helmet>
        <div style={styles.shell}>
          <div style={styles.content}>
            <button type="button" style={styles.back} onClick={() => navigate('/trade')}><ArrowLeft size={17} /> Trade</button>
            <div style={styles.rowList}>
              <section style={{ ...styles.card, position: 'relative', zIndex: 2, overflow: 'visible' }}>
                <button type="button" style={{ ...styles.select, border: 'none', padding: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setFiltersOpen((open) => !open)}>
                  <span style={styles.cardTitle}><Filter size={18} /> Filters</span><span style={{ ...styles.muted, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{typeFilter === 'all' ? 'All bot activity' : typeFilter} <ChevronDown size={17} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none' }} /></span>
                </button>
                {filtersOpen ? <div className="trade-history-filters" style={styles.filters}>
                  <label style={styles.field}><span style={styles.label}>Search</span><span style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: theme.textMuted }} /><input style={{ ...styles.input, paddingLeft: '36px' }} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Bot, symbol, reference" /></span></label>
                  <label style={styles.field}><span style={styles.label}>Activity type</span><select style={styles.select} value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as HistoryType); setPage(1); }}><option value="all">All activity</option><option value="profit">Bot profits</option><option value="loss">Bot losses</option><option value="financial">Financial activity</option></select></label>
                  <label style={styles.field}><span style={styles.label}>Status</span><select style={styles.select} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as HistoryStatus); setPage(1); }}><option value="all">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label>
                  <label style={styles.field}><span style={styles.label}>Min amount</span><input style={styles.input} inputMode="decimal" value={amountMin} onChange={(event) => { setAmountMin(event.target.value); setPage(1); }} placeholder="0.00" /></label>
                  <label style={styles.field}><span style={styles.label}>Max amount</span><input style={styles.input} inputMode="decimal" value={amountMax} onChange={(event) => { setAmountMax(event.target.value); setPage(1); }} placeholder="9999.99" /></label>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}><button type="button" style={styles.button} onClick={clearFilters}>Clear filters</button></div>
                </div> : null}
              </section>

              <section style={{ ...styles.card, position: 'relative', zIndex: 1 }}>
                <button type="button" style={{ ...styles.select, border: 'none', padding: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOverviewOpen((open) => !open)}>
                  <span style={styles.cardTitle}><ListFilter size={18} /> Overview</span><span style={{ ...styles.muted, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{loading ? <LoadingDots /> : `${filteredEntries.length} of ${entries.length}`} <ChevronDown size={17} style={{ transform: overviewOpen ? 'rotate(180deg)' : 'none' }} /></span>
                </button>
                {overviewOpen ? <div style={styles.overviewList}>
                  <div style={styles.overviewItem}><div><p style={styles.overviewLabel}>Bot profit total</p><p style={styles.cardText}>Positive daily settlements in current results</p></div><p style={{ ...styles.overviewValue, color: theme.success }}>{loading ? <LoadingDots /> : `+${profits.toFixed(2)} USDT`}</p></div>
                  <div style={styles.overviewItem}><div><p style={styles.overviewLabel}>Bot loss total</p><p style={styles.cardText}>Negative daily settlements in current results</p></div><p style={{ ...styles.overviewValue, color: theme.danger }}>{loading ? <LoadingDots /> : `-${losses.toFixed(2)} USDT`}</p></div>
                  <div style={styles.overviewItem}><div><p style={styles.overviewLabel}>Financial activities</p><p style={styles.cardText}>Activation, withdrawal, and returned bot funds</p></div><p style={styles.overviewValue}>{loading ? <LoadingDots /> : financialCount}</p></div>
                </div> : null}
              </section>

              <section style={{ ...styles.card, gap: '16px' }}>
                {alert ? <NotificationBanner tone={alert.tone} title={alert.title} message={alert.message} /> : null}
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Activity</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead>
                    <tbody>
                      {loading ? <tr><td style={{ ...styles.td, textAlign: 'center' }} colSpan={3}><LoadingDots /></td></tr> : rows.length ? rows.map((entry, index) => {
                        const expanded = expandedId === entry.id;
                        const dateTime = localDateTime(entry.date);
                        const positive = entry.amountValue >= 0;
                        const statusStyle = entry.status === 'completed' ? { color: theme.success, borderColor: theme.success } : entry.status === 'pending' ? { color: theme.warning, borderColor: theme.warning } : { color: theme.danger, borderColor: theme.danger };
                        return <React.Fragment key={entry.id}>
                          <tr style={{ background: index % 2 === 0 ? theme.surfaceShine : 'transparent' }}>
                            <td style={styles.td}><strong>{entry.title}</strong></td>
                            <td style={styles.td}><span style={{ ...styles.pill, ...statusStyle, border: `1px solid ${statusStyle.borderColor}`, background: theme.primarySoft }}>{entry.status}</span></td>
                            <td style={styles.td}><button type="button" style={styles.button} onClick={() => setExpandedId(expanded ? null : entry.id)}>{expanded ? 'Hide' : 'View'}</button></td>
                          </tr>
                          {expanded ? <tr><td colSpan={3} style={{ ...styles.td, background: theme.surfaceGlass }}>
                            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                              <div><span style={styles.label}>Amount</span><p style={{ ...styles.cardText, color: positive ? theme.success : theme.danger, fontWeight: 800 }}>{money(entry.amountValue, entry.currency)}</p></div>
                              <div><span style={styles.label}>Activity type</span><p style={styles.cardText}>{entry.kind === 'performance' ? (entry.amountValue >= 0 ? 'Bot profit' : 'Bot loss') : 'Bot financial activity'}</p></div>
                              <div><span style={styles.label}>Direction</span><p style={styles.cardText}>{entry.direction === 'inbound' ? 'Inbound' : 'Outbound'}</p></div>
                              <div><span style={styles.label}>Currency</span><p style={styles.cardText}>{entry.currency}</p></div>
                              <div><span style={styles.label}>Bot ID</span><p style={{ ...styles.cardText, wordBreak: 'break-all' }}>{entry.botId || '—'}</p></div>
                              {entry.symbol ? <div><span style={styles.label}>Trading pair</span><p style={styles.cardText}>{entry.symbol}</p></div> : null}
                              {entry.tradeDirection ? <div><span style={styles.label}>Bot direction</span><p style={styles.cardText}>{entry.tradeDirection.toUpperCase()}</p></div> : null}
                              {entry.dailyRate !== null && entry.dailyRate !== undefined ? <div><span style={styles.label}>Daily rate</span><p style={styles.cardText}>{(entry.dailyRate * 100).toFixed(2)}%</p></div> : null}
                              <div><span style={styles.label}>Reference</span><p style={{ ...styles.cardText, wordBreak: 'break-all' }}>{entry.reference}</p></div>
                              <div><span style={styles.label}>Date & time</span><p style={styles.cardText}>{dateTime.date} {dateTime.time}</p></div>
                              <div style={{ gridColumn: '1 / -1' }}><span style={styles.label}>Details</span><p style={styles.cardText}>{entry.description}</p></div>
                              <div style={{ gridColumn: '1 / -1' }}><button type="button" style={styles.button} onClick={() => { void copyReference(entry.reference); }}><Copy size={16} /> Copy reference</button></div>
                            </div>
                          </td></tr> : null}
                        </React.Fragment>;
                      }) : <tr><td style={styles.td} colSpan={3}><div style={{ padding: '18px 0', textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 800 }}>No bot activity found</p><p style={{ ...styles.cardText, marginTop: '8px' }}>Bot profits, losses, and financial activities will appear here when records exist. Try changing the filters if you expected a record.</p></div></td></tr>}
                    </tbody>
                  </table>
                </div>
                {filteredEntries.length > pageSize ? <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <p style={styles.cardText}>Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} activities</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button type="button" style={styles.button} disabled={currentPage === 1} onClick={() => { setPage((value) => Math.max(1, value - 1)); setExpandedId(null); }}>Prev</button>
                    <span style={styles.muted}>Page {currentPage} / {totalPages}</span>
                    <button type="button" style={styles.button} disabled={currentPage === totalPages} onClick={() => { setPage((value) => Math.min(totalPages, value + 1)); setExpandedId(null); }}>Next</button>
                  </div>
                </div> : null}
              </section>
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default TradeHistory;
