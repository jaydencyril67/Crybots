import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ChevronDown, Copy, Filter, ListFilter, Search } from 'lucide-react';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';
import NotificationBanner, { NotificationTone } from './NotificationBanner';

type TransactionType = 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'trade' | 'reward';
type TransactionDirection = 'all' | 'inbound' | 'outbound';
type TransactionStatus = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled';

type TransactionRecord = {
  id: string;
  type: Exclude<TransactionType, 'all'>;
  direction: Exclude<TransactionDirection, 'all'>;
  title: string;
  amount: string;
  amountValue: number;
  currency: string;
  status: Exclude<TransactionStatus, 'all'>;
  date: string;
  time: string;
  timestamp?: string;
  counterpart?: string;
  reference: string;
};

type TransactionHistoryResponse = {
  transactions?: Array<Partial<TransactionRecord> & { type?: TransactionRecord['type']; direction?: TransactionRecord['direction']; status?: TransactionRecord['status'] }>;
};

const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({
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
  selectTrigger: { border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text, borderRadius: '14px', padding: '11px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { position: 'absolute' as const, zIndex: 20, top: 'calc(100% + 6px)', left: 0, right: 0, display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: theme.surfaceElevated, border: `1px solid ${theme.border}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  overviewList: { display: 'grid', gap: '7px' },
  overviewItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: theme.surfaceMuted, padding: '13px 14px' },
  overviewLabelWrap: { minWidth: 0, display: 'grid', gap: '4px' },
  overviewLabel: { margin: 0, color: theme.text, fontSize: '0.9rem', fontWeight: 700 },
  overviewValue: { margin: 0, fontSize: '1rem', fontWeight: 900, textAlign: 'right' as const, flexShrink: 0 },
  pill: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap' as const },
  tableWrap: { overflowX: 'auto' as const, width: '100%', boxSizing: 'border-box' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, minWidth: '360px', fontSize: '0.78rem' },
  th: { textAlign: 'left' as const, fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: theme.textMuted, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, background: theme.surfaceMuted },
  td: { padding: '12px', borderBottom: `1px solid ${theme.border}`, verticalAlign: 'top' as const, fontSize: '0.78rem' },
  loadingState: { padding: '24px 18px', textAlign: 'center' as const, color: theme.textMuted, fontSize: '0.92rem' },
  muted: { color: theme.textMuted, fontSize: '0.86rem', lineHeight: 1.5 },
});

const getTypeLabel = (type: Exclude<TransactionType, 'all'>) => {
  if (type === 'deposit') return 'Deposit';
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'transfer') return 'Transfer';
  if (type === 'trade') return 'Trade';
  return 'Reward';
};

const getStatusStyle = (theme: typeof HYBRID_THEME_TOKENS.dark, status: Exclude<TransactionStatus, 'all'>) => {
  if (status === 'completed') return { background: theme.primarySoft, color: theme.success, border: `1px solid ${theme.success}` };
  if (status === 'pending') return { background: theme.primarySoft, color: theme.warning, border: `1px solid ${theme.warning}` };
  return { background: theme.primarySoft, color: theme.danger, border: `1px solid ${theme.danger}` };
};

const TransactionHistoryPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const styles = getStyles(theme);

  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [directionFilter, setDirectionFilter] = useState<TransactionDirection>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
  const [query, setQuery] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isDirectionMenuOpen, setIsDirectionMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionHistoryPage, setTransactionHistoryPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ tone: NotificationTone; title: string; message: string } | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setAlert(null);
      try {
        const { data } = await api.get<TransactionHistoryResponse>('/api/transactions/me');
        const normalizedTransactions = Array.isArray(data?.transactions)
          ? data.transactions
              .filter((transaction) => Boolean(transaction?.id && transaction.type && transaction.direction && transaction.status && transaction.title && transaction.amount && transaction.currency && transaction.date && transaction.time && transaction.reference && typeof transaction.amountValue === 'number'))
              .map((transaction) => ({
                ...(transaction as TransactionRecord),
                ...(transaction.timestamp ? (() => {
                  const localDate = new Date(transaction.timestamp);
                  return Number.isNaN(localDate.getTime()) ? {} : {
                    date: localDate.toLocaleDateString(),
                    time: localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  };
                })() : {}),
                counterpart: transaction.counterpart || undefined,
              }))
          : [];
        setTransactions(normalizedTransactions);
        setTransactionHistoryPage(1);
        if (!Array.isArray(data?.transactions)) setAlert({ tone: 'info', title: 'No transaction records', message: 'The backend returned no transaction records.' });
      } catch {
        setTransactions([]);
        setAlert({ tone: 'error', title: 'Unable to load transactions', message: 'Unable to load transaction history from the backend.' });
      } finally {
        setLoading(false);
      }
    };
    void loadTransactions();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!(document.getElementById('transaction-type-menu')?.contains(target) ?? false)) setIsTypeMenuOpen(false);
      if (!(document.getElementById('transaction-direction-menu')?.contains(target) ?? false)) setIsDirectionMenuOpen(false);
      if (!(document.getElementById('transaction-status-menu')?.contains(target) ?? false)) setIsStatusMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesDirection = directionFilter === 'all' || transaction.direction === directionFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const haystack = `${transaction.title} ${transaction.reference} ${transaction.counterpart ?? ''}`.toLowerCase();
    const matchesQuery = query.trim().length === 0 || haystack.includes(query.toLowerCase());
    const amountValue = Number.isFinite(transaction.amountValue) ? Math.abs(transaction.amountValue) : Number(transaction.amount.replace(/[^0-9.-]/g, ''));
    const minValue = amountMin ? Number(amountMin) : Number.NEGATIVE_INFINITY;
    const maxValue = amountMax ? Number(amountMax) : Number.POSITIVE_INFINITY;
    const matchesAmount = amountValue >= minValue && amountValue <= maxValue;
    return matchesType && matchesDirection && matchesStatus && matchesAmount && matchesQuery;
  }), [amountMax, amountMin, directionFilter, query, statusFilter, transactions, typeFilter]);

  const totalCount = transactions.length;
  const filteredCount = filteredTransactions.length;
  const completedCount = filteredTransactions.filter((transaction) => transaction.status === 'completed').length;
  const transactionHistoryPageSize = 15;
  const transactionHistoryTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / transactionHistoryPageSize));
  const transactionHistoryCurrentPage = Math.min(transactionHistoryPage, transactionHistoryTotalPages);
  const transactionHistoryStartIndex = (transactionHistoryCurrentPage - 1) * transactionHistoryPageSize;
  const transactionHistoryRows = filteredTransactions.slice(transactionHistoryStartIndex, transactionHistoryStartIndex + transactionHistoryPageSize);
  const transactionHistoryPageItems = useMemo(() => {
    if (transactionHistoryTotalPages <= 7) return Array.from({ length: transactionHistoryTotalPages }, (_, index) => index + 1);
    const visiblePages = new Set<number>([1, transactionHistoryTotalPages, transactionHistoryCurrentPage]);
    if (transactionHistoryCurrentPage > 1) visiblePages.add(transactionHistoryCurrentPage - 1);
    if (transactionHistoryCurrentPage < transactionHistoryTotalPages) visiblePages.add(transactionHistoryCurrentPage + 1);
    if (transactionHistoryCurrentPage <= 3) { visiblePages.add(2); visiblePages.add(3); }
    if (transactionHistoryCurrentPage >= transactionHistoryTotalPages - 2) { visiblePages.add(transactionHistoryTotalPages - 1); visiblePages.add(transactionHistoryTotalPages - 2); }
    return Array.from(visiblePages).filter((page) => page >= 1 && page <= transactionHistoryTotalPages).sort((left, right) => left - right).flatMap((page, index, pages) => {
      const nextPage = pages[index + 1];
      return nextPage && nextPage - page > 1 ? [page, 'ellipsis' as const, nextPage] : [page];
    }).filter((item, index, items) => item !== 'ellipsis' || items[index - 1] !== 'ellipsis');
  }, [transactionHistoryCurrentPage, transactionHistoryTotalPages]);

  const clearFilters = () => {
    setTypeFilter('all');
    setDirectionFilter('all');
    setStatusFilter('all');
    setQuery('');
    setAmountMin('');
    setAmountMax('');
    setTransactionHistoryPage(1);
  };

  const filterSummary = [
    typeFilter !== 'all' ? getTypeLabel(typeFilter) : null,
    directionFilter !== 'all' ? (directionFilter === 'inbound' ? 'Inbound' : 'Outbound') : null,
    statusFilter !== 'all' ? statusFilter : null,
    query.trim() ? `Search: ${query.trim()}` : null,
    amountMin ? `Min: ${amountMin}` : null,
    amountMax ? `Max: ${amountMax}` : null,
  ].filter(Boolean).join(' • ');

  return (
    <HybridTheme mode={themeMode}>
      <style>{`@media (max-width: 640px) {
        .transaction-history-filters { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
        .transaction-history-filters > div { min-width: 0; }
        .transaction-history-filters input, .transaction-history-filters button { min-width: 0; font-size: 0.78rem; padding-left: 9px; padding-right: 9px; }
        .transaction-history-filters input { padding-left: 32px; }
        .transaction-history-filters span { font-size: 0.68rem; letter-spacing: 0.04em; }
      }`}</style>
      <div data-shadow-free-page="transaction-history" style={styles.page}>
        <Helmet><title>Transaction History | CryBots</title></Helmet>
        <div style={styles.shell}>
          <div style={styles.content}>
            <button type="button" style={styles.back} onClick={() => navigate('/logs')}><ArrowLeft size={17} /> Logs</button>
            <div style={styles.rowList}>
              <section style={{ ...styles.card, position: 'relative', zIndex: 3, overflow: 'visible' }}>
                <button type="button" style={{ ...styles.selectTrigger, border: 'none', padding: 0, background: 'transparent', borderRadius: 0 }} onClick={() => setFiltersOpen((current) => !current)}>
                  <span style={styles.cardTitle}><Filter size={18} /> Filters</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: theme.textMuted, fontSize: '0.82rem', fontWeight: 700 }}>
                    {filterSummary || 'All transactions'}
                    <ChevronDown size={17} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </span>
                </button>
                {filtersOpen ? (
                  <div className="transaction-history-filters" style={{ ...styles.filters, marginTop: 0 }}>
                    <div style={styles.field as React.CSSProperties}>
                      <span style={styles.label}>Search</span>
                      <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                        <input style={{ ...styles.input, paddingLeft: '42px' }} value={query} onChange={(event) => { setQuery(event.target.value); setTransactionHistoryPage(1); }} placeholder="Search reference, title, or user" />
                      </div>
                    </div>
                    <div id="transaction-type-menu" style={{ ...(styles.field as React.CSSProperties), position: 'relative' }}>
                      <span style={styles.label}>Type</span>
                      <button type="button" style={styles.selectTrigger} onClick={() => setIsTypeMenuOpen((current) => !current)}>
                        <span>{typeFilter === 'all' ? 'All types' : getTypeLabel(typeFilter)}</span><ChevronDown size={16} style={{ transform: isTypeMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>
                      {isTypeMenuOpen ? <div style={styles.selectMenu}>{(['all', 'deposit', 'withdrawal', 'transfer', 'trade', 'reward'] as const).map((option) => (
                        <button key={option} type="button" style={styles.selectOption} onClick={() => { setTypeFilter(option); setIsTypeMenuOpen(false); setTransactionHistoryPage(1); }}>
                          {option === 'all' ? 'All types' : getTypeLabel(option)}
                        </button>
                      ))}</div> : null}
                    </div>
                    <div id="transaction-direction-menu" style={{ ...(styles.field as React.CSSProperties), position: 'relative' }}>
                      <span style={styles.label}>Direction</span>
                      <button type="button" style={styles.selectTrigger} onClick={() => setIsDirectionMenuOpen((current) => !current)}>
                        <span>{directionFilter === 'all' ? 'All directions' : directionFilter === 'inbound' ? 'Inbound' : 'Outbound'}</span><ChevronDown size={16} style={{ transform: isDirectionMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>
                      {isDirectionMenuOpen ? <div style={styles.selectMenu}>{(['all', 'inbound', 'outbound'] as const).map((option) => (
                        <button key={option} type="button" style={styles.selectOption} onClick={() => { setDirectionFilter(option); setIsDirectionMenuOpen(false); setTransactionHistoryPage(1); }}>
                          {option === 'all' ? 'All directions' : option === 'inbound' ? 'Inbound' : 'Outbound'}
                        </button>
                      ))}</div> : null}
                    </div>
                    <div id="transaction-status-menu" style={{ ...(styles.field as React.CSSProperties), position: 'relative' }}>
                      <span style={styles.label}>Status</span>
                      <button type="button" style={styles.selectTrigger} onClick={() => setIsStatusMenuOpen((current) => !current)}>
                        <span>{statusFilter === 'all' ? 'All statuses' : statusFilter === 'completed' ? 'Completed' : statusFilter === 'pending' ? 'Pending' : statusFilter === 'cancelled' ? 'Cancelled' : 'Failed'}</span><ChevronDown size={16} style={{ transform: isStatusMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>
                      {isStatusMenuOpen ? <div style={styles.selectMenu}>{(['all', 'completed', 'pending', 'cancelled', 'failed'] as const).map((option) => (
                        <button key={option} type="button" style={styles.selectOption} onClick={() => { setStatusFilter(option); setIsStatusMenuOpen(false); setTransactionHistoryPage(1); }}>
                          {option === 'all' ? 'All statuses' : option === 'completed' ? 'Completed' : option === 'pending' ? 'Pending' : option === 'cancelled' ? 'Cancelled' : 'Failed'}
                        </button>
                      ))}</div> : null}
                    </div>
                    <div style={styles.field as React.CSSProperties}><span style={styles.label}>Min amount</span><input style={styles.input} value={amountMin} onChange={(event) => { setAmountMin(event.target.value); setTransactionHistoryPage(1); }} placeholder="0.00" inputMode="decimal" /></div>
                    <div style={styles.field as React.CSSProperties}><span style={styles.label}>Max amount</span><input style={styles.input} value={amountMax} onChange={(event) => { setAmountMax(event.target.value); setTransactionHistoryPage(1); }} placeholder="9999.99" inputMode="decimal" /></div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" style={{ ...styles.selectOption, width: 'fit-content' }} onClick={clearFilters}>Clear filters</button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section style={{ ...styles.card, position: 'relative', zIndex: 1 }}>
                <button type="button" style={{ ...styles.selectTrigger, border: 'none', padding: 0, background: 'transparent', borderRadius: 0 }} onClick={() => setOverviewOpen((current) => !current)}>
                  <span style={styles.cardTitle}><ListFilter size={18} /> Overview</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: theme.textMuted, fontSize: '0.82rem', fontWeight: 700 }}>
                    {loading ? <LoadingDots /> : `${filteredCount} of ${totalCount}`}
                    <ChevronDown size={17} style={{ transform: overviewOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </span>
                </button>
                {overviewOpen ? (
                  <div style={styles.overviewList}>
                    <div style={styles.overviewItem}><div style={styles.overviewLabelWrap}><p style={styles.overviewLabel}>Total entries</p></div><p style={styles.overviewValue}>{loading ? <LoadingDots /> : totalCount}</p></div>
                    <div style={styles.overviewItem}><div style={styles.overviewLabelWrap}><p style={styles.overviewLabel}>Filtered results</p><p style={styles.cardText}>{loading ? <LoadingDots /> : `Showing ${filteredCount === 0 ? 0 : transactionHistoryStartIndex + 1}-${Math.min(transactionHistoryStartIndex + transactionHistoryPageSize, filteredCount)} of ${filteredCount}`}</p></div><p style={styles.overviewValue}>{loading ? <LoadingDots /> : filteredCount}</p></div>
                    <div style={styles.overviewItem}><div style={styles.overviewLabelWrap}><p style={styles.overviewLabel}>Completed</p><p style={styles.cardText}>Completed in the current filter set</p></div><p style={styles.overviewValue}>{loading ? <LoadingDots /> : completedCount}</p></div>
                  </div>
                ) : null}
              </section>

              <section style={{ ...styles.card, gap: '16px' }}>
                {alert ? <NotificationBanner tone={alert.tone} title={alert.title} message={alert.message} /> : null}
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Transaction</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead>
                    <tbody>
                      {loading ? <tr><td style={styles.loadingState} colSpan={3}><LoadingDots /></td></tr> : transactionHistoryRows.length > 0 ? transactionHistoryRows.map((transaction, index) => {
                        const expanded = expandedTransactionId === transaction.id;
                        return (
                          <React.Fragment key={transaction.id}>
                            <tr style={{ background: index % 2 === 0 ? theme.surfaceShine : 'transparent' }}>
                              <td style={styles.td}><strong>{transaction.title}</strong></td>
                              <td style={styles.td}><span style={{ ...styles.pill, ...getStatusStyle(theme, transaction.status) }}>{transaction.status}</span></td>
                              <td style={styles.td}>
                                <button type="button" style={{ ...styles.selectOption, display: 'inline-flex', alignItems: 'center', gap: '7px', width: 'fit-content' }} onClick={() => setExpandedTransactionId(expanded ? null : transaction.id)}>
                                  <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} /> {expanded ? 'Hide' : 'View'}
                                </button>
                              </td>
                            </tr>
                            {expanded ? (
                              <tr>
                                <td colSpan={3} style={{ ...styles.td, background: theme.surfaceGlass }}>
                                  <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                                    <div><span style={styles.label}>Amount</span><p style={styles.cardText}>{transaction.amount}</p></div>
                                    <div><span style={styles.label}>Type</span><p style={styles.cardText}>{getTypeLabel(transaction.type)}</p></div>
                                    <div><span style={styles.label}>Direction</span><p style={styles.cardText}>{transaction.direction === 'inbound' ? 'Inbound' : 'Outbound'}</p></div>
                                    <div><span style={styles.label}>Currency</span><p style={styles.cardText}>{transaction.currency}</p></div>
                                    <div><span style={styles.label}>Counterpart</span><p style={styles.cardText}>{transaction.counterpart || '—'}</p></div>
                                    <div><span style={styles.label}>Reference</span><p style={{ ...styles.cardText, wordBreak: 'break-all' }}>{transaction.reference}</p></div>
                                    <div><span style={styles.label}>Date & time</span><p style={styles.cardText}>{transaction.date} {transaction.time}</p></div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                      <button type="button" style={{ ...styles.selectOption, display: 'inline-flex', alignItems: 'center', gap: '7px', width: 'fit-content' }} onClick={() => {
                                        void (async () => {
                                          try {
                                            if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(transaction.reference);
                                            else {
                                              const textArea = document.createElement('textarea');
                                              textArea.value = transaction.reference;
                                              textArea.style.position = 'fixed';
                                              textArea.style.opacity = '0';
                                              document.body.appendChild(textArea);
                                              textArea.select();
                                              document.execCommand('copy');
                                              document.body.removeChild(textArea);
                                            }
                                            setAlert({ tone: 'success', title: 'Reference copied', message: 'The transaction reference has been copied to your clipboard.' });
                                          } catch {
                                            setAlert({ tone: 'error', title: 'Copy failed', message: 'The transaction reference could not be copied. Please try again.' });
                                          }
                                        })();
                                      }}><Copy size={16} /> Copy reference</button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                      }) : <tr><td style={styles.td} colSpan={3}><div style={{ padding: '18px 0', textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 800 }}>No transactions found</p><p style={{ margin: '8px 0 0', color: theme.textMuted, fontSize: '0.92rem' }}>Try changing your search, type, or status filters.</p></div></td></tr>}
                    </tbody>
                  </table>
                </div>
                {filteredTransactions.length > transactionHistoryPageSize ? (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                      <p style={styles.cardText}>Showing {transactionHistoryStartIndex + 1}-{Math.min(transactionHistoryStartIndex + transactionHistoryPageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <button type="button" style={styles.selectOption as React.CSSProperties} onClick={() => setTransactionHistoryPage((current) => Math.max(1, current - 1))} disabled={transactionHistoryCurrentPage === 1}>Prev</button>
                        {transactionHistoryPageItems.map((item, index) => item === 'ellipsis' ? <span key={`transaction-ellipsis-${index}`} style={styles.muted}>…</span> : <button key={item} type="button" style={{ ...styles.selectOption, minWidth: '42px', ...(item === transactionHistoryCurrentPage ? { borderColor: theme.primary, background: theme.primarySoft } : {}) }} onClick={() => { setTransactionHistoryPage(item); setExpandedTransactionId(null); }}>{item}</button>)}
                        <button type="button" style={styles.selectOption as React.CSSProperties} onClick={() => { setTransactionHistoryPage((current) => Math.min(transactionHistoryTotalPages, current + 1)); setExpandedTransactionId(null); }} disabled={transactionHistoryCurrentPage === transactionHistoryTotalPages}>Next</button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
          <NowBar />
        </div>
      </div>
    </HybridTheme>
  );
};

export default TransactionHistoryPage;
