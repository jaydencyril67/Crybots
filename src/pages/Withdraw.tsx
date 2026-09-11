// Withdraw page - content will be added later
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { webauthnAuthenticate } from '../utils/webauthn';
import { useTheme } from '../ThemeContext';
// KYC removed

const API = process.env.REACT_APP_API_BASE_URL;

const Withdraw: React.FC = () => {
    const { theme } = useTheme();
    const [usdtBalance, setUsdtBalance] = useState<number>(0);
    const [trc20Wallet, setTrc20Wallet] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState('');
    const [twoFACode, setTwoFACode] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [sendingCode, setSendingCode] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isWebauthnEnabled, setIsWebauthnEnabled] = useState<boolean>(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);

    // Helper to check if WebAuthn is enabled for withdraw
    const isWebauthnWithdrawEnabled = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;
            const res = await axios.get(`${API}/api/webauthn-settings/settings`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            return !!(res.data.webauthnSettings && res.data.webauthnSettings.withdraw);
        } catch {
            return false;
        }
    };

    // Helper to check if 2FA is enabled
    const check2FAStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;
            const res = await axios.get(`${API}/api/2fa/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data.enabled || false;
        } catch {
            return false;
        }
    };

    // Check WebAuthn and 2FA status on mount
    useEffect(() => {
        const checkStatuses = async () => {
            const webauthnEnabled = await isWebauthnWithdrawEnabled();
            setIsWebauthnEnabled(webauthnEnabled);
            const twoFAEnabled = await check2FAStatus();
            setIs2FAEnabled(twoFAEnabled);
        };
        checkStatuses();
    }, []);

    // Fetch user portfolio on mount and poll for live updates
    useEffect(() => {
        let isFirstFetch = true;
        
        const fetchPortfolio = async () => {
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Not authenticated');
                const res = await axios.get(`${API}/api/portfolio`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsdtBalance(res.data.usdtBalance || 0);
                setTrc20Wallet(res.data.trc20Wallet || '');
                    if (res.data.trc20Wallet) {
                        setTrc20Wallet(res.data.trc20Wallet);
                    }
            } catch (e: any) {
                setError(e?.response?.data?.error || e.message || 'Failed to load portfolio');
            } finally {
                setLoading(false);
                // Only set loading wallet to false on first fetch
                if (isFirstFetch) {
                    setLoadingWallet(false);
                    isFirstFetch = false;
                }
            }
        };
        
        // Initial fetch
        fetchPortfolio();
        
        // Poll for live updates every 5 seconds (same as Profile.tsx)
        const interval = setInterval(fetchPortfolio, 5000);
        
        // Cleanup interval on unmount
        return () => {
            clearInterval(interval);
        };
    }, []);

    // Real-time balance check on amount input
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
            setError('');
            setSuccess('');
            if (value && !isNaN(Number(value)) && Number(value) > usdtBalance) {
                setError('Insufficient funds.');
            }
        }
    };

    // Send withdrawal verification code to email
    const handleSendCode = async () => {
        setSendingCode(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API}/api/send-withdrawal-verification`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCodeSent(true);
            setSuccess('Verification code sent to your email.');
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || 'Failed to send verification code');
        } finally {
            setSendingCode(false);
        }
    };

    // Handle withdrawal submission
    const handleWithdraw = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            // KYC checks removed
            if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
                throw new Error('Minimum withdrawal is 10 USDT');
            }
            if (Number(amount) > usdtBalance) {
                throw new Error('Insufficient funds');
            }
            if (!verificationCode) {
                throw new Error('Please enter verification code');
            }
            
            const selectedWallet = trc20Wallet;
            if (!selectedWallet) {
                throw new Error('Please set up your TRC20 wallet address in settings');
            }

            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            let assertionResp = undefined;
            // Check if WebAuthn is enabled for withdraw
            const webauthnEnabled = await isWebauthnWithdrawEnabled();
            if (webauthnEnabled) {
                // Get user email
                let email = null;
                try {
                    const me = await axios.get(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
                    email = me.data.email;
                } catch {}
                if (!email) throw new Error('User email not found for WebAuthn');
                assertionResp = await webauthnAuthenticate(email);
            }

            const withdrawalData: any = {
                amount: Number(amount),
                walletAddress: selectedWallet,
                walletType: 'trc20',
                verificationCode,
            };

            // Include either 2FA code or WebAuthn assertion response
            if (assertionResp) {
                withdrawalData.assertionResp = assertionResp;
            } else if (twoFACode) {
                withdrawalData.twoFACode = twoFACode;
            }

            await axios.post(`${API}/api/withdraw`, withdrawalData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setSuccess('Withdrawal request submitted successfully!');
            setAmount('');
            setVerificationCode('');
            setTwoFACode('');
            setCodeSent(false);
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || 'Failed to submit withdrawal request');
        } finally {
            setLoading(false);
        }
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

            {/* Success/Error Messages */}
            {success && (
                <div style={{
                    background: '#4CAF50',
                    color: 'white',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'slideIn 0.3s ease',
                    fontSize: '0.9rem'
                }}>
                    <span>✅</span>
                    {success}
                </div>
            )}
            
            {error && (
                <div style={{
                    background: '#f44336',
                    color: 'white',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'slideIn 0.3s ease',
                    fontSize: '0.9rem'
                }}>
                    <span>❌</span>
                    {error}
                </div>
            )}

            {/* Compact Grid Layout */}
            <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '12px',
                marginTop: '24px'
            }}>
                
                {/* Withdrawal Form Card */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    transition: 'all 0.2s ease'
                }}>
                    <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--text)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📝</span>
                        Withdrawal Form
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Wallet Type selection removed — TRC20 only */}

                        {/* Amount Input */}
                        <div>
                            <label style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 500, 
                                color: 'var(--text)', 
                                marginBottom: '6px', 
                                display: 'block' 
                            }}>
                                Amount (USDT): {loading ? <span className="loading-dots">...</span> : ''}
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="Enter amount (min 10 USDT)"
                                    inputMode="decimal"
                                    style={{
                                        flex: 1,
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: '0.75rem',
                                        boxSizing: 'border-box',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <div style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    minWidth: 'fit-content',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {loading ? <span className="loading-dots">...</span> : `Balance: ${usdtBalance.toFixed(2)} USDT`}
                                </div>
                            </div>
                        </div>

                        {/* Verification Code */}
                        <div>
                            <label style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 500, 
                                color: 'var(--text)', 
                                marginBottom: '6px', 
                                display: 'block' 
                            }}>
                                Email Verification Code:
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="Enter verification code"
                                    style={{
                                        flex: 1,
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: '0.75rem',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <button
                                    onClick={handleSendCode}
                                    disabled={sendingCode || codeSent}
                                    style={{
                                        background: codeSent ? '#4CAF50' : 'var(--secondary)',
                                        color: 'var(--button-text)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        opacity: codeSent ? 0.7 : 1,
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    {sendingCode ? 'Sending...' : codeSent ? 'Sent!' : 'Send Code'}
                                </button>
                            </div>
                        </div>

                        {/* 2FA Code (if WebAuthn not enabled) */}
                        {!isWebauthnEnabled && (
                            <div>
                                <label style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 500, 
                                    color: 'var(--text)', 
                                    marginBottom: '6px', 
                                    display: 'block' 
                                }}>
                                    2FA Code:
                                </label>
                                <input
                                    type="text"
                                    value={is2FAEnabled ? twoFACode : 'Enable 2FA to Withdraw'}
                                    onChange={e => {
                                        if (is2FAEnabled) {
                                            setTwoFACode(e.target.value);
                                        }
                                    }}
                                    placeholder={is2FAEnabled ? "Enter 2FA code if enabled" : "Enable 2FA to Withdraw"}
                                    disabled={!is2FAEnabled}
                                    readOnly={!is2FAEnabled}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: is2FAEnabled ? 'var(--bg)' : 'var(--text-muted)',
                                        color: is2FAEnabled ? 'var(--text)' : 'var(--text-secondary)',
                                        fontSize: '0.8rem',
                                        boxSizing: 'border-box',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        cursor: is2FAEnabled ? 'text' : 'not-allowed',
                                        opacity: is2FAEnabled ? 1 : 0.7
                                    }}
                                />
                            </div>
                        )}

                        {/* WebAuthn Info (if enabled) */}
                        {isWebauthnEnabled && (
                            <div style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'rgba(16,201,143,0.1)',
                                textAlign: 'center',
                                marginBottom: '12px',
                                boxShadow: '0 2px 8px rgba(16, 201, 143, 0.2)'
                            }}>
                                <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: '#10c98f',
                                    fontWeight: 500,
                                    marginBottom: '4px'
                                }}>
                                    🔐 Biometric Security Enabled
                                </div>
                                <div style={{ 
                                    fontSize: '0.7rem', 
                                    color: '#10c98f'
                                }}>
                                    You'll be prompted to authenticate with your security key
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        {(() => {
                            const isValidAmount = amount && !isNaN(Number(amount)) && Number(amount) >= 10;
                            const hasVerificationCode = !!verificationCode;
                            const has2FA = isWebauthnEnabled || (is2FAEnabled && !!twoFACode);
                            const isFormValid = isValidAmount && hasVerificationCode && has2FA;
                            const isDisabled = loading || !isFormValid;
                            
                            return (
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isDisabled}
                                    style={{
                                        background: isDisabled ? 'var(--text-muted)' : 'var(--secondary)',
                                        color: 'var(--button-text)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                        opacity: isDisabled ? 0.7 : 1
                                    }}
                                >
                                    {loading ? (
                                <>
                                    <span className="loading-dots">...</span>
{/* Dot loader animation style (if not already present) */}
<style>{`
    @keyframes loading-dots {
        0%, 20% { opacity: 0; }
        50% { opacity: 1; }
        80%, 100% { opacity: 0; }
    }
    .loading-dots {
        animation: loading-dots 1.5s infinite;
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 2px;
        display: inline-block;
    }
`}</style>
                                    Processing...
                                </>
                            ) : (
                                'Submit Withdrawal'
                            )}
                                </button>
                            );
                        })()}
                    </div>
                </div>

                {/* Wallet Information Card */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    transition: 'all 0.2s ease'
                }}>
                    <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--text)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>🏦</span>
                        Wallet Information
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* TRC20 Wallet */}
                        <div>
                            <label style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 500, 
                                color: 'var(--text)', 
                                marginBottom: '6px', 
                                display: 'block' 
                            }}>
                                TRC20 Wallet:
                            </label>
                            {loadingWallet ? (
                                <div style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                    fontSize: '0.8rem',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span className="loading-dots">....</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Loading wallet...</span>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={trc20Wallet || 'Not set'}
                                    readOnly
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--bg)',
                                        color: trc20Wallet ? 'var(--text)' : 'var(--secondary)',
                                        fontSize: '0.8rem',
                                        boxSizing: 'border-box',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                            )}
                        </div>

                        {/* TRX wallet removed — TRC20 only */}

                        {/* Setup Wallet Button: show when TRC20 wallet is not set */}
                        {!loadingWallet && !trc20Wallet && (
                        <button
                            onClick={() => window.location.href = '/sw'}
                            style={{
                                background: 'var(--bg)',
                                color: 'var(--text)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <span>⚙️</span>
                            Setup Wallet Address
                        </button>
                        )}
                    </div>
                </div>

                {/* Withdrawal Info Card */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    transition: 'all 0.2s ease'
                }}>
                    <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--text)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>ℹ️</span>
                        Withdrawal Information
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>💰</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Minimum withdrawal: 10 USDT
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>⚡</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                TRC20 (USDT): Fast and low fees — used for withdrawals
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>⏱️</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Processing time: 5-30 minutes
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>📧</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Email verification required
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Responsive Styles */}
            <style>
                {`
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                    
                    @media (max-width: 768px) {
                        div[style*="grid-template-columns: repeat(auto-fit, minmax(350px, 1fr))"] {
                            grid-template-columns: 1fr !important;
                            gap: 8px !important;
                        }
                        
                        div[style*="padding: 16px"] {
                            padding: 12px !important;
                        }
                        
                        div[style*="font-size: 1rem"] {
                            font-size: 0.9rem !important;
                        }
                        
                        div[style*="font-size: 0.85rem"] {
                            font-size: 0.8rem !important;
                        }
                        
                        div[style*="font-size: 0.75rem"] {
                            font-size: 0.7rem !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        div[style*="padding: 16px"] {
                            padding: 8px !important;
                        }
                        
                        div[style*="padding: 12px 16px"] {
                            padding: 10px 12px !important;
                        }
                        
                        div[style*="font-size: 1.1rem"] {
                            font-size: 1rem !important;
                        }
                        
                        div[style*="font-size: 0.8rem"] {
                            font-size: 0.7rem !important;
                        }
                    }
                `}
            </style>
            </div>
        </>
    );
};

export default Withdraw;
