import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    getCopyTraders, 
    getCopyTraderDetails, 
    startCopyTrading, 
    getCopyPositions,
    getCopyTradingDashboard,
    stopCopyTrading,
    addFundsToPosition,
    withdrawFromPosition,
    updatePositionSettings
    , getCurrentUser
} from '../services/api';
import { useTheme } from '../ThemeContext';
import TabFilter from '../components/TabFilter';
import UnifiedModal from '../components/UnifiedModal';
import './CopyTrading.css';

interface CopyTrader {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
    bio: string;
    tradingStyle: string;
    riskLevel: string;
    currentPerformancePercentage: number; // NEW: Real-time performance %
    minCopyAmount: number;
    maxCopyAmount?: number;
    currentCopiers: number;
    maxCopiers: number;
    followersCount: number;
    performanceHistory?: Array<{
        timestamp: string;
        performancePercentage: number;
        change: number;
    }>;
    dailyPerformanceRange?: {
        min: number;
        max: number;
        currentDailyChange: number;
        lastResetDate: string;
    };
}

interface CopyPosition {
    _id: string;
    copyTraderId: CopyTrader | null;
    initialAmount: number;
    currentAmount: number;
    totalInvested: number;
    totalWithdrawn: number;
    totalProfit: number;
    totalProfitPercentage: number;
    status: string;
    isActive: boolean;
    startedAt: string;
    copySettings?: {
        autoReinvest: boolean;
        maxLossPercentage: number;
        notificationEnabled: boolean;
    };
    dailyReturns: Array<{
        date: string;
        return: number;
        amount: number;
    }>;
}

interface DashboardData {
    summary: {
        totalPositions: number;
        activePositions: number;
        totalInvested: number;
        totalWithdrawn: number;
        currentValue: number;
        totalProfit: number;
        totalProfitPercentage: number;
        weeklyReturns: number;
    };
    positions: CopyPosition[];
}

const CopyTrading: React.FC = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'traders' | 'positions' | 'dashboard'>('traders');
    const [traders, setTraders] = useState<CopyTrader[]>([]);
    const [positions, setPositions] = useState<CopyPosition[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [userUSDTBalance, setUserUSDTBalance] = useState<number | null>(null);
    
    // Filters
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [riskLevelFilter, setRiskLevelFilter] = useState<string>('');
    const [tradingStyleFilter, setTradingStyleFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('followersCount');
    const [sortOrder, setSortOrder] = useState<string>('desc');
    
    // Copy trading modal
    const [selectedTrader, setSelectedTrader] = useState<CopyTrader | null>(null);
    const [copyAmount, setCopyAmount] = useState<number>(50);
    const [autoReinvest, setAutoReinvest] = useState<boolean>(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copying, setCopying] = useState(false);

    // Position management modals
    const [selectedPosition, setSelectedPosition] = useState<CopyPosition | null>(null);
    const [showAddFundsModal, setShowAddFundsModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [addFundsAmount, setAddFundsAmount] = useState<number>(0);
    const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
    const [positionAutoReinvest, setPositionAutoReinvest] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState(false);
    // Track which position action dropdown is open (active id) and its button rect for portal positioning
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [dropdownCoords, setDropdownCoords] = useState<DOMRect | null>(null);

    // Close action dropdown when clicking outside (listens to document)
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (activeDropdownId) {
                setActiveDropdownId(null);
                setDropdownCoords(null);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [activeDropdownId]);

    // Track if initial data has been loaded
    const [dataLoaded, setDataLoaded] = useState(false);

    // Initial load: fetch all data once when page opens
    useEffect(() => {
        if (!dataLoaded) {
            loadAllData();
        }
    }, [dataLoaded]);

    // When filters change on traders tab, refetch traders only
    useEffect(() => {
        if (dataLoaded && activeTab === 'traders') {
            loadTradersData();
        }
    }, [riskLevelFilter, tradingStyleFilter, sortBy, sortOrder, dataLoaded, activeTab]);

    // Load all data on initial page load
    const loadAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cacheTimestampKey = 'tradespot_copy_all_timestamp';
            const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);
            const CACHE_DURATION = 60000; // 60 seconds

            let useCache = false;
            if (cachedTimestamp) {
                const age = Date.now() - parseInt(cachedTimestamp, 10);
                useCache = age < CACHE_DURATION;
            }

            if (useCache) {
                // Load from cache
                const tradersCache = sessionStorage.getItem('tradespot_copy_traders');
                const positionsCache = sessionStorage.getItem('tradespot_copy_positions');
                const dashboardCache = sessionStorage.getItem('tradespot_copy_dashboard');

                if (tradersCache) {
                    try {
                        const tradersData = JSON.parse(tradersCache);
                        setTraders(tradersData);
                    } catch (e) {
                        console.warn('Failed to parse traders cache');
                    }
                }

                if (positionsCache) {
                    try {
                        const positionsData = JSON.parse(positionsCache);
                        setPositions(positionsData.positions || positionsData);
                        setUserUSDTBalance(positionsData.userUSDTBalance || null);
                    } catch (e) {
                        console.warn('Failed to parse positions cache');
                    }
                }

                if (dashboardCache) {
                    try {
                        const dashboardData = JSON.parse(dashboardCache);
                        setDashboardData(dashboardData);
                    } catch (e) {
                        console.warn('Failed to parse dashboard cache');
                    }
                }

                setLoading(false);

                // Fetch fresh data in background
                fetchAllData(false).then(() => setDataLoaded(true));
                return;
            }

            // No cache or expired - fetch all data
            await fetchAllData(true);
            setDataLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
            setLoading(false);
        }
    };

    // Fetch all three tabs' data at once
    const fetchAllData = async (showLoading: boolean = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            // Fetch all data in parallel
            const [tradersResponse, positionsResponse, dashboardResponse] = await Promise.all([
                getCopyTraders({
                    riskLevel: riskLevelFilter || undefined,
                    tradingStyle: tradingStyleFilter || undefined,
                    sortBy,
                    sortOrder,
                    limit: 100
                }).catch(err => {
                    console.error('Failed to fetch traders:', err);
                    return null;
                }),
                getCopyPositions().catch(err => {
                    console.error('Failed to fetch positions:', err);
                    return null;
                }),
                getCopyTradingDashboard().catch(err => {
                    console.error('Failed to fetch dashboard:', err);
                    return null;
                })
            ]);

            // Update traders
            if (tradersResponse) {
                const tradersData = tradersResponse.data.traders;
                setTraders(tradersData);
                sessionStorage.setItem('tradespot_copy_traders', JSON.stringify(tradersData));
            }

            // Update positions and balance
            if (positionsResponse) {
                const positionsData = positionsResponse.data;
                setPositions(positionsData);
                
                // Fetch user balance
                let balance = null;
                try {
                    const me = await getCurrentUser();
                    balance = me.usdtBalance || 0;
                    setUserUSDTBalance(balance);
                } catch (err) {
                    // ignore; balance is optional
                }

                sessionStorage.setItem('tradespot_copy_positions', JSON.stringify({
                    positions: positionsData,
                    userUSDTBalance: balance
                }));
            }

            // Update dashboard
            if (dashboardResponse) {
                const dashboardData = dashboardResponse.data;
                setDashboardData(dashboardData);
                sessionStorage.setItem('tradespot_copy_dashboard', JSON.stringify(dashboardData));
            }

            // Set cache timestamp
            sessionStorage.setItem('tradespot_copy_all_timestamp', Date.now().toString());
        } catch (err: any) {
            throw err;
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    // Fetch only traders data (when filters change)
    const loadTradersData = async () => {
        try {
            setLoading(true);
            setError(null);

            const cacheParams = `traders_${riskLevelFilter}_${tradingStyleFilter}_${sortBy}_${sortOrder}`;
            const cacheKey = `tradespot_copy_${cacheParams}`;
            const cacheTimestampKey = `${cacheKey}_timestamp`;
            const CACHE_DURATION = 60000;

            // Check cache
            const cachedData = sessionStorage.getItem(cacheKey);
            const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);

            if (cachedData && cachedTimestamp) {
                const age = Date.now() - parseInt(cachedTimestamp, 10);
                if (age < CACHE_DURATION) {
                    try {
                        const tradersData = JSON.parse(cachedData);
                        setTraders(tradersData);
                        setLoading(false);
                        
                        // Fetch fresh in background
                        fetchTradersData(false);
                        return;
                    } catch (e) {
                        console.warn('Cache parse failed');
                    }
                }
            }

            // Fetch fresh
            await fetchTradersData(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load traders');
            setLoading(false);
        }
    };

    // Fetch traders data only
    const fetchTradersData = async (showLoading: boolean = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const response = await getCopyTraders({
                riskLevel: riskLevelFilter || undefined,
                tradingStyle: tradingStyleFilter || undefined,
                sortBy,
                sortOrder,
                limit: 100
            });

            const tradersData = response.data.traders;
            setTraders(tradersData);

            // Cache
            const cacheParams = `traders_${riskLevelFilter}_${tradingStyleFilter}_${sortBy}_${sortOrder}`;
            const cacheKey = `tradespot_copy_${cacheParams}`;
            sessionStorage.setItem(cacheKey, JSON.stringify(tradersData));
            sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
            
            // Also update main traders cache
            sessionStorage.setItem('tradespot_copy_traders', JSON.stringify(tradersData));
        } catch (err: any) {
            throw err;
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    // Helper to clear cache for all copy trading tabs
    const clearCopyTradingCache = () => {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith('tradespot_copy_')) {
                sessionStorage.removeItem(key);
            }
        });
    };

    const handleStartCopying = async () => {
        if (!selectedTrader) return;
        
        try {
            setCopying(true);
            await startCopyTrading(selectedTrader._id, copyAmount, {
                copySettings: {
                    maxLossPercentage: 50,
                    notificationEnabled: true
                }
            });
            
            // Clear cache since data changed
            clearCopyTradingCache();
            
            // Refresh balance after starting copy trading
            try {
                const me = await getCurrentUser();
                setUserUSDTBalance(me.usdtBalance || 0);
            } catch (err) {
                // ignore; balance is optional
            }
            
            setShowCopyModal(false);
            setSelectedTrader(null);
            setCopyAmount(50);
            // Refresh all data since positions changed
            await fetchAllData(false);
            // Automatically switch to positions tab to show the new position
            setActiveTab('positions');
        } catch (err: any) {
            setError(err.message || 'Failed to start copy trading');
        } finally {
            setCopying(false);
        }
    };

    const handleStopCopying = async (positionId: string) => {
        try {
            setActionLoading(true);
            await stopCopyTrading(positionId);
            clearCopyTradingCache(); // Clear cache since data changed
            // Refresh all data since positions changed
            await fetchAllData(false);
        } catch (err: any) {
            setError(err.message || 'Failed to stop copy trading');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResumeCopying = async (positionId: string) => {
        try {
            setActionLoading(true);
            // Resuming is no longer supported. Guide the user to start a new copy.
            setError('Resuming a stopped position is no longer supported. To copy this trader again, start a new copy position from the trader list.');
        } catch (err: any) {
            setError(err.message || 'Failed to resume copy trading');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddFunds = async () => {
        if (!selectedPosition || addFundsAmount <= 0) return;
        
        try {
            setActionLoading(true);
            await addFundsToPosition(selectedPosition._id, addFundsAmount);
            clearCopyTradingCache(); // Clear cache since data changed
            // Refresh balance after adding funds
            try {
                const me = await getCurrentUser();
                setUserUSDTBalance(me.usdtBalance || 0);
            } catch (err) {
                // ignore; balance is optional
            }
            setShowAddFundsModal(false);
            setSelectedPosition(null);
            setAddFundsAmount(0);
            // Refresh all data since positions changed
            await fetchAllData(false);
        } catch (err: any) {
            setError(err.message || 'Failed to add funds');
        } finally {
            setActionLoading(false);
        }
    };

    const handleWithdrawFunds = async () => {
        if (!selectedPosition || withdrawAmount <= 0) return;
        
        try {
            setActionLoading(true);
            await withdrawFromPosition(selectedPosition._id, withdrawAmount);
            clearCopyTradingCache(); // Clear cache since data changed
            // Refresh balance after withdrawing funds
            try {
                const me = await getCurrentUser();
                setUserUSDTBalance(me.usdtBalance || 0);
            } catch (err) {
                // ignore; balance is optional
            }
            // show inline success and refresh data without reloading the page
            setSuccess(`Successfully withdrew ${formatCurrency(withdrawAmount)} from ${selectedPosition.copyTraderId?.name}`);
            setShowWithdrawModal(false);
            setSelectedPosition(null);
            setWithdrawAmount(0);
            // Refresh all data since positions changed
            await fetchAllData(false);
            // clear success after a short timeout
            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to withdraw funds');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSettings = async () => {
        if (!selectedPosition) return;
        
        try {
            setActionLoading(true);
            await updatePositionSettings(selectedPosition._id, {
                copySettings: {
                    maxLossPercentage: 50,
                    notificationEnabled: true
                }
            });
            clearCopyTradingCache(); // Clear cache since data changed
            setShowSettingsModal(false);
            setSelectedPosition(null);
            // Refresh all data since positions changed
            await fetchAllData(false);
        } catch (err: any) {
            setError(err.message || 'Failed to update settings');
        } finally {
            setActionLoading(false);
        }
    };

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'conservative': return '#10B981';
            case 'moderate': return '#F59E0B';
            case 'aggressive': return '#EF4444';
            case 'very-aggressive': return '#DC2626';
            default: return '#6B7280';
        }
    };

    const getTradingStyleIcon = (style: string) => {
        switch (style) {
            case 'scalper': return '⚡';
            case 'day': return '📈';
            case 'swing': return '🌊';
            case 'position': return '🎯';
            case 'arbitrage': return '⚖️';
            default: return '📊';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

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
                padding: window.innerWidth <= 768 ? '4px' : '20px',
                width: '100%',
                minHeight: '100vh',
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

            {/* Navigation Tabs */}
            <TabFilter
              tabs={[
                { id: 'traders', label: '📊 Available Traders' },
                { id: 'positions', label: '💼 My Positions' },
                { id: 'dashboard', label: '📈 Dashboard' }
              ]}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
            />

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Traders Tab */}
            {activeTab === 'traders' && (
                <div className="traders-section">
                    {/* Filter Toggle Button */}
                    <div className="filter-toggle-section">
                        <button 
                            className="filter-toggle-button"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="filters-section">
                        <div className="filter-group">
                            <label>Risk Level:</label>
                            <select 
                                value={riskLevelFilter} 
                                onChange={(e) => setRiskLevelFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="conservative">Conservative</option>
                                <option value="moderate">Moderate</option>
                                <option value="aggressive">Aggressive</option>
                                <option value="very-aggressive">Very Aggressive</option>
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label>Trading Style:</label>
                            <select 
                                value={tradingStyleFilter} 
                                onChange={(e) => setTradingStyleFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="scalper">Scalper</option>
                                <option value="day">Day Trading</option>
                                <option value="swing">Swing Trading</option>
                                <option value="position">Position Trading</option>
                                <option value="arbitrage">Arbitrage</option>
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label>Sort By:</label>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="followersCount">Followers</option>
                                <option value="currentPerformancePercentage">Performance</option>
                                <option value="currentCopiers">Copiers</option>
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label>Order:</label>
                            <select 
                                value={sortOrder} 
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="desc">High to Low</option>
                                <option value="asc">Low to High</option>
                            </select>
                        </div>
                    </div>
                    )}

                    {/* Traders Grid */}
                    <div className="traders-grid">
                        {loading ? (
                            <div style={{ 
                                gridColumn: '1 / -1', 
                                textAlign: 'center', 
                                padding: '40px', 
                                color: 'var(--text)', 
                                opacity: 0.7 
                            }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '16px' }}><span className="loading-dots">...</span></div>
                            </div>
                        ) : traders.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text)', opacity: 0.8 }}>
                                <h3>No traders found</h3>
                                <p>If this persists, try refreshing or adjusting filters.</p>
                            </div>
                        ) : traders.map((trader) => (
                            <div key={trader._id} className="trader-card">
                                <div className="trader-header">
                                    <div className="trader-avatar">
                                        {trader.avatar ? (
                                            <img src={trader.avatar} alt={trader.name} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {trader.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="trader-info">
                                        <h3>{trader.name}</h3>
                                        <p>@{trader.username}</p>
                                    </div>
                                </div>


                                <div className="trader-stats">
                                    <div className="stat performance-stat">
                                        <span className="stat-label">Current Performance</span>
                                        <span 
                                            className="stat-value performance-value"
                                            style={{ 
                                                color: trader.currentPerformancePercentage >= 0 ? '#10b981' : '#ef4444' 
                                            }}
                                        >
                                            {trader.currentPerformancePercentage >= 0 ? '+' : ''}{trader.currentPerformancePercentage.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Daily Change</span>
                                        <span 
                                            className="stat-value"
                                            style={{ 
                                                color: (trader.dailyPerformanceRange?.currentDailyChange || 0) >= 0 ? '#10b981' : '#ef4444' 
                                            }}
                                        >
                                            {(trader.dailyPerformanceRange?.currentDailyChange || 0) >= 0 ? '+' : ''}{(trader.dailyPerformanceRange?.currentDailyChange || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Copiers</span>
                                        <span className="stat-value">{trader.currentCopiers}/{trader.maxCopiers}</span>
                                    </div>
                                </div>

                                <div className="trader-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">{getTradingStyleIcon(trader.tradingStyle)}</span>
                                        <span className="meta-text">{trader.tradingStyle}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span 
                                            className="risk-badge"
                                            style={{ backgroundColor: getRiskColor(trader.riskLevel) }}
                                        >
                                            {trader.riskLevel}
                                        </span>
                                    </div>
                                </div>

                                <button 
                                    className="copy-button"
                                    onClick={async () => {
                                        setSelectedTrader(trader);
                                        setCopyAmount(50);
                                        // Fetch balance when opening modal
                                        try {
                                            const me = await getCurrentUser();
                                            setUserUSDTBalance(me.usdtBalance || 0);
                                        } catch (err) {
                                            // ignore; balance is optional
                                        }
                                        setShowCopyModal(true);
                                    }}
                                    disabled={trader.currentCopiers >= trader.maxCopiers}
                                >
                                    {trader.currentCopiers >= trader.maxCopiers ? 'Full' : 'Start Copying'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Positions Tab */}
                    {activeTab === 'positions' && (
                <div className="positions-section">
                    {loading ? (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            minHeight: '200px',
                            gap: '12px'
                        }} aria-live="polite" aria-busy={true}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}><span className="loading-dots">...</span></div>
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Copy Positions Yet</h3>
                            <p>Start copying traders to see your positions here</p>
                            <button onClick={() => setActiveTab('traders')}>
                                Browse Traders
                            </button>
                        </div>
                    ) : (
                        <>
                        <div className="positions-table-container">
                            <table className="positions-table">
                                <thead>
                                    <tr>
                                        <th>Trader</th>
                                        <th>Status</th>
                                        <th>Current Value</th>
                                        <th>Total Profit</th>
                                        <th>Profit %</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text)', opacity: 0.7 }}>
                                                <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}><span className="loading-dots">...</span></div>
                                                <p style={{ margin: '0', fontSize: '0.9rem' }}>Loading positions...</p>
                                            </td>
                                        </tr>
                                    ) : positions.map((position) => (
                                        <tr key={position._id} className="position-row">
                                            <td className="trader-cell">
                                                <div className="trader-info">
                                                    <div className="trader-name">{position.copyTraderId?.name || 'Unknown Trader'}</div>
                                                    <div className="trader-username">@{position.copyTraderId?.username || 'unknown'}</div>
                                                </div>
                                            </td>
                                            <td className="status-cell">
                                                <span className={`status-badge ${position.status}`}>
                                                    {position.status}
                                                </span>
                                            </td>
                                            <td className="value-cell">
                                                {formatCurrency(position.currentAmount)}
                                            </td>
                                            <td className={`profit-cell ${position.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                                                {formatCurrency(position.totalProfit)}
                                            </td>
                                            <td className={`profit-percentage-cell ${position.totalProfitPercentage >= 0 ? 'positive' : 'negative'}`}>
                                                {formatPercentage(position.totalProfitPercentage)}
                                            </td>
                                            <td className="actions-cell">
                                                {/* Manage button now opens a portal-rendered dropdown so it won't be clipped by the table scroll */}
                                                <div className="position-actions-dropdown">
                                                    <button
                                                        className="manage-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // compute button rect and open portal dropdown for this id
                                                            const btn = e.currentTarget as HTMLButtonElement;
                                                            const rect = btn.getBoundingClientRect();
                                                            setDropdownCoords(rect);
                                                            setActiveDropdownId(prev => prev === position._id ? null : position._id);
                                                        }}
                                                        aria-expanded={activeDropdownId === position._id}
                                                        aria-controls={`actions-${position._id}`}
                                                    >
                                                        Manage
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                            {/* Portal-rendered dropdown (outside scrollable table) */}
                            {activeDropdownId && dropdownCoords && (() => {
                                const pos = positions.find(p => p._id === activeDropdownId);
                                if (!pos) return null;
                                const style: React.CSSProperties = {
                                    position: 'fixed',
                                    left: dropdownCoords.right - 180, // align right edge
                                    top: dropdownCoords.bottom + 8,
                                    zIndex: 3000
                                };
                                return createPortal(
                                    <div className="actions-dropdown" id={`actions-${pos._id}`} style={style} onClick={e => e.stopPropagation()}>
                                        <button
                                            className="dropdown-item"
                                            onClick={async () => {
                                                setSelectedPosition(pos);
                                                setAddFundsAmount(0);
                                                // Fetch balance when opening modal
                                                try {
                                                    const me = await getCurrentUser();
                                                    setUserUSDTBalance(me.usdtBalance || 0);
                                                } catch (err) {
                                                    // ignore; balance is optional
                                                }
                                                setShowAddFundsModal(true);
                                                setActiveDropdownId(null);
                                                setDropdownCoords(null);
                                            }}
                                        >
                                            Add
                                        </button>
                                        <button
                                            className="dropdown-item"
                                            onClick={async () => {
                                                setSelectedPosition(pos);
                                                setWithdrawAmount(0);
                                                // Fetch balance when opening modal
                                                try {
                                                    const me = await getCurrentUser();
                                                    setUserUSDTBalance(me.usdtBalance || 0);
                                                } catch (err) {
                                                    // ignore; balance is optional
                                                }
                                                setShowWithdrawModal(true);
                                                setActiveDropdownId(null);
                                                setDropdownCoords(null);
                                            }}
                                        >
                                            Withdraw
                                        </button>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setSelectedPosition(pos);
                                                setPositionAutoReinvest(pos.copySettings?.autoReinvest || false);
                                                setShowSettingsModal(true);
                                                setActiveDropdownId(null);
                                                setDropdownCoords(null);
                                            }}
                                        >
                                            Settings
                                        </button>
                                        {pos.isActive ? (
                                            <button
                                                className="dropdown-item stop"
                                                onClick={() => {
                                                    handleStopCopying(pos._id);
                                                    setActiveDropdownId(null);
                                                    setDropdownCoords(null);
                                                }}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? 'Stopping...' : 'Stop'}
                                            </button>
                                        ) : (
                                            <button
                                                className="dropdown-item resume"
                                                onClick={() => {
                                                    handleResumeCopying(pos._id);
                                                    setActiveDropdownId(null);
                                                    setDropdownCoords(null);
                                                }}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? 'Resuming...' : 'Resume'}
                                            </button>
                                        )}
                                    </div>,
                                    document.body
                                );
                            })()}
                        </>
                    )}
                </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div className="dashboard-section">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="loading-dots" style={{ fontSize: '1.5rem' }}>...</div>
                        </div>
                    ) : dashboardData ? (
                        <div className="dashboard-content">
                            <div className="dashboard-summary-wrapper">
                                <div className="dashboard-summary">
                                    <div className="summary-card">
                                        <h3>Total Invested</h3>
                                        <p>{loading ? <span className="loading-dots">....</span> : formatCurrency(dashboardData.summary.totalInvested)}</p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Current Value</h3>
                                        <p>{loading ? <span className="loading-dots">....</span> : formatCurrency(dashboardData.summary.currentValue)}</p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Total Profit</h3>
                                        <p className={dashboardData.summary.totalProfit >= 0 ? 'positive' : 'negative'}>
                                            {loading ? <span className="loading-dots">....</span> : formatCurrency(dashboardData.summary.totalProfit)}
                                        </p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Profit %</h3>
                                        <p className={dashboardData.summary.totalProfitPercentage >= 0 ? 'positive' : 'negative'}>
                                            {loading ? <span className="loading-dots">...</span> : formatPercentage(dashboardData.summary.totalProfitPercentage)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-stats-wrapper">
                                <div className="dashboard-stats">
                                    <div className="stat-card">
                                        <h4>Active Positions</h4>
                                        <p>{loading ? <span className="loading-dots">...</span> : dashboardData.summary.activePositions}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h4>Total Positions</h4>
                                        <p>{loading ? <span className="loading-dots">...</span> : dashboardData.summary.totalPositions}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h4>Weekly Returns</h4>
                                        <p className={dashboardData.summary.weeklyReturns >= 0 ? 'positive' : 'negative'}>
                                            {loading ? <span className="loading-dots">...</span> : formatPercentage(dashboardData.summary.weeklyReturns)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>No Data Available</h3>
                            <p>Start copy trading to see your dashboard</p>
                        </div>
                    )}
                </div>
            )}

            {/* Copy Trading Modal */}
            {showCopyModal && selectedTrader && (
                <UnifiedModal
                    isOpen={true}
                    onClose={() => setShowCopyModal(false)}
                    title="Start Copy Trading"
                    subtitle={selectedTrader.name}
                >
                            {/* Trader info card */}
                            <div style={{
                                background: 'rgba(120,140,180,0.05)',
                                borderRadius: 10,
                                padding: '10px 12px',
                                marginBottom: 12,
                                border: '1px solid rgba(120,140,180,0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 10
                                }}>
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: 'var(--secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        boxShadow: 'var(--card-shadow)',
                                        overflow: 'hidden'
                                    }}>
                                        {selectedTrader.avatar ? (
                                            <img 
                                                src={selectedTrader.avatar} 
                                                alt={selectedTrader.username}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            selectedTrader.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: 'var(--text)',
                                            marginBottom: 2
                                        }}>
                                            {selectedTrader.name}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: '0.8rem'
                                        }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                @{selectedTrader.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 10px',
                                    background: 'rgba(120,140,180,0.03)',
                                    borderRadius: 6,
                                    border: '1px solid rgba(120,140,180,0.08)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 1 }}>
                                            Current Performance
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                                            {selectedTrader.currentPerformancePercentage >= 0 ? '+' : ''}{selectedTrader.currentPerformancePercentage.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 1 }}>
                                            Risk Level
                                        </div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                                            {selectedTrader.riskLevel}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance and Input on same row */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '12px',
                                marginBottom: 12
                            }}>
                                {/* Your balance */}
                                <div style={{
                                    background: 'rgba(46, 204, 113, 0.1)',
                                    borderRadius: 6,
                                    padding: '8px 10px',
                                    border: '1px solid rgba(46, 204, 113, 0.2)'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                                        Your USDT Balance
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success-color)' }}>
                                        {userUSDTBalance !== null ? `${userUSDTBalance.toFixed(2)} USDT` : 'Loading...'}
                                    </div>
                                </div>

                                {/* Input section */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text)',
                                        marginBottom: 3
                                    }}>
                                        Amount to Copy (USDT)
                                    </label>
                                    <input
                                        type="number"
                                        min="50"
                                        step="0.01"
                                        value={copyAmount}
                                        onChange={(e) => setCopyAmount(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            border: '2px solid rgba(120,140,180,0.2)',
                                            background: 'var(--bg)',
                                            color: 'var(--text)',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            boxSizing: 'border-box'
                                        }}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Minimum amount info */}
                            <div style={{
                                marginTop: -4,
                                marginBottom: 12,
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                textAlign: 'center'
                            }}>
                                Minimum: $50 USDT
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    style={{
                                        flex: 1,
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        border: '1px solid rgba(120,140,180,0.2)',
                                        borderRadius: 8,
                                        padding: '8px 0',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowCopyModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    style={{
                                        flex: 1,
                                        background: (copying || copyAmount < 50) ? 'rgba(120,140,180,0.3)' : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '8px 0',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                        cursor: (copying || copyAmount < 50) ? 'not-allowed' : 'pointer',
                                        opacity: (copying || copyAmount < 50) ? 0.6 : 1,
                                        boxShadow: (copying || copyAmount < 50) ? 'none' : 'var(--card-shadow)',
                                        letterSpacing: 0.5
                                    }}
                                    disabled={copying || copyAmount < 50}
                                    onClick={handleStartCopying}
                                >
                                    {copying ? 'Starting...' : 'Start Copying'}
                                </button>
                            </div>
                </UnifiedModal>
            )}
            {showAddFundsModal && selectedPosition && (
                <UnifiedModal
                    isOpen={true}
                    onClose={() => setShowAddFundsModal(false)}
                    title={`Add Funds to ${selectedPosition.copyTraderId?.name}`}
                >
                            <div className="position-info">
                                <div className="info-item">
                                    <span>Current Value: {formatCurrency(selectedPosition.currentAmount)}</span>
                                </div>
                                <div className="info-item">
                                    <span>Total Invested: {formatCurrency(selectedPosition.totalInvested)}</span>
                                </div>
                                <div className="info-item">
                                    <span>Profit: {formatCurrency(selectedPosition.totalProfit)} ({formatPercentage(selectedPosition.totalProfitPercentage)})</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Amount to Add (USDT)</label>
                                <input
                                    type="number"
                                    value={addFundsAmount}
                                    onChange={(e) => setAddFundsAmount(Number(e.target.value))}
                                    min={1}
                                    step="0.01"
                                    placeholder="Enter amount to add"
                                />
                                {typeof userUSDTBalance === 'number' && (
                                    <small style={{ display: 'block', marginTop: 8 }}>
                                        Your USDT Balance: {formatCurrency(userUSDTBalance)}
                                    </small>
                                )}
                            </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button 
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    boxShadow: '0 0 0 1px var(--secondary)',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 0',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowAddFundsModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                style={{
                                    flex: 1,
                                    background: (actionLoading || addFundsAmount <= 0) ? 'rgba(120,140,180,0.3)' : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 0',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                    cursor: (actionLoading || addFundsAmount <= 0) ? 'not-allowed' : 'pointer',
                                    opacity: (actionLoading || addFundsAmount <= 0) ? 0.6 : 1,
                                    boxShadow: (actionLoading || addFundsAmount <= 0) ? 'none' : 'var(--card-shadow)',
                                    letterSpacing: 0.5
                                }}
                                disabled={actionLoading || addFundsAmount <= 0}
                                onClick={handleAddFunds}
                            >
                                {actionLoading ? 'Adding...' : 'Add Funds'}
                            </button>
                        </div>
                </UnifiedModal>
            )}

            {/* Withdraw Funds Modal */}
            {showWithdrawModal && selectedPosition && (
                <UnifiedModal
                    isOpen={true}
                    onClose={() => setShowWithdrawModal(false)}
                    title={`Withdraw from ${selectedPosition.copyTraderId?.name}`}
                >
                            <div className="position-info">
                                <div className="info-item">
                                    <span>Available to Withdraw: {formatCurrency(selectedPosition.currentAmount)}</span>
                                </div>
                                <div className="info-item">
                                    <span>Total Invested: {formatCurrency(selectedPosition.totalInvested)}</span>
                                </div>
                                <div className="info-item">
                                    <span>Profit: {formatCurrency(selectedPosition.totalProfit)} ({formatPercentage(selectedPosition.totalProfitPercentage)})</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Amount to Withdraw (USDT)</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                                    min={1}
                                    max={selectedPosition.currentAmount}
                                    step="0.01"
                                    placeholder="Enter amount to withdraw"
                                />
                                <small>Maximum: {formatCurrency(selectedPosition.currentAmount)}</small>
                            </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button 
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    boxShadow: '0 0 0 1px var(--secondary)',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 0',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowWithdrawModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                style={{
                                    flex: 1,
                                    background: (actionLoading || withdrawAmount <= 0 || withdrawAmount > selectedPosition.currentAmount) ? 'rgba(120,140,180,0.3)' : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 0',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                    cursor: (actionLoading || withdrawAmount <= 0 || withdrawAmount > selectedPosition.currentAmount) ? 'not-allowed' : 'pointer',
                                    opacity: (actionLoading || withdrawAmount <= 0 || withdrawAmount > selectedPosition.currentAmount) ? 0.6 : 1,
                                    boxShadow: (actionLoading || withdrawAmount <= 0 || withdrawAmount > selectedPosition.currentAmount) ? 'none' : 'var(--card-shadow)',
                                    letterSpacing: 0.5
                                }}
                                disabled={actionLoading || withdrawAmount <= 0 || withdrawAmount > selectedPosition.currentAmount}
                                onClick={handleWithdrawFunds}
                            >
                                {actionLoading ? 'Withdrawing...' : 'Withdraw'}
                            </button>
                        </div>
                </UnifiedModal>
            )}

            {/* Settings Modal */}
            {showSettingsModal && selectedPosition && (
                <UnifiedModal
                    isOpen={true}
                    onClose={() => setShowSettingsModal(false)}
                    title={`Position Settings - ${selectedPosition.copyTraderId?.name}`}
                >
                            <div className="position-info">
                                <div className="info-item">
                                    <span>Current Value: {formatCurrency(selectedPosition.currentAmount)}</span>
                                </div>
                                <div className="info-item">
                                    <span>Profit: {formatCurrency(selectedPosition.totalProfit)} ({formatPercentage(selectedPosition.totalProfitPercentage)})</span>
                                </div>
                            </div>

                            {/* Position settings removed - risk management features removed */}
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                <button 
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        boxShadow: '0 0 0 1px var(--secondary)',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '8px 0',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowSettingsModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    style={{
                                        flex: 1,
                                        background: actionLoading ? 'rgba(120,140,180,0.3)' : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '8px 0',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        opacity: actionLoading ? 0.6 : 1,
                                        boxShadow: actionLoading ? 'none' : 'var(--card-shadow)',
                                        letterSpacing: 0.5
                                    }}
                                    disabled={actionLoading}
                                    onClick={handleUpdateSettings}
                                >
                                    {actionLoading ? 'Updating...' : 'Update Settings'}
                                </button>
                            </div>
                </UnifiedModal>
            )}
        </div>
        
        {/* CSS Animations */}
        <style>{`
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    transform: translateY(30px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `}</style>
        </>
    );
};

export default CopyTrading;
