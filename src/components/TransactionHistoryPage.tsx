import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, ChevronDown, Filter, History, ListFilter, Search, ShieldCheck } from 'lucide-react';
import AppHeader from './AppHeader';
import NowBar from './NowBar';
import api from '../api/axios';

type TransactionType = 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'staking' | 'trade' | 'reward' | 'fee';
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
  description: string;
};

const sampleTransactions: TransactionRecord[] = [
  {
    id: 'txn_1001',
    type: 'transfer',
    direction: 'outbound',
    title: 'USDT transfer sent',
    amount: '-250.00 USDT',
    amountValue: -250,
    status: 'completed',
    date: '2026-09-16',
    time: '10:24:18',
    counterpart: 'user_kingshall',
    reference: 'TRF-9K4H-1001',
    description: 'Transfer sent to another user wallet.',
    currency: 'USDT',
  },
  {
    id: 'txn_1002',
    type: 'withdrawal',
    direction: 'outbound',
    title: 'USDT withdrawal submitted',
    amount: '-120.00 USDT',
    amountValue: -120,
    status: 'pending',
    date: '2026-09-15',
    time: '18:41:02',
    reference: 'WDR-2Q8M-1002',
    description: 'Withdrawal queued for processing.',
    currency: 'USDT',
  },
  {
    id: 'txn_1003',
    type: 'deposit',
    direction: 'inbound',
    title: 'Wallet deposit received',
    amount: '+500.00 USDT',
    amountValue: 500,
    status: 'completed',
    date: '2026-09-14',
    time: '09:15:45',
    reference: 'DPT-7L1A-1003',
    description: 'Deposit credited to your balance.',
    currency: 'USDT',
  },
  {
    id: 'txn_1004',
    type: 'staking',
    direction: 'inbound',
    title: 'Staking reward paid',
    amount: '+18.75 USDT',
    amountValue: 18.75,
    status: 'completed',
    date: '2026-09-14',
    time: '06:00:00',
    reference: 'STK-4N3P-1004',
    description: 'Daily staking reward payout.',
    currency: 'USDT',
  },
  {
    id: 'txn_1005',
    type: 'trade',
    direction: 'outbound',
    title: 'Market order executed',
    amount: '-80.00 USDT',
    amountValue: -80,
    status: 'failed',
    date: '2026-09-13',
    time: '21:08:19',
    reference: 'TRD-8A6C-1005',
    description: 'Trade could not be executed due to insufficient liquidity.',
    currency: 'USDT',
  },
  {
    id: 'txn_1006',
    type: 'fee',
    direction: 'outbound',
    title: 'Network fee charged',
    amount: '-1.20 USDT',
    amountValue: -1.2,
    status: 'completed',
    date: '2026-09-12',
    time: '15:52:10',
    reference: 'FEE-5T7K-1006',
    description: 'Blockchain network fee applied to a withdrawal.',
    currency: 'USDT',
  },
];

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#fff',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  panel: {
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(14,18,33,0.92), rgba(9,12,24,0.86))',
    boxShadow: '0 22px 80px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    overflow: 'hidden',
  },
  body: {
    padding: 'clamp(18px, 4vw, 30px)',
    display: 'grid',
    gap: '18px',
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
    color: '#9db0d1',
    lineHeight: 1.6,
    fontSize: '0.94rem',
    maxWidth: '72ch',
  },
  topGrid: {
    display: 'grid',
    gap: '18px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  },
  card: {
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '18px',
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
    color: '#9db0d1',
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
  label: { fontSize: '0.82rem', fontWeight: 700, color: '#d7e2f8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '13px 14px', outline: 'none', fontSize: '0.92rem' },
  select: { width: '100%', boxSizing: 'border-box' as const, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,12,24,0.92)', color: '#fff', padding: '13px 14px', outline: 'none', fontSize: '0.92rem' },
  tableWrap: {
    overflowX: 'auto' as const,
    borderRadius: '22px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
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
    color: '#b9c8e3',
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
  },
  td: {
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    verticalAlign: 'top' as const,
    fontSize: '0.92rem',
  },
  meta: {
    display: 'grid',
    gap: '4px',
  },
  muted: {
    color: '#9db0d1',
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
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '14px',
  },
  statLabel: {
    margin: 0,
    color: '#9db0d1',
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
    border: '1px solid rgba(250,204,21,0.22)',
    background: 'rgba(250,204,21,0.12)',
    color: '#fde68a',
    fontSize: '0.92rem',
    lineHeight: 1.5,
  },
  loadingState: {
    padding: '24px 18px',
    textAlign: 'center' as const,
    color: '#9db0d1',
    fontSize: '0.92rem',
  },
};

const getTypeLabel = (type: Exclude<TransactionType, 'all'>) => {
  if (type === 'deposit') return 'Deposit';
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'transfer') return 'Transfer';
  if (type === 'staking') return 'Staking';
  if (type === 'trade') return 'Trade';
  if (type === 'fee') return 'Fee';
  return 'Reward';
};

const getStatusStyle = (status: Exclude<TransactionStatus, 'all'>) => {
  if (status === 'completed') return { background: 'rgba(34,197,94,0.14)', color: '#86efac', border: '1px solid rgba(34,197,94,0.22)' };
  if (status === 'pending') return { background: 'rgba(250,204,21,0.14)', color: '#fde68a', border: '1px solid rgba(250,204,21,0.22)' };
  return { background: 'rgba(239,68,68,0.14)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.22)' };
};

const TransactionHistoryPage = () => {
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [directionFilter, setDirectionFilter] = useState<TransactionDirection>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
  const [query, setQuery] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [transactions, setTransactions] = useState<TransactionRecord[]>(sampleTransactions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get<{ transactions?: TransactionRecord[] }>('/api/transactions/me');
        if (Array.isArray(data?.transactions) && data.transactions.length > 0) {
          setTransactions(data.transactions);
        } else {
          setTransactions(sampleTransactions);
        }
      } catch {
        setTransactions(sampleTransactions);
        setError('Showing local transaction history preview because the backend transaction feed is unavailable.');
      } finally {
        setLoading(false);
      }
    };

    void loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesDirection = directionFilter === 'all' || transaction.direction === directionFilter;
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const haystack = `${transaction.title} ${transaction.reference} ${transaction.counterpart ?? ''} ${transaction.description}`.toLowerCase();
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
  const completedCount = transactions.filter((transaction) => transaction.status === 'completed').length;

  return (
    <div style={styles.page}>
      <Helmet><title>Transaction History | KingsHall Exchange</title></Helmet>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.panel}>
          <div style={styles.body}>
            <section style={styles.header}>
              <h1 style={styles.title}><History size={22} /> Transaction history</h1>
              <p style={styles.subtitle}>Review deposits, withdrawals, transfers, staking rewards, and trading activity in one place. Filter by type, status, or search to quickly find a specific transaction with its date, time, and reference details.</p>
            </section>

            <section style={styles.topGrid}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}><Filter size={18} /> Filters</h2>
                <p style={styles.cardText}>Use the filters below to narrow your activity log.</p>
                <div style={styles.filters}>
                  <div style={styles.field as React.CSSProperties}>
                    <span style={styles.label}>Search</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#7c8fb0' }} />
                      <input style={{ ...styles.input, paddingLeft: '42px' }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, title, or user" />
                    </div>
                  </div>
                  <div style={styles.field as React.CSSProperties}>
                    <span style={styles.label}>Type</span>
                    <select style={styles.select} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TransactionType)}>
                      <option value="all">All types</option>
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="transfer">Transfer</option>
                      <option value="staking">Staking</option>
                      <option value="trade">Trade</option>
                      <option value="reward">Reward</option>
                      <option value="fee">Fee</option>
                    </select>
                  </div>
                  <div style={styles.field as React.CSSProperties}>
                    <span style={styles.label}>Direction</span>
                    <select style={styles.select} value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value as TransactionDirection)}>
                      <option value="all">All directions</option>
                      <option value="inbound">Inbound</option>
                      <option value="outbound">Outbound</option>
                    </select>
                  </div>
                  <div style={styles.field as React.CSSProperties}>
                    <span style={styles.label}>Status</span>
                    <select style={styles.select} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TransactionStatus)}>
                      <option value="all">All statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
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
                    <p style={styles.statValue}>{totalCount}</p>
                  </div>
                  <div style={styles.stat}>
                    <p style={styles.statLabel}>Filtered results</p>
                    <p style={styles.statValue}>{filteredCount}</p>
                  </div>
                  <div style={styles.stat}>
                    <p style={styles.statLabel}>Completed</p>
                    <p style={styles.statValue}>{completedCount}</p>
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
                      <td style={styles.loadingState} colSpan={6}>Loading transaction history…</td>
                    </tr>
                  ) : filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td style={styles.td}>
                        <div style={styles.meta}>
                          <strong>{transaction.title}</strong>
                          <span style={styles.muted}>{getTypeLabel(transaction.type)} · {transaction.direction}</span>
                          <span style={styles.muted}>{transaction.counterpart ? `${transaction.counterpart} · ` : ''}{transaction.description}</span>
                        </div>
                      </td>
                      <td style={styles.td}><strong>{transaction.amount}</strong></td>
                      <td style={styles.td}><span style={{ ...styles.pill, ...getStatusStyle(transaction.status) }}>{transaction.status}</span></td>
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
                          <p style={{ margin: '8px 0 0', color: '#9db0d1', fontSize: '0.92rem' }}>Try changing your search, type, or status filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section style={styles.card}>
              <h2 style={styles.cardTitle}><CalendarDays size={18} /> Activity log note</h2>
              <p style={styles.cardText}>Each transaction record should be backed by server-side audit data in production, including timestamp, actor, transaction category, and processing status. The current page uses the same card, label, and spacing style patterns as the rest of the app and remains horizontally scrollable for small screens.</p>
            </section>
          </div>
        </div>
        <NowBar />
      </div>
    </div>
  );
};

export default TransactionHistoryPage;
