import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../ThemeContext';
import { QRCodeSVG } from 'qrcode.react';
import UnifiedModal from '../components/UnifiedModal';

const API = process.env.REACT_APP_API_BASE_URL;

interface AgentStats {
    isAgent: boolean;
    agentCode?: string;
    credits: number;
    referralStats: {
        totalSignups: number;
        totalDeposits: number;
        totalCreditsEarned: number;
    };
    referralLink?: string;
}

const Agent: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme ? useTheme() : { theme: 'light' };
    const [loading, setLoading] = useState(true);
    const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    
    // Credit modal state
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [creditError, setCreditError] = useState('');
    const [creditSuccess, setCreditSuccess] = useState('');
    const [loadingCredits, setLoadingCredits] = useState(false);

    useEffect(() => {
        loadAgentStats();
    }, []);

    // Helper to clear cache for agent data
    const clearAgentCache = () => {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith('tradespot_agent_')) {
                sessionStorage.removeItem(key);
            }
        });
    };

    // Load agent stats with caching
    const loadAgentStats = async () => {
        try {
            setLoading(true);
            setError('');

            // Check cache first
            const cacheTimestampKey = 'tradespot_agent_timestamp';
            const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);
            const CACHE_DURATION = 60000; // 60 seconds

            let useCache = false;
            if (cachedTimestamp) {
                const age = Date.now() - parseInt(cachedTimestamp, 10);
                useCache = age < CACHE_DURATION;
            }

            if (useCache) {
                // Load from cache
                const statsCache = sessionStorage.getItem('tradespot_agent_stats');
                if (statsCache) {
                    try {
                        const statsData = JSON.parse(statsCache);
                        setAgentStats(statsData);
                        setLoading(false);

                        // Fetch fresh data in background
                        fetchAgentStats(false);
                        return;
                    } catch (e) {
                        console.warn('Failed to parse agent stats cache');
                    }
                }
            }

            // No cache or expired - fetch fresh data
            await fetchAgentStats(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load agent stats');
            setLoading(false);
        }
    };

    // Fetch agent stats
    const fetchAgentStats = async (showLoading: boolean = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API}/api/agent/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const statsData = response.data;
            setAgentStats(statsData);

            // Cache the data
            sessionStorage.setItem('tradespot_agent_stats', JSON.stringify(statsData));
            sessionStorage.setItem('tradespot_agent_timestamp', Date.now().toString());
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch agent stats');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const handleBecomeAgent = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.post(`${API}/api/agent/become-agent`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Clear cache since data changed
            clearAgentCache();

            const statsData = response.data;
            setAgentStats(statsData);

            // Cache the new data
            sessionStorage.setItem('tradespot_agent_stats', JSON.stringify(statsData));
            sessionStorage.setItem('tradespot_agent_timestamp', Date.now().toString());
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to become an agent');
        }
    };

    const copyReferralLink = () => {
        if (!agentStats?.referralLink) return;

        navigator.clipboard.writeText(agentStats.referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Function to handle credit redemption
    const handleRedeemCredits = async () => {
        setCreditError('');
        setCreditSuccess('');

        if (!agentStats?.isAgent) {
            setCreditError('You are not an agent');
            return;
        }

        if (!agentStats?.credits || agentStats.credits <= 0) {
            setCreditError('No credits to redeem');
            return;
        }

        if (!window.confirm(`Are you sure you want to redeem ${agentStats.credits} credits for USDT?`)) {
            return;
        }

        setLoadingCredits(true);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            await axios.post(`${API}/api/agent/redeem`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCreditSuccess('Credits redeemed successfully! USDT has been credited to your account.');
            
            // Refresh agent stats to get updated credits balance
            clearAgentCache();
            await fetchAgentStats(false);
            
        } catch (err: any) {
            setCreditError(err.response?.data?.error || 'Failed to redeem credits');
        } finally {
            setLoadingCredits(false);
        }
    };

    // Function to open credit modal
    const openCreditModal = () => {
        setShowCreditModal(true);
        setCreditError('');
        setCreditSuccess('');
    };

    if (loading) {
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
                        font-weight: 700;
                        letter-spacing: 2px;
                        display: inline-block;
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
                    <div style={{ padding: '0', textAlign: 'center', color: 'var(--text)' }}>
                        <p style={{ fontSize: '0.85rem' }}><span className="loading-dots">...</span></p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div style={{
            background: 'var(--bg)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            padding: window.innerWidth <= 768 ? '4px' : '20px',
            width: '100%',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            
            {/* Error Message */}
            {error && (
                <div style={{ 
                    color: 'var(--error-color, #e74c3c)', 
                    background: 'var(--card-bg)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textAlign: 'center',
                    maxWidth: '600px',
                    width: '100%'
                }}>
                    {error}
                </div>
            )}

            {!agentStats?.isAgent ? (
                <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: 'var(--card-bg)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: 'var(--card-shadow)'
                }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--text)' }}>
                        Become an Agent
                    </h2>
                    <p style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Join as an agent to earn credits when users deposit using your referral link!
                    </p>
                    <button 
                        onClick={handleBecomeAgent} 
                        style={{
                            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            fontSize: '0.9rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontWeight: 600
                        }}
                    >
                        Become an Agent
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="agent-stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '8px'
                    }}>
                        <div style={{
                            background: 'var(--card-bg)',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: 'var(--card-shadow)',
                            textAlign: 'center',
                            border: 'none'
                        }}>
                            <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Credits Balance
                            </h3>
                            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', margin: '4px 0' }}>
                                {agentStats.credits}
                            </p>
                            <button
                                onClick={openCreditModal}
                                disabled={!agentStats.credits || agentStats.credits <= 0}
                                style={{
                                    background: (!agentStats.credits || agentStats.credits <= 0)
                                        ? (theme === 'dark' ? '#444' : '#ccc')
                                        : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '0.65rem',
                                    fontWeight: 500,
                                    cursor: (!agentStats.credits || agentStats.credits <= 0) ? 'not-allowed' : 'pointer',
                                    opacity: (!agentStats.credits || agentStats.credits <= 0) ? 0.6 : 1,
                                    marginTop: '6px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Redeem Credits
                            </button>
                        </div>

                        <div style={{
                            background: 'var(--card-bg)',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: 'var(--card-shadow)',
                            textAlign: 'center',
                            border: 'none'
                        }}>
                            <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Total Signups
                            </h3>
                            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', margin: '4px 0' }}>
                                {agentStats.referralStats.totalSignups}
                            </p>
                        </div>

                        <div style={{
                            background: 'var(--card-bg)',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: 'var(--card-shadow)',
                            textAlign: 'center',
                            border: 'none'
                        }}>
                            <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Total Deposits
                            </h3>
                            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', margin: '4px 0' }}>
                                {agentStats.referralStats.totalDeposits}
                            </p>
                        </div>

                        <div style={{
                            background: 'var(--card-bg)',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: 'var(--card-shadow)',
                            textAlign: 'center',
                            border: 'none'
                        }}>
                            <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Credits Earned
                            </h3>
                            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', margin: '4px 0' }}>
                                {agentStats.referralStats.totalCreditsEarned}
                            </p>
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--card-bg)',
                        padding: '12px',
                        borderRadius: '8px',
                        boxShadow: 'var(--card-shadow)',
                        border: 'none'
                    }}>
                        <h3 style={{ marginBottom: '8px', color: 'var(--text)', fontSize: '0.9rem' }}>
                            Your Referral Link
                        </h3>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <input 
                                type="text" 
                                value={agentStats.referralLink || ''} 
                                readOnly 
                                style={{
                                    flex: 1,
                                    padding: '8px 10px',
                                    border: '1px solid var(--secondary)',
                                    borderRadius: '5px',
                                    fontSize: '0.8rem',
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                    minWidth: '150px'
                                }}
                            />
                            <button 
                                onClick={copyReferralLink}
                                style={{
                                    background: copied ? 'var(--success-color, #10c98f)' : 'var(--secondary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '36px',
                                    height: '36px'
                                }}
                            >
                                {copied ? '✓' : '📋'}
                            </button>
                            <button
                                onClick={() => setShowQRCode(!showQRCode)}
                                style={{
                                    background: showQRCode 
                                        ? 'linear-gradient(135deg, #f7931a, #f5a742)' 
                                        : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '36px',
                                    height: '36px'
                                }}
                            >
                                📱
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            Share this link with others. When they make deposits, you earn credits!
                        </p>
                    </div>

                    <div style={{
                        background: 'var(--card-bg)',
                        padding: '12px',
                        borderRadius: '8px',
                        boxShadow: 'var(--card-shadow)',
                        border: 'none'
                    }}>
                        <h3 style={{ marginBottom: '8px', color: 'var(--text)', fontSize: '0.9rem' }}>
                            How It Works
                        </h3>
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            <li style={{ padding: '6px 0', borderBottom: '1px solid var(--secondary)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Share Your Link: Share your unique referral link with others
                            </li>
                            <li style={{ padding: '6px 0', borderBottom: '1px solid var(--secondary)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Earn Credits: Get credits when referred users make deposits (0.1 credits per USDT)
                            </li>
                            <li style={{ padding: '6px 0', borderBottom: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Redeem Credits: Convert your credits to USDT anytime
                            </li>
                        </ul>
                    </div>
                </div>
            )} // Added closing brace here

            {/* Credit Modal */}
            <UnifiedModal
                isOpen={showCreditModal}
                onClose={() => {
                    setShowCreditModal(false);
                    setCreditError('');
                    setCreditSuccess('');
                }}
                title="Redeem Credits"
                subtitle="Convert your credits to USDT instantly."
            >
                <div style={{ padding: '18px 20px 18px 20px', boxSizing: 'border-box' }}>
                    {/* Credits Balance */}
                    <div style={{ marginBottom: 10, fontWeight: 600, color: theme === 'dark' ? '#fff' : '#1e3c72', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Your Credits Balance:</span>
                        {loadingCredits ? (
                            <span className="loading-dots" style={{ color: theme === 'dark' ? '#d1d5db' : '#2a5298', fontWeight: 700 }}>
                                ....
                            </span>
                        ) : (
                            <span style={{ color: '#2a5298', fontWeight: 700 }}>{agentStats?.credits || 0}</span>
                        )}
                    </div>

                    {/* Conversion Rate Info */}
                    <div style={{ 
                        background: theme === 'dark' ? 'rgba(16,201,143,0.1)' : 'rgba(16,201,143,0.05)', 
                        border: '1px solid rgba(16,201,143,0.2)', 
                        padding: '10px', 
                        borderRadius: 8, 
                        marginBottom: 15,
                        fontSize: '0.8rem',
                        color: theme === 'dark' ? '#10c98f' : '#10c98f'
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Conversion Rate</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>1 Credit = 0.1 USDT</div>
                        {agentStats?.credits && agentStats.credits > 0 && (
                            <div style={{ marginTop: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                                You will receive: {(agentStats.credits * 0.1).toFixed(2)} USDT
                            </div>
                        )}
                    </div>

                    {/* Not Agent Warning */}
                    {!agentStats?.isAgent && !loadingCredits && (
                        <div style={{ 
                            background: 'rgba(231,76,60,0.08)', 
                            border: '1px solid rgba(231,76,60,0.12)', 
                            color: '#e74c3c', 
                            padding: '12px', 
                            borderRadius: 8, 
                            marginBottom: 12,
                            fontSize: '0.8rem'
                        }}>
                            You need to become an agent first to earn and redeem credits.
                        </div>
                    )}

                    {/* No Credits Warning */}
                    {agentStats?.isAgent && (!agentStats?.credits || agentStats.credits <= 0) && !loadingCredits && (
                        <div style={{ 
                            background: 'rgba(255,193,7,0.08)', 
                            border: '1px solid rgba(255,193,7,0.12)', 
                            color: '#ffc107', 
                            padding: '12px', 
                            borderRadius: 8, 
                            marginBottom: 12,
                            fontSize: '0.8rem'
                        }}>
                            You don't have any credits to redeem.
                        </div>
                    )}

                    {/* Error / Success */}
                    {creditError && <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.12)', color: '#e74c3c', padding: '8px 10px', borderRadius: 8, marginBottom: 12 }}>{creditError}</div>}
                    {creditSuccess && <div style={{ background: 'rgba(16,201,143,0.08)', border: '1px solid rgba(16,201,143,0.12)', color: '#10c98f', padding: '8px 10px', borderRadius: 8, marginBottom: 12 }}>{creditSuccess}</div>}

                    {/* Action row: Close + Redeem */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreditModal(false);
                                setCreditError('');
                                setCreditSuccess('');
                            }}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                background: theme === 'dark' ? '#2f3746' : '#f3f4f6',
                                color: theme === 'dark' ? '#fff' : '#25324B',
                                border: '1px solid rgba(120,140,180,0.12)',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontWeight: "500",
                                fontSize: "0.75rem",
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>

                        <button
                            onClick={handleRedeemCredits}
                            disabled={!agentStats?.isAgent || !agentStats?.credits || agentStats.credits <= 0 || loadingCredits}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                background: (!agentStats?.isAgent || !agentStats?.credits || agentStats.credits <= 0 || loadingCredits) 
                                    ? (theme === 'dark' ? '#444' : '#ccc')
                                    : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                cursor: (!agentStats?.isAgent || !agentStats?.credits || agentStats.credits <= 0 || loadingCredits) ? 'not-allowed' : 'pointer',
                                boxShadow: (!agentStats?.isAgent || !agentStats?.credits || agentStats.credits <= 0 || loadingCredits) ? 'none' : 'var(--card-shadow)',
                                opacity: (!agentStats?.isAgent || !agentStats?.credits || agentStats.credits <= 0 || loadingCredits) ? 0.6 : 1
                            }}
                        >
                            {loadingCredits ? 'Processing...' : 'Redeem Credits'}
                        </button>
                    </div>
                </div>
            </UnifiedModal>

            {/* QR Code Modal Overlay */}
            {showQRCode && agentStats?.referralLink && (
                <div 
                    onClick={() => setShowQRCode(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        animation: 'fadeIn 0.15s ease',
                        padding: '20px'
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--card-bg)',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            textAlign: 'center',
                            maxWidth: '240px',
                            width: '100%',
                            animation: 'slideUp 0.15s ease',
                            border: '2px solid var(--primary)'
                        }}
                    >
                        <h3 style={{ 
                            margin: 0, 
                            color: 'var(--text)', 
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            marginBottom: '8px'
                        }}>
                            📱 QR Code
                        </h3>
                        
                        <div style={{ 
                            background: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <QRCodeSVG 
                                value={agentStats?.referralLink || ''}
                                size={150}
                                level="H"
                                includeMargin={true}
                                bgColor="#ffffff"
                                fgColor="#000000"
                            />
                        </div>
                        
                        <p style={{ 
                            color: 'var(--text-secondary)', 
                            fontSize: '0.7rem',
                            margin: 0,
                            lineHeight: '1.3'
                        }}>
                            Scan to share
                        </p>
                    </div>
                </div>
            )}

            {/* Mobile Responsive Styles */}
            <style>
                {`
                /* Hide scrollbars completely */
                * {
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* Internet Explorer 10+ */
                }
                
                *::-webkit-scrollbar {
                    width: 0px;
                    height: 0px;
                    background: transparent; /* Chrome/Safari/Webkit */
                }

                *::-webkit-scrollbar-track {
                    background: transparent;
                }

                *::-webkit-scrollbar-thumb {
                    background: transparent;
                }

                *::-webkit-scrollbar-corner {
                    background: transparent;
                }
                
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
                `}
            </style>

            <style>
                {`
                    @media (max-width: 768px) {
                        div[style*="padding: 12px"] {
                            padding: 8px !important;
                        }
                        
                        div[style*="font-size: 1.1rem"] {
                            font-size: 0.95rem !important;
                        }
                        
                        div[style*="font-size: 0.85rem"] {
                            font-size: 0.75rem !important;
                        }

                        .agent-stats-grid {
                            display: flex !important;
                            overflow-x: auto;
                            gap: 8px !important;
                            scroll-snap-type: x mandatory;
                            -webkit-overflow-scrolling: touch;
                        }

                        .agent-stats-grid > div {
                            min-width: 140px !important;
                            flex-shrink: 0;
                            scroll-snap-align: start;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        div[style*="padding: 12px"] {
                            padding: 6px !important;
                        }
                        
                        div[style*="font-size: 1.1rem"] {
                            font-size: 0.9rem !important;
                        }

                        .agent-stats-grid {
                            display: flex !important;
                            overflow-x: auto;
                            gap: 8px !important;
                            scroll-snap-type: x mandatory;
                            -webkit-overflow-scrolling: touch;
                        }

                        .agent-stats-grid > div {
                            min-width: 140px !important;
                            flex-shrink: 0;
                            scroll-snap-align: start;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default Agent;