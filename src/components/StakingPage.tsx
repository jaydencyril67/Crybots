import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import api from '../api/axios';
import AppHeader from './AppHeader';
import LoadingDots from './LoadingDots';
import NowBar from './NowBar';

type StakingPackage = {
  id: 'STK 01' | 'STK 02' | 'STK 03';
  name: string;
  minAmount: number;
  maxAmount: number;
  lockDurationDays: number;
  dailyProfitPercent: number;
  description: string;
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
  startedAt: string;
  maturityDate: string;
  completedAt?: string;
};

const stakingPackages: StakingPackage[] = [
  { id: 'STK 01', name: 'STK 01', minAmount: 1, maxAmount: 9, lockDurationDays: 10, dailyProfitPercent: 1.8, description: 'Entry-level locked investment for smaller balances.' },
  { id: 'STK 02', name: 'STK 02', minAmount: 10, maxAmount: 99, lockDurationDays: 15, dailyProfitPercent: 2, description: 'Mid-tier package with a stronger fixed daily return.' },
  { id: 'STK 03', name: 'STK 03', minAmount: 100, maxAmount: 1000, lockDurationDays: 30, dailyProfitPercent: 2.2, description: 'Higher-capital package with the longest lock and highest fixed return.' },
];

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 36%), linear-gradient(180deg, #07111f 0%, #030712 100%)',
    color: '#e5eefc',
    padding: '24px 16px 112px',
  },
  shell: {
    width: 'min(1180px, 100%)',
    margin: '0 auto',
    display: 'grid',
    gap: '18px',
  },
  hero: {
    display: 'grid',
    gap: '10px',
    padding: '24px',
    borderRadius: '28px',
    background: 'rgba(9, 14, 28, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
  },
  heroTitle: { margin: 0, fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.05 },
  heroText: { margin: 0, color: '#b7c5da', maxWidth: '72ch', lineHeight: 1.7 },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' },
  metricCard: { padding: '16px', borderRadius: '22px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '8px' },
  metricLabel: { margin: 0, color: '#94a3b8', fontSize: '0.9rem' },
  metricValue: { margin: 0, fontSize: '1.1rem', fontWeight: 700 },
  packageGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' },
  packageCard: { padding: '22px', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(148, 163, 184, 0.16)', display: 'grid', gap: '14px' },
  packageBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content', padding: '8px 12px', borderRadius: '999px', background: 'rgba(59,130,246,0.14)', color: '#bfdbfe', fontWeight: 700 },
  packageTitle: { margin: 0, fontSize: '1.35rem' },
  packageText: { margin: 0, color: '#cbd5e1', lineHeight: 1.6 },
  packageList: { margin: 0, paddingLeft: '18px', color: '#cbd5e1', display: 'grid', gap: '8px' },
  stakeSection: { display: 'grid', gap: '16px', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' },
  panel: { padding: '22px', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(148, 163, 184, 0.16)' },
  form: { display: 'grid', gap: '14px' },
  field: { display: 'grid', gap: '8px' },
  label: { color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 600 },
  input: { border: '1px solid rgba(148, 163, 184, 0.22)', background: 'rgba(2, 6, 23, 0.65)', color: '#fff', borderRadius: '16px', padding: '14px 16px', fontSize: '1rem' },
  select: { border: '1px solid rgba(148, 163, 184, 0.22)', background: 'rgba(2, 6, 23, 0.65)', color: '#fff', borderRadius: '16px', padding: '14px 16px', fontSize: '1rem' },
  button: { border: 'none', borderRadius: '16px', padding: '14px 18px', fontWeight: 700, color: '#04111f', background: 'linear-gradient(135deg, #7dd3fc, #a78bfa)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  stakesList: { display: 'grid', gap: '12px' },
  stakeCard: { padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '8px' },
  stakeRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content', padding: '6px 10px', borderRadius: '999px', background: 'rgba(34,197,94,0.14)', color: '#bbf7d0', fontWeight: 700, fontSize: '0.85rem' },
  helper: { color: '#94a3b8', margin: 0, fontSize: '0.92rem', lineHeight: 1.6 },
  error: { color: '#fca5a5', margin: 0 },
  success: { color: '#86efac', margin: 0 },
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
      if (data.stake) setStakes((current) => [data.stake, ...current]);
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
            <h1 style={styles.heroTitle}>Staking packages</h1>
            <p style={styles.heroText}>Choose a fixed staking package, lock your USDT for the package duration, and earn the fixed daily profit rate until maturity.</p>
            <div style={styles.metricsRow}>
              <div style={styles.metricCard}><p style={styles.metricLabel}>Active packages</p><p style={styles.metricValue}>3 fixed tiers</p></div>
              <div style={styles.metricCard}><p style={styles.metricLabel}>Daily profit</p><p style={styles.metricValue}>Up to 2.2%</p></div>
              <div style={styles.metricCard}><p style={styles.metricLabel}>Lock periods</p><p style={styles.metricValue}>10 / 15 / 30 days</p></div>
              <div style={styles.metricCard}><p style={styles.metricLabel}>Funding</p><p style={styles.metricValue}>USDT only</p></div>
            </div>
          </section>
          {packagesError ? <p style={styles.error}>{packagesError}</p> : null}
          <section style={styles.packageGrid}>
            {stakingPackages.map((stakingPackage) => (
              <article key={stakingPackage.id} style={styles.packageCard}>
                <span style={styles.packageBadge}><Sparkles size={16} /> {stakingPackage.id}</span>
                <h2 style={styles.packageTitle}>{stakingPackage.name}</h2>
                <p style={styles.packageText}>{stakingPackage.description}</p>
                <ul style={styles.packageList}>
                  <li>Minimum stake: {stakingPackage.minAmount} USDT</li>
                  <li>Maximum stake: {stakingPackage.maxAmount.toLocaleString()} USDT</li>
                  <li>Lock duration: {stakingPackage.lockDurationDays} days</li>
                  <li>Daily profit: {stakingPackage.dailyProfitPercent}% fixed</li>
                </ul>
              </article>
            ))}
          </section>
          <section style={styles.stakeSection}>
            <div style={styles.panel}>
              <h2 style={styles.packageTitle}>Create a stake</h2>
              <p style={styles.helper}>Select a package and amount. The system will validate the package limits before locking the funds.</p>
              {selectedPackage ? (
                <p style={styles.helper}>Selected: {selectedPackage.id} supports {selectedPackage.minAmount} to {selectedPackage.maxAmount.toLocaleString()} USDT.</p>
              ) : null}
              <form style={styles.form} onSubmit={handleCreateStake}>
                <label style={styles.field}>
                  <span style={styles.label}>Package</span>
                  <select value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value as StakingPackage['id'])} style={styles.select}>
                    {stakingPackages.map((stakingPackage) => (
                      <option key={stakingPackage.id} value={stakingPackage.id}>
                        {stakingPackage.id} — {stakingPackage.dailyProfitPercent}% / day
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span style={styles.label}>Stake amount (USDT)</span>
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} style={styles.input} inputMode="decimal" placeholder={`Enter between ${selectedPackage.minAmount} and ${selectedPackage.maxAmount}`} />
                </label>
                <p style={styles.helper}>Projected total profit for the full lock: <strong>{projectedProfit.toFixed(2)} USDT</strong></p>
                {error ? <p style={styles.error}>{error}</p> : null}
                {message ? <p style={styles.success}>{message}</p> : null}
                <button type="submit" style={styles.button} disabled={isSubmitting}>{isSubmitting ? 'Creating stake...' : 'Start staking'} <ArrowRight size={16} /></button>
              </form>
            </div>
            <div style={styles.panel}>
              <h2 style={styles.packageTitle}>Your staking plans</h2>
              <p style={styles.helper}>Track your active and completed stakes in one place.</p>
              {isLoading ? <LoadingDots /> : null}
              {!isLoading && stakes.length === 0 ? <p style={styles.helper}>You have no stakes yet. Create your first plan to begin.</p> : null}
              <div style={styles.stakesList}>
                {stakes.map((stake) => (
                  <article key={stake.id} style={styles.stakeCard}>
                    <div style={styles.stakeRow}><strong>{stake.packageId}</strong><span style={styles.badge}>{stake.status}</span></div>
                    <p style={styles.helper}>Principal: {stake.principal} USDT</p>
                    <p style={styles.helper}>Fixed return: {stake.dailyProfitPercent}% daily for {stake.lockDurationDays} days</p>
                    <p style={styles.helper}>Earned profit: {stake.earnedProfit.toFixed(2)} USDT</p>
                    <p style={styles.helper}>Matures on: {new Date(stake.maturityDate).toLocaleDateString()}</p>
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
