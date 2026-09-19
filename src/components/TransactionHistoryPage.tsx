import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, ChevronDown, Filter, History, ListFilter, Search, ShieldCheck } from 'lucide-react';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

type TransactionType = 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'staking' | 'trade' | 'reward';
type TransactionDirection = 'all' | 'inbound' | 'outbound';
type TransactionStatus = 'all' | 'completed' | 'pending' | 'failed';

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
  counterpart?: string;
  reference: string;
};

type TransactionHistoryResponse = {
  transactions?: Array<Partial<TransactionRecord> & { type?: TransactionRecord['type']; direction?: TransactionRecord['direction']; status?: TransactionRecord['status'] }>;
};


const getStyles = (theme: typeof HYBRID_THEME_TOKENS.dark) => ({ 
  page: {
    minHeight: '100vh',
    background: theme.background,
    color: theme.text,
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(14px, 3vw, 28px) clamp(8px, 1.5vw, 16px) 40px',
    boxSizing: 'border-box' as const,
  },
  panel: {
    display: 'grid',
    gap: '16px',
    width: '100%',
  },
  body: {
    padding: 'clamp(0px, 2vw, 30px) 0 0',
    display: 'grid',
    gap: '16px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'grid',
    gap: '10px',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.35rem, 2.8vw, 2rem)',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  subtitle: {
    margin: 0,
    color: theme.textMuted,
    lineHeight: 1.6,
    fontSize: '0.94rem',
    maxWidth: '72ch',
  },
  topGrid: {
    display: 'grid',
    gap: '18px',
    gridTemplateColumns: '1fr',
  },
  card: {
    display: 'grid',
    width: '100%',
    boxSizing: 'border-box' as const,
    gap: '20px',
    padding: 'clamp(18px, 4vw, 28px)',
    borderRadius: '28px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  cardText: {
    margin: '10px 0 0',
    color: theme.textMuted,
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
  filters: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    marginTop: '14px',
  },
  field: { display: 'grid', gap: '8px' },
  label: { fontSize: '0.82rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text, padding: '13px 14px', outline: 'none', fontSize: '0.92rem' },
  select: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text, padding: '13px 14px', outline: 'none', fontSize: '0.92rem' },
  selectTrigger: { border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.text, borderRadius: '14px', padding: '11px 12px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' },
  selectMenu: { display: 'grid', gap: '6px', padding: '8px', borderRadius: '16px', background: theme.surfaceElevated, border: `1px solid ${theme.border}`, transformOrigin: 'top', animation: 'pickerDropIn 160ms ease-out' },
  selectOption: { border: `1px solid ${theme.border}`, background: theme.surfaceGlass, color: theme.text, borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'left' as const, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' },
  tableWrap: {
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    width: '100%',
    boxSizing: 'border-box' as const,
    borderRadius: '28px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceGlass,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: '820px',
  },
  th: {
    textAlign: 'left' as const,
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: theme.textMuted,
    padding: '16px 18px',
    borderBottom: `1px solid ${theme.border}`,
    background: theme.surfaceMuted,
  },
  td: {
    padding: '16px 18px',
    borderBottom: `1px solid ${theme.border}`,
    verticalAlign: 'top' as const,
    fontSize: '0.92rem',
  },
  meta: {
    display: 'grid',
    gap: '4px',
  },
  muted: {
    color: theme.textMuted,
    fontSize: '0.86rem',
    lineHeight: 1.5,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 800,
    whiteSpace: 'nowrap' as const,
  },
  statsGrid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  },
  stat: {
    borderRadius: '16px',
    background: theme.surfaceMuted,
    border: `1px solid ${theme.border}`,
    padding: '14px',
  },
  statLabel: {
    margin: 0,
    color: theme.textMuted,
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  statValue: {
    margin: '8px 0 0',
    fontSize: '1.15rem',
    fontWeight: 900,
  },
  message: {
    padding: '14px 16px',
    borderRadius: '16px',
    border: `1px solid ${theme.warning}`,
    background: theme.primarySoft,
    color: theme.warning,
    fontSize: '0.92rem',
    lineHeight: 1.5,
  },
  loadingState: {
    padding: '24px 18px',
    textAlign: 'center' as const,
    color: theme.textMuted,
    fontSize: '0.92rem',
  },
});

const getTypeLabel = (type: Exclude<TransactionType, 'all'>) => {
  if (type === 'deposit') return 'Deposit';
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'transfer') return 'Transfer';
  if (type === 'staking') return 'Staking';
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
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionHistoryPage, setTransactionHistoryPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get<TransactionHistoryResponse>('/api/transactions/me');
        const normalizedTransactions = Array.isArray(data?.transactions)
          ? data.transactions
              .filter((transaction): transaction is TransactionRecord => Boolean(transaction?.id && transaction.type && transaction.direction && transaction.status && transaction.title && transaction.amount && transaction.currency && transaction.date && transaction.time && transaction.reference && typeof transaction.amountValue === 'number'))
              .map((transaction) => ({
                ...transaction,
                counterpart: transaction.counterpart || undefined,
              }))
          : [];

        setTransactions(normalizedTransactions);
        setTransactionHistoryPage(1);
        if (!Array.isArray(data?.transactions)) {
          setError('The backend returned no transaction records.');
        }
      } catch {
        setTransactions([]);
        setError('Unable to load transaction history from the backend.');
      } finally {
        setLoading(false);
      }
    };

    void loadTransactions();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTypeMenu = document.getElementById('transaction-type-menu')?.contains(target) ?? false;
      const insideDirectionMenu = document.getElementById('transaction-direction-menu')?.contains(target) ?? false;
      const insideStatusMenu = document.getElementById('transaction-status-menu')?.contains(target) ?? false;

      if (!insideTypeMenu) setIsTypeMenuOpen(false);
      if (!insideDirectionMenu) setIsDirectionMenuOpen(false);
      if (!insideStatusMenu) setIsStatusMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
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
    });
  }, [amountMax, amountMin, directionFilter, query, statusFilter, transactions, typeFilter]);

  const totalCount = transactions.length;
  const filteredCount = filteredTransactions.length;
  const completedCount = filteredTransactions.filter((transaction) => transaction.status === 'completed').length;
  const transactionHistoryPageSize = 15;
  const transactionHistoryTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / transactionHistoryPageSize));
  const transactionHistoryCurrentPage = Math.min(transactionHistoryPage, transactionHistoryTotalPages);
  const transactionHistoryStartIndex = (transactionHistoryCurrentPage - 1) * transactionHistoryPageSize;
  const transactionHistoryRows = filteredTransactions.slice(transactionHistoryStartIndex, transactionHistoryStartIndex + transactionHistoryPageSize);
  const transactionHistoryPageItems = useMemo(() => {
    if (transactionHistoryTotalPages <= 7) {
      return Array.from({ length: transactionHistoryTotalPages }, (_, index) => index + 1);
    }

    const visiblePages = new Set<number>([1, transactionHistoryTotalPages, transactionHistoryCurrentPage]);
    if (transactionHistoryCurrentPage > 1) visiblePages.add(transactionHistoryCurrentPage - 1);
    if (transactionHistoryCurrentPage < transactionHistoryTotalPages) visiblePages.add(transactionHistoryCurrentPage + 1);
    if (transactionHistoryCurrentPage <= 3) {
      visiblePages.add(2);
      visiblePages.add(3);
    }
    if (transactionHistoryCurrentPage >= transactionHistoryTotalPages - 2) {
      visiblePages.add(transactionHistoryTotalPages - 1);
      visiblePages.add(transactionHistoryTotalPages - 2);
    }

    return Array.from(visiblePages)
      .filter((page) => page >= 1 && page <= transactionHistoryTotalPages)
      .sort((left, right) => left - right)
      .flatMap((page, index, pages) => {
        const nextPage = pages[index + 1];
        if (nextPage && nextPage - page > 1) {
          return [page, 'ellipsis' as const, nextPage];
        }
        return [page];
      })
      .filter((item, index, items) => item !== 'ellipsis' || items[index - 1] !== 'ellipsis');
  }, [transactionHistoryCurrentPage, transactionHistoryTotalPages]);

  return (
    <HybridTheme mode={themeMode}>
      <div data-shadow-free-page="transaction-history" style={styles.page}>
      <Helmet><title>Transaction History | KingsHall Exchange</title></Helmet>
      <div style={styles.shell}>
        
        <div style={styles.panel}>
          <div style={styles.body}>
            <section style={styles.topGrid}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}><Filter size={18} /> Filters</h2>
                <p style={styles.cardText}>Use the filters below to narrow your activity log.</p>
                <div style={styles.filters}>
                  <div style={styles.field as React.CSSProperties}>
                    <span style={styles.label}>Search</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                      <input style={{ ...styles.input, paddingLeft: '42px' }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, title, or user" />
                    </div>
                  </div>
                  <div id="transaction-type-menu" style={{ ...(styles.field as React.CSSProperties), position: 'relative' }}>
                    <span style={styles.label}>Type</span>
                    <button type="button" style={styles.selectTrigger} onClick={() => setIsTypeMenuOpen((current) => !current)}>
                      <span>{typeFilter === 'all' ? 'All types' : getTypeLabel(typeFilter)}</span>
                      <span style={{ transform: isTypeMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
                    </button>
                    {isTypeMenuOpen ? (
                      <div style={styles.selectMenu}>
                        {(['all', 'deposit', 'withdrawal', 'transfer', 'staking', 'trade', 'reward'] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            style={styles.selectOption}
                            onClick={() => {
                              setTypeFilter(option);
                              setIsTypeMenuOpen(false);
                            }}
                          >
                            {option === 'all' ? 'All types' : getTypeLabel(option)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div id="transaction-direction-menu" style={{ ...(styles.field as React.CSSProperties), position: 'relative' }}>
                    <span style={styles.label}>Direction</span>
                    <button type="button" style={styles.selectTrigger} onClick={() => setIsDirectionMenuOpen((current) => !current)}>
                      <span>{directionFilter === 'all' ? 'All directions' : directionFilter === 'inbound' ? 'Inbound' : 'Outbound'}</span>
                      <span style={{ transform: isDirectionMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
                    </button>
                    {isDirectionMenuOpen ? (
                      <div style={styles.selectMenu}>
                        {(['all', 'inbound', 'outbound'] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            style={styles.selectOption}
                            onClick={() => {
                              setDirectionFilter(option);
                              setIsDirectionMenuOpen(false);
                            }}
                          >
                            {option === 'all' ? 'All directions' : option === 'inbound' ? 'Inbound' : 'Outbound'}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div id="transaction-status-menu" style={{ ...(styles.field as React.CSSProperties), position: 'relative' }}>
                    <span style={styles.label}>Status</span>
                    <button type="button" style={styles.selectTrigger} onClick={() => setIsStatusMenuOpen((current) => !current)}>
                      <span>{statusFilter === 'all' ? 'All statuses' : statusFilter === 'completed' ? 'Completed' : statusFilter === 'pending' ? 'Pending' : 'Failed'}</span>
                      <span style={{ transform: isStatusMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▾</span>
                    </button>
                    {isStatusMenuOpen ? (
                      <div style={styles.selectMenu}>
                        {(['all', 'completed', 'pending', 'failed'] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            style={styles.selectOption}
                            onClick={() => {
                              setStatusFilter(option);
                              setIsStatusMenuOpen(false);
                            }}
                          >
                            {option === 'all' ? 'All statuses' : option === 'completed' ? 'Completed' : option === 'pending' ? 'Pending' : 'Failed'}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div style={styles.field as React.CSSProperties}>
                    <span style={styles.label}>Min amount</span>
                    <input style={styles.input} value={amountMin} onChange={(event) => setAmountMin(event.target.value)} placeholder="0.00" inputMode="decimal" />
                  </div>
                  <div style={styles.field as React.CSSProperties}>
                    <span style={styles.label}>Max amount</span>
                    <input style={styles.input} value={amountMax} onChange={(event) => setAmountMax(event.target.value)} placeholder="9999.99" inputMode="decimal" />
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <h2 style={styles.cardTitle}><ListFilter size={18} /> Overview</h2>
                <div style={styles.statsGrid}>
                  <div style={styles.stat}>
                    <p style={styles.statLabel}>Total entries</p>
                    <p style={styles.statValue}>{loading ? <LoadingDots /> : totalCount}</p>
                  </div>
                  <div style={styles.stat}>
                    <p style={styles.statLabel}>Filtered results</p>
                    <p style={styles.statValue}>{loading ? <LoadingDots /> : filteredCount}</p>
                    <p style={styles.cardText}>{loading ? <LoadingDots /> : `Showing ${filteredCount === 0 ? 0 : transactionHistoryStartIndex + 1}-${Math.min(transactionHistoryStartIndex + transactionHistoryPageSize, filteredCount)} of ${filteredCount}`}</p>
                  </div>
                  <div style={styles.stat}>
                    <p style={styles.statLabel}>Completed</p>
                    <p style={styles.statValue}>{loading ? <LoadingDots /> : completedCount}</p>
                    <p style={styles.cardText}>Completed in the current filter set</p>
                  </div>
                </div>
                <p style={styles.cardText}><ShieldCheck size={16} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'text-bottom' }} />All entries show type, status, date, time, and reference so you can audit account activity easily on mobile or desktop.</p>
              </div>
            </section>

            {error ? <div style={styles.message}>{error}</div> : null}

            <section style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Transaction</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td style={styles.loadingState} colSpan={6}><LoadingDots /></td>
                    </tr>
                  ) : transactionHistoryRows.length > 0 ? transactionHistoryRows.map((transaction, index) => (
                    <tr key={transaction.id} style={{ background: index % 2 === 0 ? theme.surfaceShine : 'transparent' }}>
                      <td style={styles.td}>
                        <div style={styles.meta}>
                          <strong>{transaction.title}</strong>
                        </div>
                      </td>
                      <td style={styles.td}><strong>{transaction.amount}</strong></td>
                      <td style={styles.td}><span style={{ ...styles.pill, ...getStatusStyle(theme, transaction.status) }}>{transaction.status}</span></td>
                      <td style={styles.td}>{transaction.date}</td>
                      <td style={styles.td}>{transaction.time}</td>
                      <td style={styles.td}>
                        <div style={styles.meta}>
                          <strong>{transaction.reference}</strong>
                          <span style={styles.muted}>{transaction.id}</span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td style={styles.td} colSpan={6}>
                        <div style={{ padding: '18px 0', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontWeight: 800 }}>No transactions found</p>
                          <p style={{ margin: '8px 0 0', color: theme.textMuted, fontSize: '0.92rem' }}>Try changing your search, type, or status filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {filteredTransactions.length > transactionHistoryPageSize ? (
              <div style={styles.card}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <p style={styles.cardText}>Showing {transactionHistoryStartIndex + 1}-{Math.min(transactionHistoryStartIndex + transactionHistoryPageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <button type="button" style={styles.selectOption as React.CSSProperties} onClick={() => setTransactionHistoryPage((current) => Math.max(1, current - 1))} disabled={transactionHistoryCurrentPage === 1}>Prev</button>
                    {transactionHistoryPageItems.map((item, index) =>
                      item === 'ellipsis' ? (
                        <span key={`transaction-ellipsis-${index}`} style={styles.muted}>…</span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          style={{
                            ...styles.selectOption,
                            minWidth: '42px',
                            ...(item === transactionHistoryCurrentPage ? { borderColor: theme.primary, background: theme.primarySoft } : {}),
                          }}
                          onClick={() => setTransactionHistoryPage(item)}
                        >
                          {item}
                        </button>
                      ),
                    )}
                    <button type="button" style={styles.selectOption as React.CSSProperties} onClick={() => setTransactionHistoryPage((current) => Math.min(transactionHistoryTotalPages, current + 1))} disabled={transactionHistoryCurrentPage === transactionHistoryTotalPages}>Next</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <NowBar />
      </div>
      </div>
    </HybridTheme>
  );
};

export default TransactionHistoryPage;
