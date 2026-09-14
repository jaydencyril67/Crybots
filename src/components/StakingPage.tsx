import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { setCachedBalance } from '../utils/balance';
import AppHeader from './AppHeader';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';

type StakingPackage = {
  id: 'STK 01' | 'STK 02' | 'STK 03';
  minAmount: number;
  maxAmount: number;
  lockDurationDays: number;
  dailyProfitPercent: number;
};

type Stake = {
  id: string;
  packageId: StakingPackage['id'];
  principal: number;
  dailyProfitPercent: number;
  lockDurationDays: number;
  totalProfitTarget: number;
  earnedProfit: number;
  status: 'active' | 'completed' | 'cancelled';
  maturityDate: string;
  startedAt?: string;
  completedAt?: string;
};

const stakingPackages: StakingPackage[] = [
  { id: 'STK 01', minAmount: 1, maxAmount: 9, lockDurationDays: 10, dailyProfitPercent: 1.8 },
  { id: 'STK 02', minAmount: 10, maxAmount: 99, lockDurationDays: 15, dailyProfitPercent: 2 },
  { id: 'STK 03', minAmount: 100, maxAmount: 1000, lockDurationDays: 30, dailyProfitPercent: 2.2 },
];

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    overflowX: 'hidden' as const,
    overflowY: 'visible' as const,
    paddingBottom: '132px',
  },
  shell: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
    display: 'grid',
    gap: '18px',
  },

  heroText: { margin: 0, color: '#b7c5da', maxWidth: '58ch', lineHeight: 1.65 },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
  metricCard: { padding: '14px', borderRadius: '18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '6px' },
  metricLabel: { margin: 0, color: '#94a3b8', fontSize: '0.85rem' },
  metricValue: { margin: 0, fontSize: '1rem', fontWeight: 700 },
  packageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))',
    gap: '16px',
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    padding: '0 2px 6px',
    scrollPaddingLeft: '2px',
    scrollPaddingRight: '2px',
    scrollSnapType: 'x proximity' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  packageCard: {
    padding: '18px',
    borderRadius: '22px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: '12px',
    minWidth: 0,
    scrollSnapAlign: 'start',
    justifyItems: 'center',
    textAlign: 'center' as const,
  },
  packageBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content', padding: '7px 10px', borderRadius: '999px', background: 'rgba(59,130,246,0.14)', color: '#bfdbfe', fontWeight: 700, justifySelf: 'center' },
  packageTitle: { margin: 0, fontSize: '1.2rem' },
  packageText: { margin: 0, color: '#cbd5e1', lineHeight: 1.55, textAlign: 'center' as const },
  packageList: { margin: 0, paddingLeft: '18px', color: '#cbd5e1', display: 'grid', gap: '6px' },
  stakeSection: { display: 'grid', gap: '14px', gridTemplateColumns: '1fr' },
  panel: { padding: 'clamp(20px, 4vw, 30px)', borderRadius: '32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)' },
  form: { display: 'grid', gap: '12px', width: '100%' },
  field: { display: 'grid', gap: '8px', width: '100%' },
  label: { color: '#cbd5e1', fontSize: '0.92rem', fontWeight: 600 },
  input: { border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(2, 6, 23, 0.65)', color: '#fff', borderRadius: '14px', padding: '13px 14px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' as const },
  selectTrigger: { border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(2, 6, 23, 0.65)', color: '#fff', borderRadius: '14px', padding: '13px 14px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' },
  selectMenu: { display: 'grid', gap: '8px', padding: '10px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.92)', border: '1px solid rgba(148, 163, 184, 0.18)' },
  selectOption: { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', borderRadius: '12px', padding: '12px 14px', width: '100%', textAlign: 'left' as const, cursor: 'pointer' },
  button: { border: 'none', borderRadius: '999px', padding: '13px 16px', fontWeight: 700, color: '#04111f', background: 'linear-gradient(135deg, #7dd3fc, #a78bfa)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  stakesTableWrap: { overflowX: 'auto' as const, borderRadius: '22px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' },
  stakesTable: { width: '100%', minWidth: '760px', borderCollapse: 'collapse' as const },
  stakesHead: { background: 'rgba(255,255,255,0.05)' },
  stakeTh: { position: 'sticky' as const, top: 0, zIndex: 1, padding: '14px 16px', textAlign: 'left' as const, fontSize: '0.84rem', letterSpacing: '0.02em', textTransform: 'uppercase' as const, color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,24,0.96)' },
  stakeTd: { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0', verticalAlign: 'middle' as const },
  stakeRow: { display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content', padding: '6px 10px', borderRadius: '999px', background: 'rgba(34,197,94,0.14)', color: '#bbf7d0', fontWeight: 700, fontSize: '0.82rem' },
  statusActive: { background: 'rgba(34,197,94,0.14)', color: '#bbf7d0' },
  statusCompleted: { background: 'rgba(59,130,246,0.14)', color: '#dbeafe' },
  statusCancelled: { background: 'rgba(239,68,68,0.14)', color: '#fecaca' },
  stakesSection: { display: 'grid', gap: '14px' },
  stakesHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const },
  helper: { color: '#94a3b8', margin: 0, fontSize: '0.9rem', lineHeight: 1.55 },
  previewCard: { display: 'grid', gap: '6px', padding: '14px', borderRadius: '18px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)' },
  previewLabel: { margin: 0, color: '#bfdbfe', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' as const },
  previewValue: { margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 },
  previewSubtext: { margin: 0, color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.5 },
  error: { color: '#fca5a5', margin: 0 },
  success: { color: '#86efac', margin: 0 },
  '@media (max-width: 1100px)': {
    stakeSection: { width: '100%' },
    panel: { width: '100%' },
  },
  '@media (max-width: 640px)': {
    page: { paddingBottom: '180px' },
    shell: { maxWidth: '100%', padding: '16px 0 120px', gap: '12px' },
    hero: { padding: '18px' },
    packageGrid: {
      gridTemplateColumns: 'repeat(3, minmax(240px, 82vw))',
      gap: '20px',
      overflowX: 'auto' as const,
      overflowY: 'hidden' as const,
      padding: '0 4px 8px',
      scrollPaddingLeft: '4px',
      scrollPaddingRight: '4px',
      scrollSnapType: 'x mandatory' as const,
    },
    stakeSection: { width: '100%' },
    panel: { borderRadius: '0', padding: '18px 16px', width: '100%', minWidth: 0 },
    stakesTableWrap: { margin: '0 -16px' },
    stakesTable: { minWidth: '680px' },
    button: { width: '100%' },
  },
};

const StakingPage = () => {
  const [selectedPackageId, setSelectedPackageId] = useState<StakingPackage['id']>('STK 01');
  const [amount, setAmount] = useState('');
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [packagesError, setPackagesError] = useState('');

  const [isPackageMenuOpen, setIsPackageMenuOpen] = useState(false);
  const packageMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedPackage = useMemo(() => stakingPackages.find((stakingPackage) => stakingPackage.id === selectedPackageId) || stakingPackages[0], [selectedPackageId]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (packageMenuRef.current && !packageMenuRef.current.contains(event.target as Node)) {
        setIsPackageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    let cancelled = false;

    const load = async () => {
      try {
        const [packagesResponse, stakesResponse] = await Promise.all([
          api.get<{ packages?: StakingPackage[] }>('/api/staking/packages'),
          api.get<{ stakes?: Stake[] }>('/api/staking'),
        ]);

        if (!cancelled) {
          if (packagesResponse.data.packages?.length) {
            setPackagesError('');
          }
          setError('');
          setStakes(stakesResponse.data.stakes || []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load staking data.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const selectedAmount = Number(amount);
  const isAmountValid = Number.isFinite(selectedAmount) && selectedAmount >= selectedPackage.minAmount && selectedAmount <= selectedPackage.maxAmount;
  const projectedProfit = isAmountValid ? Number((selectedAmount * (selectedPackage.dailyProfitPercent / 100) * selectedPackage.lockDurationDays).toFixed(2)) : 0;

  const handleCreateStake = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isAmountValid) {
      setError(`Enter an amount between ${selectedPackage.minAmount} USDT and ${selectedPackage.maxAmount} USDT for ${selectedPackage.id}.`);
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const { data } = await api.post<{ message?: string; balance?: number; stake?: Stake }>('/api/staking', { packageId: selectedPackage.id, amount: selectedAmount });
      if (typeof data.balance === 'number') {
        setCachedBalance(data.balance);
      }
      if (data.stake) {
        const nextStake = data.stake;
        setStakes((current) => [nextStake, ...current]);
      }
      setMessage(data.message || 'Your stake has been created successfully.');
      setError('');
      setAmount('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create staking plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>KingsHall Exchange | Staking</title>
      </Helmet>
      <main style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
          {packagesError ? <NotificationBanner tone="error" title="Package load issue" message={packagesError} /> : null}
          <section style={styles.packageGrid}>
            {stakingPackages.map((stakingPackage) => (
              <article key={stakingPackage.id} style={styles.packageCard}>
                <span style={styles.packageBadge}>{stakingPackage.id}</span>
                <h2 style={styles.packageTitle}>{stakingPackage.dailyProfitPercent}% / day</h2>
                <p style={styles.packageText}>{stakingPackage.minAmount} - {stakingPackage.maxAmount.toLocaleString()} USDT</p>
                <p style={styles.packageText}>{stakingPackage.lockDurationDays} day lock</p>
              </article>
            ))}
          </section>
          <section style={styles.stakeSection}>
            <div style={styles.panel}>
              <h2 style={styles.packageTitle}>Create stake</h2>
              <form style={styles.form} onSubmit={handleCreateStake}>
                <div ref={packageMenuRef} style={styles.field}>
                  <span style={styles.label}>Package</span>
                  <button type="button" style={styles.selectTrigger} onClick={() => setIsPackageMenuOpen((current) => !current)}>
                    <span>{selectedPackage.id}</span>
                    <span>▾</span>
                  </button>
                  {isPackageMenuOpen ? (
                    <div style={styles.selectMenu}>
                      {stakingPackages.map((stakingPackage) => (
                        <button
                          key={stakingPackage.id}
                          type="button"
                          style={styles.selectOption}
                          onClick={() => {
                            setSelectedPackageId(stakingPackage.id);
                            setIsPackageMenuOpen(false);
                          }}
                        >
                          {stakingPackage.id}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <label style={styles.field}>
                  <span style={styles.label}>Amount (USDT)</span>
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} style={styles.input} inputMode="decimal" placeholder={`Min ${selectedPackage.minAmount} / Max ${selectedPackage.maxAmount}`} />
                </label>
                <p style={styles.helper}>{selectedPackage.lockDurationDays} day lock • {selectedPackage.dailyProfitPercent}% daily</p>
                <div style={styles.previewCard} aria-live="polite">
                  <p style={styles.previewLabel}>Estimated total at maturity</p>
                  <p style={styles.previewValue}>{isAmountValid ? `${(selectedAmount + projectedProfit).toLocaleString()} USDT` : '—'}</p>
                  <p style={styles.previewSubtext}>
                    {isAmountValid
                      ? `You’d earn ${projectedProfit.toLocaleString()} USDT in profit over ${selectedPackage.lockDurationDays} days.`
                      : `Enter an amount between ${selectedPackage.minAmount} and ${selectedPackage.maxAmount} USDT to preview your earnings.`}
                  </p>
                </div>
                {error ? <NotificationBanner tone="error" title="Check your details" message={error} /> : null}
                {message ? <NotificationBanner tone="success" title="Stake created" message={message} /> : null}
                <button type="submit" style={styles.button} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Stake now'} <ArrowRight size={16} /></button>
              </form>
            </div>
          </section>

          <section style={styles.stakesSection}>
            <div style={styles.stakesHeader}>
              <h2 style={styles.packageTitle}>Created stake packages</h2>
              <p style={styles.helper}>{stakes.length} active package{stakes.length === 1 ? '' : 's'}</p>
            </div>
            {isLoading ? (
              <div style={styles.panel}>
                <LoadingDots />
              </div>
            ) : stakes.length ? (
              <div style={styles.stakesTableWrap}>
                <table style={styles.stakesTable}>
                  <thead style={styles.stakesHead}>
                    <tr>
                      <th style={styles.stakeTh}>Package</th>
                      <th style={styles.stakeTh}>Amount</th>
                      <th style={styles.stakeTh}>Target profit</th>
                      <th style={styles.stakeTh}>Earned</th>
                      <th style={styles.stakeTh}>Started</th>
                      <th style={styles.stakeTh}>Matures</th>
                      <th style={styles.stakeTh}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakes.map((stake, index) => (
                      <tr key={stake.id} style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={styles.stakeTd}>
                          <span style={styles.stakeRow}>
                            <span style={styles.badge}>{stake.packageId}</span>
                          </span>
                        </td>
                        <td style={styles.stakeTd}>{stake.principal.toLocaleString()} USDT</td>
                        <td style={styles.stakeTd}>{stake.totalProfitTarget.toLocaleString()} USDT</td>
                        <td style={styles.stakeTd}>{stake.earnedProfit.toLocaleString()} USDT</td>
                        <td style={styles.stakeTd}>{stake.startedAt ? new Date(stake.startedAt).toLocaleDateString() : '—'}</td>
                        <td style={styles.stakeTd}>{new Date(stake.maturityDate).toLocaleDateString()}</td>
                        <td style={styles.stakeTd}>
                          <span
                            style={{
                              ...styles.badge,
                              ...(stake.status === 'active'
                                ? styles.statusActive
                                : stake.status === 'completed'
                                  ? styles.statusCompleted
                                  : styles.statusCancelled),
                            }}
                          >
                            {stake.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.panel}>
                <p style={styles.helper}>No stakes created yet.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default StakingPage;
