import React, { useState, useEffect } from 'react';
import { useStrictAuth } from '../hooks/useStrictAuth';
import { useTheme } from '../ThemeContext';
import UnifiedModal from '../components/UnifiedModal';
// withdrawals disabled in UI for staking packages
import './Staking.css';

interface StakingPackage {
  _id: string;
  id: number;
  name: string;
  type: 'liquid' | 'fixed';
  currency: string;
  minAmount: number;
  duration: number;
  dailyReturn: number;
  // features and earlyWithdrawalPenalty removed - packages are simplified
}

interface StakingContract {
  _id: string;
  packageId: number;
  packageName: string;
  currency: string;
  stakedAmount: number;
  totalPayoutsReceived: number;
  startDate: string;
  endDate: string;
  duration: number;
  status: 'active' | 'completed' | 'cancelled' | 'withdrawn';
}

interface StakingStats {
  totalContracts: number;
  activeContracts: number;
  totalStaked: number;
  totalEarned: number;
  completedContracts: number;
}

const Staking: React.FC = () => {
  const { isAuthenticated, isChecking } = useStrictAuth();
  const { theme } = useTheme();
  const [packages, setPackages] = useState<StakingPackage[]>([]);
  const [contracts, setContracts] = useState<StakingContract[]>([]);
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<StakingPackage | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakingDuration, setStakingDuration] = useState<number | null>(null);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // Inline success/error messages
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    // Don't set default duration, let user input it
    if (!selectedPackage) setStakingDuration(null);
  }, [selectedPackage]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to clear cache for staking data
  const clearStakingCache = () => {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('tradespot_staking_')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  // Load all staking data with caching
  const loadAllData = async () => {
    try {
      setLoading(true);

      // Check cache first
      const cacheTimestampKey = 'tradespot_staking_timestamp';
      const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);
      const CACHE_DURATION = 60000; // 60 seconds

      let useCache = false;
      if (cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp, 10);
        useCache = age < CACHE_DURATION;
      }

      if (useCache) {
        // Load from cache
        const packagesCache = sessionStorage.getItem('tradespot_staking_packages');
        const contractsCache = sessionStorage.getItem('tradespot_staking_contracts');
        const statsCache = sessionStorage.getItem('tradespot_staking_stats');

        if (packagesCache) {
          try {
            const packagesData = JSON.parse(packagesCache);
            if (Array.isArray(packagesData)) {
              const sorted = [...packagesData].sort((a, b) => (a.minAmount || 0) - (b.minAmount || 0));
              setPackages(sorted);
            } else {
              setPackages(packagesData);
            }
          } catch (e) {
            console.warn('Failed to parse packages cache');
          }
        }

        if (contractsCache) {
          try {
            const contractsData = JSON.parse(contractsCache);
            setContracts(contractsData);
          } catch (e) {
            console.warn('Failed to parse contracts cache');
          }
        }

        if (statsCache) {
          try {
            const statsData = JSON.parse(statsCache);
            setStats(statsData);
          } catch (e) {
            console.warn('Failed to parse stats cache');
          }
        }

        setLoading(false);

        // Fetch fresh data in background
        fetchAllData(false);
        return;
      }

      // No cache or expired - fetch all data
      await fetchAllData(true);
    } catch (error) {
      console.error('Error loading staking data:', error);
      setLoading(false);
    }
  };

  // Fetch all staking data
  const fetchAllData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';
      const [packagesRes, contractsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/staking/packages`).catch(err => {
          console.error('Failed to fetch packages:', err);
          return null;
        }),
        fetch(`${API_BASE}/api/staking/contracts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).catch(err => {
          console.error('Failed to fetch contracts:', err);
          return null;
        }),
        fetch(`${API_BASE}/api/staking/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).catch(err => {
          console.error('Failed to fetch stats:', err);
          return null;
        })
      ]);

      if (packagesRes) {
        const packagesData = await packagesRes.json();
        if (packagesData.success) {
          // Ensure packages are ordered from smallest minAmount to largest
          try {
            const sorted = Array.isArray(packagesData.packages)
              ? [...packagesData.packages].sort((a, b) => (a.minAmount || 0) - (b.minAmount || 0))
              : [];
            setPackages(sorted);
            sessionStorage.setItem('tradespot_staking_packages', JSON.stringify(sorted));
          } catch (e) {
            // Fallback: set raw packages if sorting fails
            setPackages(packagesData.packages);
            sessionStorage.setItem('tradespot_staking_packages', JSON.stringify(packagesData.packages));
          }
        }
      }

      if (contractsRes) {
        const contractsData = await contractsRes.json();
        if (contractsData.success) {
          setContracts(contractsData.contracts);
          sessionStorage.setItem('tradespot_staking_contracts', JSON.stringify(contractsData.contracts));
        }
      }

      if (statsRes) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
          sessionStorage.setItem('tradespot_staking_stats', JSON.stringify(statsData.stats));
        }
      }

      // Set cache timestamp
      sessionStorage.setItem('tradespot_staking_timestamp', Date.now().toString());
    } catch (error) {
      console.error('Error fetching staking data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Legacy function for backward compatibility
  const fetchData = async () => {
    clearStakingCache();
    await fetchAllData(true);
  };

  const handleStake = async () => {
    if (!selectedPackage || !stakeAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';
      // Validate duration before sending - minimum is 3 days
      const packageDuration = selectedPackage ? selectedPackage.duration : 3;
      const effectivePackageDuration = packageDuration < 3 ? 3 : packageDuration;
      const durationToSend = stakingDuration ?? effectivePackageDuration;
      if (durationToSend < 3) {
        setError('Minimum staking duration is 3 days. Please enter a duration of at least 3 days.');
        setIsSubmitting(false);
        return;
      }
      if (durationToSend > 365) {
        setError('Maximum staking duration is 365 days');
        setIsSubmitting(false);
        return;
      }
      const response = await fetch(`${API_BASE}/api/staking/stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: parseFloat(stakeAmount),
          duration: stakingDuration ?? selectedPackage.duration
        })
      });

      const data = await response.json();
      if (data.success) {
        // Clear cache since data changed
        clearStakingCache();
        
        setSuccess('Staking contract created successfully!');
        setShowStakeModal(false);
        setStakeAmount('');
        
        // Refresh all data in background
        await fetchAllData(false);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to create staking contract');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error creating staking contract:', error);
      setError('Failed to create staking contract');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Withdrawals are intentionally disabled in the UI for staking packages.

  const handleCancelContract = async (contractId: string) => {
    // Cancellation is disabled in this build. Do nothing.
  };


  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: currency === 'BTC' ? 8 : 2
    }).format(amount);
  };

  const formatDuration = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  // Derived values for the stake modal
  const numericStake = Number(stakeAmount) || 0;
  // Ensure minimum duration is 3 days - if package duration is less than 3, use 3
  const packageDuration = selectedPackage ? selectedPackage.duration : 3;
  const effectivePackageDuration = packageDuration < 3 ? 3 : packageDuration;
  const durationToCheck = selectedPackage ? (stakingDuration ?? effectivePackageDuration) : 0;
  // Validate that duration is at least 3 days
  const isDurationValid = durationToCheck >= 3;
  const isStakeValid = Boolean(selectedPackage) && 
                       numericStake >= (selectedPackage ? selectedPackage.minAmount : 0) && 
                       isDurationValid;
  // Use the selected stakingDuration (or effectivePackageDuration) when calculating profit
  const calcDuration = selectedPackage ? (stakingDuration ?? effectivePackageDuration) : 0;
  // Expected profit over the whole duration = amount * (dailyReturn% per day) * duration (days)
  const expectedProfit = selectedPackage ? numericStake * (selectedPackage.dailyReturn / 100) * calcDuration : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div style={{
        background: 'var(--bg)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}>
        <div style={{
          padding: '12px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div className="loading-spinner">Please log in to access staking...</div>
        </div>
      </div>
    );
  }

  // Remove full-page loading state - show the page structure immediately

  return (
    <>
      <style>{`
        @keyframes loading-dots {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
        .loading-dots {
          animation: loading-dots 1.5s infinite;
        }
      `}</style>
      <div style={{
        background: 'var(--bg)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        padding: '20px',
        minHeight: 'auto'
    }}>

      {/* Main Content */}
      <div style={{
        padding: '0',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Inline success / error alerts */}
        {success && (
          <div style={{ background: '#ECFDF5', color: '#065F46', padding: 12, borderRadius: 6, marginBottom: 12 }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#FEF3F2', color: '#7F1D1D', padding: 12, borderRadius: 6, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* PACKAGES Section */}
        <div className="staking-section">
          <h2 className="section-title">PACKAGES</h2>
          <div className="staking-notice">
            <strong>Notice:</strong> You can choose a staking duration when creating a contract. Minimum duration for each package is shown in the package details.
          </div>
          
          <div className="staking-packages-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text)', opacity: 0.7, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '16px' }}><span className="loading-dots">...</span></div>
              </div>
            ) : packages.length === 0 ? (
              <div className="no-contracts">
                <p>No staking packages available</p>
              </div>
            ) : (
              packages.map((pkg) => (
                <div key={pkg._id} className="staking-package-card">
                  <div className="package-card-header">
                    <h3>{pkg.name}</h3>
                  </div>
                  
                  <div className="package-card-content">
                    <div className="package-detail">
                      <span className="detail-label">Min Amount</span>
                      <span className="detail-value">{formatCurrency(pkg.minAmount, pkg.currency)}</span>
                    </div>
                    
                    <div className="package-detail">
                      <span className="detail-label">Daily Return</span>
                      <span className="detail-value highlight">{pkg.dailyReturn}%</span>
                    </div>
                  </div>
                  
                  <button
                    className="stake-button"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      // If package duration is less than 3, default to 3 days (minimum)
                      const defaultDuration = pkg.duration < 3 ? 3 : null;
                      setStakingDuration(defaultDuration);
                      setShowStakeModal(true);
                    }}
                  >
                    Stake Now
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CONTRACTS Section */}
        <div className="staking-section">
          <h2 className="section-title">CONTRACTS</h2>
          <div className="staking-contracts-grid">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text)', opacity: 0.7, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}><span className="loading-dots">...</span></div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="no-contracts">
                <p>No staking contracts found</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <div key={contract._id} className="staking-contract-card">
                  <div className="contract-card-header">
                    <h3>{contract.packageName}</h3>
                    <span className={`status-badge ${contract.status}`}>
                      {contract.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="contract-card-content">
                    <div className="contract-detail">
                      <span className="detail-label">Staked Amount</span>
                      <span className="detail-value">{formatCurrency(contract.stakedAmount, contract.currency)}</span>
                    </div>
                    
                    <div className="contract-detail">
                      <span className="detail-label">Total Earned</span>
                      <span className="detail-value highlight">{formatCurrency(contract.totalPayoutsReceived || 0, contract.currency)}</span>
                    </div>
                    
                    <div className="contract-detail">
                      <span className="detail-label">End Date</span>
                      <span className="detail-value">{new Date(contract.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* STATISTICS Section */}
        {stats && (
          <div className="staking-section">
            <h2 className="section-title">STATISTICS</h2>
            <div className="staking-stats-grid">
              <div className="stat-card">
                <h3>Total Contracts</h3>
                <div className="stat-value">{stats.totalContracts}</div>
              </div>
              <div className="stat-card">
                <h3>Active Contracts</h3>
                <div className="stat-value">{stats.activeContracts}</div>
              </div>
              <div className="stat-card">
                <h3>Total Staked</h3>
                <div className="stat-value">{formatCurrency(stats.totalStaked, 'USDT')}</div>
              </div>
              <div className="stat-card">
                <h3>Total Earned</h3>
                <div className="stat-value">{formatCurrency(stats.totalEarned, 'USDT')}</div>
              </div>
              <div className="stat-card">
                <h3>Completed</h3>
                <div className="stat-value">{stats.completedContracts}</div>
              </div>
            </div>
          </div>
        )}

      {/* Stake Modal */}
      {showStakeModal && selectedPackage && (
        <UnifiedModal
          isOpen={true}
          onClose={() => setShowStakeModal(false)}
          title={`Stake ${selectedPackage.name}`}
          subtitle={selectedPackage.currency}
        >
              <div className="form-group">
                <label>Amount to Stake ({selectedPackage.currency})</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  min={selectedPackage.minAmount}
                  placeholder={`Min: ${selectedPackage.minAmount}`}
                />
              </div>
              <div className="form-group">
                <label>Duration (days)</label>
                <input
                  type="number"
                  value={stakingDuration ?? ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setStakingDuration(null);
                      return;
                    }
                    const v = parseInt(inputValue, 10);
                    if (!isNaN(v)) {
                      // Cap at maximum, but allow values below 3 (validation happens on button click)
                      if (v > 365) {
                        setStakingDuration(365);
                        return;
                      }
                      setStakingDuration(v);
                    }
                  }}
                  max={365}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                  Minimum: 3 days. Max: 365 days.
                </div>
                {stakingDuration !== null && stakingDuration < 3 && (
                  <div style={{ fontSize: '0.75rem', color: '#e74c3c', marginTop: 6 }}>
                    ⚠️ Minimum staking duration is 3 days
                  </div>
                )}
              </div>
              {Boolean(stakeAmount) && Number(stakeAmount) > 0 && (
                <div className="stake-summary">
                  <h4>Staking Summary:</h4>
                  <div className="summary-row">
                    <span>Amount:</span>
                    <span>{formatCurrency(parseFloat(stakeAmount) || 0, selectedPackage.currency)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Duration:</span>
                    <span>{formatDuration(calcDuration)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Estimated Profit:</span>
                    <span>{formatCurrency(expectedProfit, selectedPackage.currency)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total at Maturity:</span>
                    <span>{formatCurrency((parseFloat(stakeAmount) || 0) + expectedProfit, selectedPackage.currency)}</span>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '10px 12px', borderTop: '1px solid var(--secondary)' }}>
                <button onClick={() => setShowStakeModal(false)}>Cancel</button>
                <button onClick={handleStake} className="confirm-button" disabled={!isStakeValid || isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Confirm Stake'}
                </button>
              </div>
        </UnifiedModal>
      )}

      {/* Withdraw UI removed - withdrawals not available from staking packages via UI */}
      </div>
    </div>
    </>
  );
};

export default Staking;