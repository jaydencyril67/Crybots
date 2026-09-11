import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { webauthnAuthenticate } from '../utils/webauthn';

const API = process.env.REACT_APP_API_BASE_URL;

interface User {
  id: string;
  fullName: string;
  email: string;
  trc20Wallet?: string;
  usdtBalance: number;
  btcBalance: number;
  spotid: string;
  validMember: boolean;
  banned: boolean;
  profilePicture?: string;
}

const WalletSettings: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editing, setEditing] = useState<'trc20' | null>(null);
    const [newWallet, setNewWallet] = useState('');
    const [code, setCode] = useState('');
    const [twoFAToken, setTwoFAToken] = useState('');
    const [sendingCode, setSendingCode] = useState(false);
    const [walletValid, setWalletValid] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isWebauthnEnabled, setIsWebauthnEnabled] = useState<boolean>(false);
    const [showSendCodeInput, setShowSendCodeInput] = useState<'trc20' | 'trx' | null>(null);

    // Helper to check if WebAuthn is enabled for wallet binding
    const isWebauthnWalletEnabled = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;
            const res = await axios.get(`${API}/api/webauthn-settings/settings`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            return !!(res.data.webauthnSettings && res.data.webauthnSettings.wallet);
        } catch {
            return false;
        }
    };

    // Check WebAuthn status on mount
    useEffect(() => {
        const checkWebAuthn = async () => {
            const enabled = await isWebauthnWalletEnabled();
            setIsWebauthnEnabled(enabled);
        };
        checkWebAuthn();
    }, []);

    useEffect(() => {
        fetchUserData();
    }, []);

    // Auto-dismiss success messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/api/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    // TRC20 wallet validation (starts with 'T' and is 34 chars)
    const validateTRC20Wallet = (address: string) => {
        return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
    };

    // TRX removed: only TRC20 is supported

    const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewWallet(value);
        
        if (editing === 'trc20') {
            setWalletValid(validateTRC20Wallet(value) || value === '');
        }
    };

    const handleSendCode = async (type: 'trc20') => {
        setSendingCode(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API}/api/send-wallet-verification`, {
                walletType: type,
                walletAddress: newWallet || '' // Allow empty wallet address
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`✅ ${type.toUpperCase()} wallet verification code sent to ${user?.email || 'your email'}. Please check your inbox and spam folder.`);
            setShowSendCodeInput(null); // Hide the input after successful send
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to send verification code');
        } finally {
            setSendingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        // Validate required fields
        if (!newWallet || !code) {
            setError('Wallet address and verification code are required');
            setSubmitting(false);
            return;
        }

        // Validate wallet format
        if (editing === 'trc20' && !validateTRC20Wallet(newWallet)) {
            setError('Invalid TRC20 wallet address format');
            setSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            let assertionResp = undefined;
            // Check if WebAuthn is enabled for wallet binding
            const webauthnEnabled = await isWebauthnWalletEnabled();
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

            const requestData: any = {
                walletType: editing,
                walletAddress: newWallet,
                code: code
            };

            // Include either 2FA token or WebAuthn assertion response
            if (assertionResp) {
                requestData.assertionResp = assertionResp;
            } else if (twoFAToken) {
                requestData.twoFAToken = twoFAToken;
            }

            await axios.post(`${API}/api/bind-wallet`, requestData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(`✅ ${editing?.toUpperCase()} wallet updated successfully!`);
            setEditing(null);
            setNewWallet('');
            setCode('');
            setTwoFAToken('');
            fetchUserData(); // Refresh user data
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to update wallet');
        } finally {
            setSubmitting(false);
        }
    };

    const cancelEdit = () => {
        setEditing(null);
        setNewWallet('');
        setCode('');
        setTwoFAToken('');
        setError('');
        setWalletValid(true);
        setShowSendCodeInput(null);
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
                padding: window.innerWidth <= 768 ? '12px' : '24px',
                maxWidth: '100%',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
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
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                
                {/* TRC20 Wallet Card */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: 'var(--card-shadow)',
                    border: '1px solid transparent',
                    transition: 'all 0.2s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                            <h3 style={{ 
                                fontSize: '1rem', 
                                fontWeight: 600, 
                                color: 'var(--text)',
                                marginBottom: '2px'
                            }}>
                                TRC20 Wallet
                            </h3>
                            <p style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-muted)',
                                margin: 0
                            }}>
                                USDT (TRC20) address
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            background: user?.trc20Wallet ? '#4CAF50' : '#ff9800',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 500
                        }}>
                            <span>{user?.trc20Wallet ? '🔗' : '⚠️'}</span>
                            {loading ? <span className="loading-dots">...</span> : (user?.trc20Wallet ? 'Set' : 'Not Set')}
                        </div>
                    </div>

                    {editing === 'trc20' ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 500, 
                                    color: 'var(--text)',
                                    marginBottom: '4px'
                                }}>
                                    TRC20 Address
                                </label>
                                <input
                                    type="text"
                                    value={newWallet}
                                    onChange={handleWalletChange}
                                    placeholder="Enter TRC20 wallet address"
                                    style={{
                                        width: '100%',
                                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                                        borderRadius: '6px',
                                        border: `1px solid ${walletValid ? 'var(--secondary)' : '#f44336'}`,
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                                        boxSizing: 'border-box',
                                        minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                                    }}
                                />
                                {!walletValid && (
                                    <p style={{ fontSize: '0.7rem', color: 'var(--error-color, #f44336)', margin: '4px 0 0 0' }}>
                                        Invalid TRC20 address format
                                    </p>
                                )}
                            </div>

                            <div>
                                <label style={{ 
                                    display: 'block', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 500, 
                                    color: 'var(--text)',
                                    marginBottom: '4px'
                                }}>
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter verification code"
                                    style={{
                                        width: '100%',
                                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--secondary)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                                        boxSizing: 'border-box',
                                        minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                                    }}
                                />
                            </div>

                            {/* 2FA Code (if WebAuthn not enabled) */}
                            {!isWebauthnEnabled && (
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.85rem', 
                                        fontWeight: 500, 
                                        color: 'var(--text)',
                                        marginBottom: '4px'
                                    }}>
                                        2FA Code (Required):
                                    </label>
                                    <input
                                        type="text"
                                        value={twoFAToken}
                                        onChange={(e) => setTwoFAToken(e.target.value)}
                                        placeholder="Enter 2FA code"
                                        style={{
                                            width: '100%',
                                            padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--secondary)',
                                            background: 'var(--bg)',
                                            color: 'var(--text)',
                                            fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                                            boxSizing: 'border-box',
                                            minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                                        }}
                                        required
                                    />
                                </div>
                            )}

                            {/* WebAuthn Info (if enabled) */}
                            {isWebauthnEnabled && (
                                <div style={{
                                    background: 'rgba(96, 165, 250, 0.1)',
                                    color: 'var(--info-color, #1976d2)',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #bbdefb',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>🔐</span>
                                    Biometric Security will be used instead of 2FA
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="submit"
                                    disabled={submitting || !walletValid || !newWallet || !code || (!isWebauthnEnabled && !twoFAToken)}
                                    className="wallet-btn"
                                    style={{
                                        background: 'var(--secondary)',
                                        color: 'var(--button-text)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                                        fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        flex: 1,
                                        minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                                    }}
                                >
                                    {submitting ? 'Updating...' : 'Update Wallet'}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="wallet-btn"
                                    style={{
                                        background: 'transparent',
                                        color: 'var(--secondary)',
                                        border: '1px solid var(--secondary)',
                                        borderRadius: '6px',
                                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                                        fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {loading ? (
                                <div style={{
                                    background: 'var(--bg)',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--secondary)'
                                }}>
                                    <p style={{ 
                                        fontSize: '0.8rem', 
                                        color: 'var(--text)',
                                        margin: 0,
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace'
                                    }}>
                                        <span className="loading-dots">...</span>
                                    </p>
                                </div>
                            ) : user?.trc20Wallet ? (
                                <div style={{
                                    background: 'var(--bg)',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--secondary)'
                                }}>
                                    <p style={{ 
                                        fontSize: '0.8rem', 
                                        color: 'var(--text)',
                                        margin: 0,
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace'
                                    }}>
                                        {user.trc20Wallet}
                                    </p>
                                </div>
                            ) : (
                                <p style={{ 
                                    fontSize: '0.8rem', 
                                    color: 'var(--text-muted)',
                                    margin: 0
                                }}>
                                    No TRC20 wallet set
                                </p>
                            )}

                            {/* Show input field when user wants to send code */}
                            {showSendCodeInput === 'trc20' && (
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        fontSize: '0.85rem', 
                                        fontWeight: 500, 
                                        color: 'var(--text)',
                                        marginBottom: '4px'
                                    }}>
                                        TRC20 Address
                                    </label>
                                    <input
                                        type="text"
                                        value={newWallet}
                                        onChange={handleWalletChange}
                                        placeholder="Enter TRC20 wallet address"
                                        style={{
                                            width: '100%',
                                            padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                                            borderRadius: '6px',
                                            border: `1px solid ${walletValid ? 'var(--secondary)' : '#f44336'}`,
                                            background: 'var(--bg)',
                                            color: 'var(--text)',
                                            fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                                            boxSizing: 'border-box',
                                            minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                                        }}
                                    />
                                    {!walletValid && (
                                        <p style={{ fontSize: '0.7rem', color: 'var(--error-color, #f44336)', margin: '4px 0 0 0' }}>
                                            Invalid TRC20 address format
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={async () => {
                                        setEditing('trc20');
                                        setShowSendCodeInput('trc20');
                                        // Send code immediately for both new and existing wallets
                                        await handleSendCode('trc20');
                                    }}
                                    className="wallet-btn"
                                    style={{
                                        background: 'var(--secondary)',
                                        color: 'var(--button-text)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                                        fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        flex: 1,
                                        minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                                    }}
                                >
                                    {loading ? <span className="loading-dots">...</span> : (user?.trc20Wallet ? 'Change' : 'Set Wallet')}
                                </button>
                            </div>
                        </div>
                    )}
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
                        
                        /* Mobile button container - keep horizontal but more compact */
                        div[style*="display: flex"][style*="gap: 8px"] {
                            flex-direction: row !important;
                            gap: 6px !important;
                        }
                        
                        /* Mobile button styling - more compact */
                        button[style*="padding: 8px 16px"] {
                            padding: 6px 12px !important;
                            font-size: 0.85rem !important;
                            min-height: 44px !important;
                            touch-action: manipulation !important;
                        }
                        
                        .wallet-btn {
                            padding: 6px 12px !important;
                            font-size: 0.7rem !important;
                            border-radius: 6px !important;
                            min-height: 32px !important;
                        }
                        
                        /* Mobile input fields - more compact */
                        input[style*="padding: 8px 12px"] {
                            padding: 6px 12px !important;
                            font-size: 0.8rem !important;
                            min-height: 44px !important;
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
                        
                        /* Extra small mobile - even more compact buttons */
                        div[style*="display: flex"][style*="gap: 8px"] {
                            flex-direction: row !important;
                            gap: 4px !important;
                        }
                        
                        button[style*="padding: 8px 16px"] {
                            padding: 8px 10px !important;
                            font-size: 0.8rem !important;
                            min-height: 40px !important;
                        }
                        
                        .wallet-btn {
                            padding: 5px 10px !important;
                            font-size: 0.65rem !important;
                            border-radius: 5px !important;
                            min-height: 30px !important;
                        }
                        
                        input[style*="padding: 8px 12px"] {
                            padding: 8px 10px !important;
                            font-size: 0.8rem !important;
                            min-height: 40px !important;
                        }
                        
                        /* Reduce card padding on very small screens */
                        div[style*="background: var(--card-bg)"][style*="padding: 16px"] {
                            padding: 10px !important;
                        }
                    }
                    
                    @media (max-width: 360px) {
                        .wallet-btn {
                            padding: 4px 8px !important;
                            font-size: 0.6rem !important;
                            border-radius: 4px !important;
                            min-height: 28px !important;
                        }
                    }
                `}
            </style>
            </div>
        </>
    );
};

export default WalletSettings; 