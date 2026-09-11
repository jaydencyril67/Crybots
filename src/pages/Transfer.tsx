import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { transferUSDT, convertCurrency } from '../services/api';
import { useExchangeRates } from '../hooks/usePrices';
import TabFilter from '../components/TabFilter';

interface TransferHistory {
    transfers: Array<{
        _id: string;
        amount: number;
        currency: string;
        type: 'sent' | 'received';
        recipient?: string;
        sender?: string;
        status: string;
        createdAt: string;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const Transfer: React.FC = () => {
    const { theme } = useTheme();
    const [transferType, setTransferType] = useState<'send' | 'receive'>('send');
    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [transferHistory, setTransferHistory] = useState<TransferHistory | null>(null);
    const [userBalance, setUserBalance] = useState({ usdt: 0, btc: 0 });

    // Email/SpotID toggle states
    const [recipientType, setRecipientType] = useState<'email' | 'spotid'>('email');
    const [transferEmail, setTransferEmail] = useState('');
    const [transferSpotId, setTransferSpotId] = useState('');
    const [recipientEmailValid, setRecipientEmailValid] = useState<null | boolean>(null);
    const [recipientSpotIdValid, setRecipientSpotIdValid] = useState<null | boolean>(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [checkingSpotId, setCheckingSpotId] = useState(false);
    const emailCheckTimeout = useRef<NodeJS.Timeout | null>(null);
    const spotIdCheckTimeout = useRef<NodeJS.Timeout | null>(null);

    // Convert section states
    const [convertFromCurrency, setConvertFromCurrency] = useState<'USDT' | 'BTC'>('USDT');
    const [convertToCurrency, setConvertToCurrency] = useState<'USDT' | 'BTC'>('BTC');
    const [convertAmount, setConvertAmount] = useState('');
    const [convertLoading, setConvertLoading] = useState(false);
    const [convertError, setConvertError] = useState('');
    const [convertSuccess, setConvertSuccess] = useState('');

    // Use centralized exchange rates
    const { rates: exchangeRate, loading: loadingRate } = useExchangeRates();

    // Tab state
    const [activeTab, setActiveTab] = useState<'transfer' | 'convert'>('transfer');

    useEffect(() => {
        fetchUserBalance();
    }, []);

    const fetchUserBalance = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/statistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserBalance({
                    usdt: data.statistics?.currentBalance?.usdt || 0,
                    btc: data.statistics?.currentBalance?.btc || 0
                });
            }
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        }
    };


    // Live check for recipient email existence
    useEffect(() => {
        setRecipientEmailValid(null);
        if (!transferEmail || !transferEmail.includes('@')) return;
        if (emailCheckTimeout.current) clearTimeout(emailCheckTimeout.current);
        setCheckingEmail(true);
        emailCheckTimeout.current = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
                const resp = await fetch(`${API_BASE}/api/check-email-exists`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ email: transferEmail })
                });
                const data = await resp.json();
                setRecipientEmailValid(!!data.exists);
            } catch {
                setRecipientEmailValid(null);
            } finally {
                setCheckingEmail(false);
            }
        }, 500); // debounce 500ms
    }, [transferEmail]);

    // Live check for recipient spotid existence
    useEffect(() => {
        setRecipientSpotIdValid(null);
        if (!transferSpotId || transferSpotId.trim().length < 3) return;
        if (spotIdCheckTimeout.current) clearTimeout(spotIdCheckTimeout.current);
        setCheckingSpotId(true);
        spotIdCheckTimeout.current = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
                const resp = await fetch(`${API_BASE}/api/check-spotid-exists`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ spotid: transferSpotId })
                });
                const data = await resp.json();
                setRecipientSpotIdValid(!!data.exists);
            } catch {
                setRecipientSpotIdValid(null);
            } finally {
                setCheckingSpotId(false);
            }
        }, 500); // debounce 500ms
    }, [transferSpotId]);

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate recipient based on type
        if (recipientType === 'email') {
            if (!transferEmail.trim()) {
                setError('Please enter recipient email');
                return;
            }
            if (recipientEmailValid === false) {
                setError('Recipient email not found');
                return;
            }
            if (recipientEmailValid === null && transferEmail.includes('@')) {
                setError('Please wait for email validation');
                return;
            }
        } else {
            if (!transferSpotId.trim()) {
                setError('Please enter recipient Spot ID');
                return;
            }
            if (recipientSpotIdValid === false) {
                setError('Recipient Spot ID not found');
                return;
            }
            if (recipientSpotIdValid === null && transferSpotId.length >= 3) {
                setError('Please wait for Spot ID validation');
                return;
            }
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        const transferAmount = parseFloat(amount);
        const maxAmount = userBalance.usdt;

        if (transferAmount > maxAmount) {
            setError(`Insufficient balance. Available: ${maxAmount.toFixed(2)} USDT`);
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }


            const recipientEmail = recipientType === 'email' ? transferEmail.trim() : null;
            const recipientSpotIdVal = recipientType === 'spotid' ? transferSpotId.trim() : null;
            
            const result = await transferUSDT(recipientEmail, recipientSpotIdVal, transferAmount, '', undefined);
            
            const recipientDisplay = recipientType === 'email' ? transferEmail : transferSpotId;
            setSuccess(`Successfully transferred ${transferAmount} USDT to ${recipientDisplay}`);
            
            // Clear form fields
            setTransferEmail('');
            setTransferSpotId('');
            setAmount('');
            setNote('');
            setRecipientEmailValid(null);
            setRecipientSpotIdValid(null);
            
            // Refresh balance
            fetchUserBalance();
        } catch (err: any) {
            console.error('Transfer error:', err);
            setError(err.message || 'Transfer failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConvert = async (e: React.FormEvent) => {
        e.preventDefault();
        setConvertError('');
        setConvertSuccess('');

        if (!convertAmount || parseFloat(convertAmount) <= 0) {
            setConvertError('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(convertAmount);
        const maxAmount = convertFromCurrency === 'USDT' ? userBalance.usdt : userBalance.btc;

        if (amount > maxAmount) {
            setConvertError(`Insufficient balance. Available: ${maxAmount.toFixed(8)} ${convertFromCurrency}`);
            return;
        }

        setConvertLoading(true);

        try {
            const result = await convertCurrency(convertFromCurrency, convertToCurrency, amount);
            
            setConvertSuccess(`Successfully converted ${amount} ${convertFromCurrency} to ${result.conversion.toAmount.toFixed(8)} ${convertToCurrency}`);
            
            // Update balance display
            setUserBalance(result.newBalances);
            
            // Clear form
            setConvertAmount('');
            
        } catch (err: any) {
            console.error('Conversion error:', err);
            setConvertError(err.message || 'Conversion failed. Please try again.');
        } finally {
            setConvertLoading(false);
        }
    };

    const swapCurrencies = () => {
        setConvertFromCurrency(convertToCurrency);
        setConvertToCurrency(convertFromCurrency);
        setConvertAmount('');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatCurrency = (amount: number, decimals: number = 2) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'failed':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    return (
        <>
            <style>{`
                @media (max-width: 768px) {
                    .transfer-container {
                        padding: 0.25rem !important;
                    }
                }
                @media (max-width: 480px) {
                    .transfer-container {
                        padding: 0.125rem !important;
                    }
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

                {/* Error/Success Messages */}
                {error && (
                    <div style={{
                        padding: '12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>❌</span> {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '12px',
                        background: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>✅</span> {success}
                    </div>
                )}

                {/* Tab Navigation */}
                <TabFilter
                    tabs={[
                        { id: 'transfer', label: '💸 Transfer' },
                        { id: 'convert', label: '🔄 Convert' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={(tabId) => setActiveTab(tabId as 'transfer' | 'convert')}
                />

                <div style={{
                    marginTop: '12px'
                }}>
                    {/* Transfer Tab Content */}
                    {activeTab === 'transfer' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '8px'
                    }}>
                    {/* Transfer Form */}
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '10px',
                        padding: '12px',
                        boxShadow: 'var(--card-shadow)',
                        border: '1px solid transparent'
                    }}>
                        <div style={{
                            marginBottom: '12px'
                        }}>
                            <h2 style={{
                                color: 'var(--text)',
                                fontSize: '0.8rem',
                                margin: '0',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}><span>💸</span>Send Transfer</h2>
                        </div>

                        <form onSubmit={handleTransfer} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {/* Recipient Type Toggle */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <div style={{ marginBottom: 6 }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>Recipient:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', background: theme === 'dark' ? '#333' : '#f0f0f0', borderRadius: 6, padding: 2, width: '100%' }}>
                                        <button
                                            type="button"
                                            onClick={() => { setTransferEmail(''); setTransferSpotId(''); setRecipientType('email'); }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: 8,
                                                border: recipientType === 'email' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(120,140,180,0.06)',
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: recipientType === 'email' ? (theme === 'dark' ? 'linear-gradient(135deg, #2a5298, #25324B)' : '#e6f0ff') : 'transparent',
                                                color: recipientType === 'email' ? (theme === 'dark' ? 'white' : '#25324B') : (theme === 'dark' ? '#ccc' : '#666'),
                                                boxShadow: recipientType === 'email' ? 'var(--card-shadow)' : 'none',
                                                transition: 'all 0.12s ease'
                                            }}
                                        >
                                            Email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setTransferEmail(''); setTransferSpotId(''); setRecipientType('spotid'); }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: 8,
                                                border: recipientType === 'spotid' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(120,140,180,0.06)',
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: recipientType === 'spotid' ? (theme === 'dark' ? 'linear-gradient(135deg, #2a5298, #25324B)' : '#e6f0ff') : 'transparent',
                                                color: recipientType === 'spotid' ? (theme === 'dark' ? 'white' : '#25324B') : (theme === 'dark' ? '#ccc' : '#666'),
                                                boxShadow: recipientType === 'spotid' ? 'var(--card-shadow)' : 'none',
                                                transition: 'all 0.12s ease'
                                            }}
                                        >
                                            SpotID
                                        </button>
                                    </div>
                                </div>
                                {recipientType === 'email' ? (
                                    <div>
                                        <input
                                            type="email"
                                            value={transferEmail}
                                            onChange={e => { setTransferEmail(e.target.value); setTransferSpotId(''); }}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg)',
                                                color: 'var(--text)',
                                                fontSize: '0.85rem',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box'
                                            }}
                                            placeholder="Enter recipient email"
                                            disabled={loading}
                                        />
                                        {transferEmail && (
                                            <div style={{ fontSize: 12, marginTop: 6, minHeight: 18, color: theme === 'dark' ? '#fff' : '#374151' }}>
                                                {checkingEmail ? (
                                                    <span style={{ color: '#888' }}>Checking...</span>
                                                ) : recipientEmailValid === true ? (
                                                    <span style={{ color: '#10c98f' }}>Verified✓</span>
                                                ) : recipientEmailValid === false ? (
                                                    <span style={{ color: '#e74c3c' }}>Invalid✕</span>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="text"
                                            value={transferSpotId}
                                            onChange={e => { setTransferSpotId(e.target.value); setTransferEmail(''); }}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg)',
                                                color: 'var(--text)',
                                                fontSize: '0.85rem',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box'
                                            }}
                                            placeholder="Enter recipient SpotID"
                                            disabled={loading}
                                        />
                                        {transferSpotId && (
                                            <div style={{ fontSize: 12, marginTop: 6, minHeight: 18, color: theme === 'dark' ? '#fff' : '#374151' }}>
                                                {checkingSpotId ? (
                                                    <span style={{ color: '#888' }}>Checking...</span>
                                                ) : recipientSpotIdValid === true ? (
                                                    <span style={{ color: '#10c98f' }}>Verified✓</span>
                                                ) : recipientSpotIdValid === false ? (
                                                    <span style={{ color: '#e74c3c' }}>Invalid✕</span>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <label htmlFor="amount" style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--text)'
                                }}>Amount (USDT)</label>
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount in USDT"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                    disabled={loading}
                                />
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-secondary)',
                                    marginTop: '4px'
                                }}>
                                    Available: ${formatCurrency(userBalance.usdt)} USDT
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <label htmlFor="note" style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--text)'
                                }}>Note (Optional)</label>
                                <textarea
                                    id="note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add a note to your transfer"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                    rows={3}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    background: loading ? 'var(--text-secondary)' : 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Send Transfer'}
                            </button>
                        </form>
                    </div>
                    </div>
                    )}

                    {/* Convert Tab Content */}
                    {activeTab === 'convert' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                    {/* Convert Section */}
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '10px',
                        padding: '12px',
                        boxShadow: 'var(--card-shadow)',
                        border: '1px solid transparent'
                    }}>
                        <div style={{
                            marginBottom: '12px'
                        }}>
                            <h2 style={{
                                color: 'var(--text)',
                                fontSize: '0.8rem',
                                margin: '0',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}><span>🔄</span>Convert Currency</h2>
                        </div>

                        {/* Error/Success Messages for Convert */}
                        {convertError && (
                            <div style={{
                                padding: '8px 12px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '6px',
                                marginBottom: '12px',
                                fontSize: '0.75rem'
                            }}>
                                ❌ {convertError}
                            </div>
                        )}

                        {convertSuccess && (
                            <div style={{
                                padding: '8px 12px',
                                background: '#d1fae5',
                                color: '#065f46',
                                borderRadius: '6px',
                                marginBottom: '12px',
                                fontSize: '0.75rem'
                            }}>
                                ✅ {convertSuccess}
                            </div>
                        )}

                        <form onSubmit={handleConvert} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {/* Exchange Rate Display */}
                            {exchangeRate && (
                                <div style={{
                                    padding: '8px 12px',
                                    background: theme === 'dark' ? 'rgba(16, 201, 143, 0.1)' : 'rgba(16, 201, 143, 0.05)',
                                    border: '1px solid rgba(16, 201, 143, 0.2)',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: '#10c98f'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Live Exchange Rate</div>
                                    <div>1 BTC = ${formatCurrency(exchangeRate.btcToUsdt, 2)} USDT</div>
                                    <div>1 USDT = {exchangeRate.usdtToBtc.toFixed(8)} BTC</div>
                                    {loadingRate && <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Updating...</div>}
                                </div>
                            )}

                            {/* Currency Selection */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text)',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>From</label>
                                    <div
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg)',
                                            color: 'var(--text)',
                                            fontSize: '0.75rem',
                                            fontFamily: 'inherit',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            opacity: convertLoading ? 0.5 : 1
                                        }}
                                    >
                                        {convertFromCurrency}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={swapCurrencies}
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        marginTop: '16px'
                                    }}
                                    disabled={convertLoading}
                                >
                                    ⇄
                                </button>

                                <div style={{ flex: 1 }}>
                                    <label style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text)',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>To</label>
                                    <div
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg)',
                                            color: 'var(--text)',
                                            fontSize: '0.75rem',
                                            fontFamily: 'inherit',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            opacity: convertLoading ? 0.5 : 1
                                        }}
                                    >
                                        {convertToCurrency}
                                    </div>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--text)',
                                    display: 'block',
                                    marginBottom: '4px'
                                }}>Amount ({convertFromCurrency})</label>
                                <input
                                    type="number"
                                    step={convertFromCurrency === 'BTC' ? '0.00000001' : '0.01'}
                                    value={convertAmount}
                                    onChange={(e) => setConvertAmount(e.target.value)}
                                    placeholder={`Enter amount in ${convertFromCurrency}`}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                    disabled={convertLoading}
                                />
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-secondary)',
                                    marginTop: '4px'
                                }}>
                                    Available: {formatCurrency(
                                        convertFromCurrency === 'USDT' ? userBalance.usdt : userBalance.btc,
                                        convertFromCurrency === 'BTC' ? 8 : 2
                                    )} {convertFromCurrency}
                                </div>
                            </div>

                            {/* Conversion Preview */}
                            {convertAmount && exchangeRate && parseFloat(convertAmount) > 0 && (
                                <div style={{
                                    padding: '8px 12px',
                                    background: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Conversion Preview</div>
                                    <div style={{ color: 'var(--text)' }}>
                                        {parseFloat(convertAmount)} {convertFromCurrency} ≈{' '}
                                        {convertFromCurrency === 'USDT' 
                                            ? (parseFloat(convertAmount) * exchangeRate.usdtToBtc).toFixed(8)
                                            : (parseFloat(convertAmount) * exchangeRate.btcToUsdt).toFixed(2)
                                        } {convertToCurrency}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                style={{
                                    background: convertLoading ? 'var(--text-secondary)' : 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: convertLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                disabled={convertLoading || !convertAmount || parseFloat(convertAmount) <= 0}
                            >
                                {convertLoading ? 'Converting...' : `Convert ${convertFromCurrency} to ${convertToCurrency}`}
                            </button>
                        </form>
                    </div>
                    </div>
                    )}
                </div>

                {/* Transfer History */}
                {transferHistory && transferHistory.transfers.length > 0 && (
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '10px',
                        padding: '12px',
                        boxShadow: 'var(--card-shadow)',
                        border: '1px solid transparent',
                        marginTop: '12px'
                    }}>
                        <h2 style={{
                            color: 'var(--text)',
                            fontSize: '0.8rem',
                            margin: '0 0 12px 0',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}><span>📊</span>Recent Transfers</h2>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            maxHeight: '280px',
                            overflowY: 'auto',
                            paddingRight: '4px'
                        }}>
                            {transferHistory.transfers.map((transfer) => (
                                <div key={transfer._id} style={{
                                    background: 'var(--bg)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <div>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background: transfer.type === 'sent' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: transfer.type === 'sent' ? '#ef4444' : '#10b981'
                                            }}>
                                                {transfer.type === 'sent' ? '↗️ Sent' : '↘️ Received'}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontWeight: 600,
                                            color: transfer.type === 'sent' ? '#ef4444' : '#10b981',
                                            fontSize: '0.85rem'
                                        }}>
                                            {transfer.type === 'sent' ? '-' : '+'}{transfer.amount} {transfer.currency}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.7rem'
                                        }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                                                {transfer.type === 'sent' ? 'To:' : 'From:'}
                                            </span>
                                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                                                {transfer.type === 'sent' ? transfer.recipient : transfer.sender}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.7rem'
                                        }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Date:</span>
                                            <span style={{ color: 'var(--text)' }}>{formatDate(transfer.createdAt)}</span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.7rem'
                                        }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
                                            <span style={{
                                                color: getStatusColor(transfer.status),
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {transfer.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {transferHistory && transferHistory.transfers.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-muted)',
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        marginTop: '12px'
                    }}>
                        <h3 style={{
                            color: 'var(--text)',
                            margin: '0 0 0.5rem 0',
                            fontSize: '1rem'
                        }}>📭 No Transfers Yet</h3>
                        <p style={{
                            margin: 0,
                            fontSize: '0.85rem'
                        }}>Your transfer history will appear here</p>
                    </div>
                )}
                </div>
        </>
    );
};

export default Transfer;
