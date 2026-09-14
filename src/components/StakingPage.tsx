import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Lock } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import LoadingDots from './LoadingDots';
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
    background: 'radial-gradient(circle at top, rgba(37,99,235,0.14), transparent 34%), linear-gradient(180deg, #07111f 0%, #030712 100%)',
    color: '#e5eefc',
    padding: '20px 16px 112px',
  },
  shell: {
    width: 'min(980px, 100%)',
    margin: '0 auto',
    display: 'grid',
    gap: '16px',
  },
  hero: {
    display: 'grid',
    gap: '10px',
    padding: '20px',
    borderRadius: '24px',
    background: 'rgba(9, 14, 28, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    boxShadow: '0 18px 44px rgba(0,0,0,0.3)',
  },
  heroTitle: { margin: 0, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: 1.05 },
  heroText: { margin: 0, color: '#b7c5da', maxWidth: '58ch', lineHeight: 1.65 },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
  metricCard: { padding: '14px', borderRadius: '18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '6px' },
  metricLabel: { margin: 0, color: '#94a3b8', fontSize: '0.85rem' },
  metricValue: { margin: 0, fontSize: '1rem', fontWeight: 700 },
  packageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  packageCard: { padding: '18px', borderRadius: '22px', background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(148, 163, 184, 0.12)', display: 'grid', gap: '12px' },
  packageBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content', padding: '7px 10px', borderRadius: '999px', background: 'rgba(59,130,246,0.14)', color: '#bfdbfe', fontWeight: 700 },
  packageTitle: { margin: 0, fontSize: '1.2rem' },
  packageText: { margin: 0, color: '#cbd5e1', lineHeight: 1.55 },
  packageList: { margin: 0, paddingLeft: '18px', color: '#cbd5e1', display: 'grid', gap: '6px' },
  stakeSection: { display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  panel: { padding: '20px', borderRadius: '22px', background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(148, 163, 184, 0.12)' },
  form: { display: 'grid', gap: '12px' },
  field: { display: 'grid', gap: '8px' },
  label: { color: '#cbd5e1', fontSize: '0.92rem', fontWeight: 600 },
  input: { border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(2, 6, 23, 0.65)', color: '#fff', borderRadius: '14px', padding: '13px 14px', fontSize: '1rem' },
  select: { border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(2, 6, 23, 0.65)', color: '#fff', borderRadius: '14px', padding: '13px 14px', fontSize: '1rem' },
  button: { border: 'none', borderRadius: '14px', padding: '13px 16px', fontWeight: 700, color: '#04111f', background: 'linear-gradient(135deg, #7dd3fc, #a78bfa)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  stakesList: { display: 'grid', gap: '10px' },
  stakeCard: { padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '6px' },
  stakeRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const, alignItems: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content', padding: '6px 10px', borderRadius: '999px', background: 'rgba(34,197,94,0.14)', color: '#bbf7d0', fontWeight: 700, fontSize: '0.82rem' },
  helper: { color: '#94a3b8', margin: 0, fontSize: '0.9rem', lineHeight: 1.55 },
  error: { color: '#fca5a5', margin: 0 },
  success: { color: '#86efac', margin: 0 },
  '@media (max-width: 900px)': {
    stakeSection: { gridTemplateColumns: '1fr' },
  },
  '@media (max-width: 640px)': {
    page: { padding: '14px 12px 96px' },
    shell: { gap: '12px' },
    hero: { padding: '16px' },
    packageGrid: { gridTemplateColumns: '1fr' },
    panel: { padding: '16px' },
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

  const selectedPackage = useMemo(() => stakingPackages.find((stakingPackage) => stakingPackage.id === selectedPackageId) || stakingPackages[0], [selectedPackageId]);

  useEffect(() => {
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
    return () => { cancelled = true; };
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
      const { data } = await api.post<{ message?: string; stake?: Stake }>('/api/staking', { packageId: selectedPackage.id, amount: selectedAmount });
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
          <section style={styles.hero}>
            <span style={styles.packageBadge}><Lock size={16} /> Locked investment</span>
            <h1 style={styles.heroTitle}>Staking</h1>
            <p style={styles.heroText}>Pick a package, enter your amount, and lock it in.</p>
          </section>
          {packagesError ? <p style={styles.error}>{packagesError}</p> : null}
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
                <label style={styles.field}>
                  <span style={styles.label}>Package</span>
                  <select value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value as StakingPackage['id'])} style={styles.select}>
                    {stakingPackages.map((stakingPackage) => (
                      <option key={stakingPackage.id} value={stakingPackage.id}>
                        {stakingPackage.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span style={styles.label}>Amount (USDT)</span>
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} style={styles.input} inputMode="decimal" placeholder={`Min ${selectedPackage.minAmount} / Max ${selectedPackage.maxAmount}`} />
                </label>
                <p style={styles.helper}>{selectedPackage.lockDurationDays} day lock • {selectedPackage.dailyProfitPercent}% daily</p>
                {error ? <p style={styles.error}>{error}</p> : null}
                {message ? <p style={styles.success}>{message}</p> : null}
                <button type="submit" style={styles.button} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Stake now'} <ArrowRight size={16} /></button>
              </form>
            </div>
            <div style={styles.panel}>
              <h2 style={styles.packageTitle}>My stakes</h2>
              {isLoading ? <LoadingDots /> : null}
              {!isLoading && stakes.length === 0 ? <p style={styles.helper}>No stakes yet.</p> : null}
              <div style={styles.stakesList}>
                {stakes.map((stake) => (
                  <article key={stake.id} style={styles.stakeCard}>
                    <div style={styles.stakeRow}><strong>{stake.packageId}</strong><span style={styles.badge}>{stake.status}</span></div>
                    <p style={styles.helper}>{stake.principal} USDT • {stake.dailyProfitPercent}% daily • {stake.lockDurationDays} days</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
        <NowBar />
      </main>
    </>
  );
};

export default StakingPage;
