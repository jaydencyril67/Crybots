import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../services/api';
import GoogleLogo from '../assets/google-logo.png';
import axios from 'axios';
import Header from '../components/Header';
import { webauthnAuthenticate } from '../utils/webauthn';
// Lazy-load react-icons to avoid pulling the whole icon set into the initial bundle
const FaSignInAlt = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaSignInAlt })));
const FaGoogle = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaGoogle })));
const FaUser = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaUser })));
const FaLock = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaLock })));
const FaShieldAlt = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaShieldAlt })));
const FaEnvelope = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaEnvelope })));
const FaQuestionCircle = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaQuestionCircle })));
const FaHeadset = React.lazy(() => import('react-icons/fa').then(m => ({ default: m.FaHeadset })));
// import removed: LoadingSpinner

// Simple Checkbox Captcha Modal (like reCAPTCHA)
const CaptchaModal: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState('');

    const handleCheckboxChange = async () => {
        if (isVerified) return;
        
        setIsChecked(true);
        setIsVerifying(true);
        setError('');
        
        // Simulate verification process (like reCAPTCHA)
        setTimeout(() => {
            setIsVerifying(false);
            setIsVerified(true);
            setTimeout(() => {
                onSuccess();
            }, 500);
        }, 1500);
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(30,60,114,0.13)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000,
                transition: 'background 0.2s',
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: 'var(--card-bg)',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    maxWidth: '320px',
                    width: '90%',
                    textAlign: 'center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    color: 'var(--text)'
                }}>
                    Security Check
                </h3>
                <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text)',
                    marginBottom: '16px',
                    lineHeight: '1.4'
                }}>
                    Verify you're human to continue
                </p>
                
                {/* TradeSpot Captcha Checkbox */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: isVerified ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '240px',
                        position: 'relative',
                        ...(isChecked && !isVerified && {
                            boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.3), 0 2px 8px rgba(0, 123, 255, 0.2)',
                            borderColor: 'rgba(0, 123, 255, 0.5)',
                            background: 'var(--card-bg)'
                        }),
                        ...(isVerified && {
                            boxShadow: '0 0 0 2px rgba(40, 167, 69, 0.3), 0 2px 8px rgba(40, 167, 69, 0.2)',
                            borderColor: 'rgba(40, 167, 69, 0.5)',
                            background: 'var(--card-bg)'
                        })
                    }}
                        onClick={handleCheckboxChange}
                    >
                        {/* Checkbox */}
                        <div style={{
                            width: '18px',
                            height: '18px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                            borderRadius: '3px',
                            marginRight: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--bg)',
                            transition: 'all 0.2s ease',
                            ...(isChecked && {
                                boxShadow: isVerified ? '0 0 0 2px rgba(40, 167, 69, 0.3), 0 1px 3px rgba(40, 167, 69, 0.3)' : '0 0 0 2px rgba(0, 123, 255, 0.3), 0 1px 3px rgba(0, 123, 255, 0.3)',
                                background: isVerified ? '#28a745' : '#007bff',
                                borderColor: isVerified ? '#28a745' : '#007bff'
                            })
                        }}>
                            {isVerifying && (
                                <span className="loading-dots">...</span>
                            )}
                            {isVerified && (
                                <span style={{
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    ✓
                                </span>
                            )}
                        </div>
                        
                        {/* Text */}
                        <span style={{
                            fontSize: '13px',
                            color: 'var(--text)',
                            fontWeight: 500,
                            flex: 1,
                            textAlign: 'left'
                        }}>
                            {isVerifying ? 'Verifying...' : 
                             isVerified ? 'Complete' : 
                             'I\'m human'}
                        </span>
                        
                        {/* TradeSpot Branding */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '8px'
                        }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'var(--primary)',
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                marginRight: '4px'
                            }}>
                                TS
                            </div>
                            <span style={{
                                fontSize: '10px',
                                color: 'var(--text-secondary)',
                                fontWeight: 500
                            }}>
                                TradeSpot
                            </span>
                        </div>
                    </div>
                </div>
                
                {error && (
                    <div style={{ 
                        color: 'var(--error-color, #e74c3c)', 
                        fontSize: '0.9rem',
                        marginTop: '12px'
                    }}>
                        {error}
                    </div>
                )}
            </div>
            
            {/* CSS Animation for spinner */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

// 2FA Modal Component
const TwoFAModal: React.FC<{ open: boolean; onSubmit: (code: string) => void; onClose: () => void; error: string }> = ({ open, onSubmit, onClose, error }) => {
    const [code, setCode] = useState('');

    // Auto-verify when 6 digits are entered
    React.useEffect(() => {
        if (code.length === 6) {
            onSubmit(code);
        }
    }, [code]); // Remove onSubmit from dependencies to prevent infinite loop

    if (!open) return null;

    // Handle click outside modal to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3000
            }}
            onClick={handleBackdropClick}
        >
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                border: 'none',
                maxWidth: '320px',
                width: '90%',
                textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                }}>
                    <FaShieldAlt size={14} />
                    2FA Verification
                </h3>
                <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text)',
                    marginBottom: '12px',
                    lineHeight: '1.3'
                }}>
                    Enter your 2FA code to complete login
                </p>
                <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    autoFocus
                    style={{ 
                        width: 'calc(100% - 16px)', 
                        fontSize: '1rem', 
                        padding: '8px', 
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                        borderRadius: '6px', 
                        marginBottom: '12px',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        textAlign: 'center',
                        letterSpacing: '1px',
                        boxSizing: 'border-box'
                    }}
                    placeholder="000000"
                    required
                />
                {error && (
                    <div style={{ 
                        color: 'var(--error-color, #e74c3c)', 
                        fontSize: '0.8rem',
                        marginBottom: '12px'
                    }}>
                        {error}
                    </div>
                )}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px'
                }}>
                    <button
                        onClick={() => window.location.href = '/co'}
                        style={{ 
                            color: 'var(--text)', 
                            fontWeight: 600, 
                            textDecoration: 'underline', 
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        Verification method not available
                    </button>
                </div>
            </div>
            
            {/* Mobile Responsive Styles for 2FA Modal */}
            <style>
                {`
                    @media (max-width: 480px) {
                        div[style*="max-width: 320px"] {
                            max-width: 280px !important;
                            padding: 12px !important;
                        }
                        
                        div[style*="font-size: 1rem"] {
                            font-size: 0.9rem !important;
                        }
                        
                        div[style*="font-size: 0.85rem"] {
                            font-size: 0.75rem !important;
                        }
                        
                        input[style*="font-size: 1rem"] {
                            font-size: 0.9rem !important;
                            padding: 6px !important;
                            letter-spacing: 0.5px !important;
                        }
                        
                        div[style*="margin-bottom: 8px"] {
                            margin-bottom: 6px !important;
                        }
                        
                        div[style*="margin-bottom: 12px"] {
                            margin-bottom: 10px !important;
                        }
                    }
                `}
            </style>
        </div>
    );
};

const API = process.env.REACT_APP_API_URL || 'https://api-tradespot.onrender.com';
const GOOGLE_AUTH_URL = "https://api-tradespot.onrender.com/api/auth/google";

// Helper for Google 2FA verification
const verifyGoogle2FA = async (token: string, code: string) => {
    const response = await axios.post(`${API}/api/auth/google/2fa`, { token, code });
    return response.data;
};

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailValid, setEmailValid] = useState(true);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [pendingLogin, setPendingLogin] = useState<{ email: string; password: string } | null>(null);
    const [loginToken, setLoginToken] = useState<string | null>(null);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [google2FAError, setGoogle2FAError] = useState('');
    const [normal2FAError, setNormal2FAError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isWebauthnLoginEnabled, setIsWebauthnLoginEnabled] = useState(false);
    const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
    const navigate = useNavigate();

    // Track WebAuthn login enablement for the current email
    useEffect(() => {
        if (email && emailValid) {
            (async () => {
                try {
                    const resp = await axios.get(`${API}/api/webauthn-settings/is-enabled`, {
                        params: { email }
                    });
                    setIsWebauthnLoginEnabled(!!resp.data.login);
                } catch {
                    setIsWebauthnLoginEnabled(false);
                }
            })();
        } else {
            setIsWebauthnLoginEnabled(false);
        }
    }, [email, emailValid]);

    useEffect(() => {
        try {
            // Check for token in URL (after Google login)
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const error = params.get('error');
            const twoFAEnabled = params.get('twoFAEnabled');
            const sessionExpired = params.get('session_expired');
            
            if (token) {
                localStorage.setItem('token', token);
                if (twoFAEnabled === 'true') {
                    setShow2FAModal(true);
                    setLoginToken(token);
                    localStorage.removeItem('token');
                    return;
                }
                localStorage.setItem('token', token);
                navigate('/d');
            }
            if (error === 'not_registered') {
                setError('This Google account is not registered. Please sign up first.');
            } else if (error === 'google_profile') {
                setError('Google login failed. Please try again.');
            } else if (error === 'server_error') {
                setError('A server error occurred during Google login. Please try again later.');
            } else if (error) {
                setError('An unknown error occurred during Google login.');
            }
            
            // Check for session expiration
            if (sessionExpired === 'true') {
                setError('You have been logged out from another device. Please log in again.');
            }
        } catch (err) {
            setError('An unexpected error occurred during login.');
        }
    }, [navigate]);

    const validateEmail = (email: string) => {
        return /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setEmail(value);
        setEmailValid(validateEmail(value));
        setError('');
    };

    const handleResendVerification = async () => {
        try {
            await axios.post(`${API}/api/auth/resend-verification`, { email });
            setError('Verification email sent successfully. Please check your inbox.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend verification email.');
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        if (!emailValid) {
            setError('Please enter a valid email address');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Get or generate device ID
            let device = localStorage.getItem('signupDevice');
            if (!device) {
                device = Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('signupDevice', device);
            }
            const res = await loginUser(email, password, undefined, device);
            
            // Check if WebAuthn is required
            if (res.requireWebauthn) {
                try {
                    // Get WebAuthn assertion
                    const assertionResp = await webauthnAuthenticate(email);
                    
                    // Complete login with WebAuthn assertion
                    const webauthnRes = await axios.post(`${API}/api/auth/login/webauthn`, {
                        email,
                        assertionResp,
                        device
                    });
                    
                    setError('');
                    setPendingLogin({ email, password });
                    setLoginToken(webauthnRes.data.token);
                    setShowCaptcha(true);
                    localStorage.removeItem('token');
                } catch (webauthnErr: any) {
                    setError(webauthnErr.response?.data?.error || webauthnErr.message || 'WebAuthn authentication failed');
                    setLoading(false);
                }
            } else {
                // Regular login flow
                setError('');
                setPendingLogin({ email, password });
                setLoginToken(res.token);
                setShowCaptcha(true);
                localStorage.removeItem('token');
            }
        } catch (err: any) {
            if (err.message?.includes('2FA')) {
                // Show 2FA modal instead of inline input
                setPendingCredentials({ email, password });
                setShow2FAModal(true);
                setLoading(false);
            } else {
                setError(err.message || 'Invalid email or password');
            }
            setLoading(false);
        }
    };


    const handleCaptchaSuccess = () => {
        setShowCaptcha(false);
        if (loginToken) {
            localStorage.setItem('token', loginToken);
            const params = new URLSearchParams(window.location.search);
            const redirectUri = params.get('redirect_uri');
            if (redirectUri) {
                window.location.href = `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}token=${loginToken}`;
                return;
            }
        }
        navigate('/d');
    };

    const handleGoogleLogin = () => {
        window.location.href = GOOGLE_AUTH_URL;
    };

    // Handle 2FA submit for Google login
    const handleGoogle2FASubmit = useCallback(async (code: string) => {
        setGoogle2FAError('');
        try {
            if (!loginToken) throw new Error('Missing login token');
            const res = await verifyGoogle2FA(loginToken, code);
            if (res.token) localStorage.setItem('token', res.token);
            setShow2FAModal(false);
            setGoogle2FAError('');
            const params = new URLSearchParams(window.location.search);
            const redirectUri = params.get('redirect_uri');
            if (redirectUri) {
                window.location.href = `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}token=${res.token}`;
                return;
            }
            navigate('/d');
        } catch (err: any) {
            setGoogle2FAError(err.message || 'Invalid 2FA code');
        }
    }, [loginToken, navigate]);

    // Handle 2FA submit for normal login
    const handleNormal2FASubmit = useCallback(async (code: string) => {
        setNormal2FAError('');
        setLoading(true);
        try {
            if (!pendingCredentials) throw new Error('Missing credentials');
            
            // Get or generate device ID
            let device = localStorage.getItem('signupDevice');
            if (!device) {
                device = Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('signupDevice', device);
            }
            
            const res = await loginUser(pendingCredentials.email, pendingCredentials.password, code, device);
            
            setError('');
            setPendingLogin({ email: pendingCredentials.email, password: pendingCredentials.password });
            setLoginToken(res.token);
            setShow2FAModal(false);
            setNormal2FAError('');
            setPendingCredentials(null);
            setShowCaptcha(true);
            localStorage.removeItem('token');
            setLoading(false);
        } catch (err: any) {
            setNormal2FAError(err.message || 'Invalid 2FA code');
            setLoading(false);
        }
    }, [pendingCredentials]);

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'var(--bg)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
        }}>
            {/* Header */}
            <Header />

            {/* Main Content */}
            <div style={{
                padding: '12px',
                paddingTop: '60px',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
            {showCaptcha && (
                <CaptchaModal onSuccess={handleCaptchaSuccess} onClose={() => setShowCaptcha(false)} />
            )}
            <TwoFAModal 
                open={show2FAModal} 
                onSubmit={loginToken ? handleGoogle2FASubmit : handleNormal2FASubmit} 
                onClose={() => {
                    setShow2FAModal(false);
                    if (normal2FAError) {
                        setNormal2FAError('');
                        setPendingCredentials(null);
                    }
                    if (google2FAError) {
                        setGoogle2FAError('');
                    }
                }} 
                error={loginToken ? google2FAError : normal2FAError} 
            />
            
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                padding: '24px',
                minWidth: 0,
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center'
            }}>
                {/* Compact Header */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    marginBottom: '24px'
                }}>
                    <span style={{ fontSize: '24px' }}>🔐</span>
                  <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 700, 
                    color: 'var(--text)', 
                    letterSpacing: 0.5
                  }}>
                    Welcome Back
                  </span>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off">
                    {/* Email Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ 
                            position: 'relative',
                            marginBottom: '8px'
                        }}>
                            <FaEnvelope style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                fontSize: '14px'
                            }} />
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                autoComplete="off"
                                placeholder="Enter your email"
                                style={{ 
                                    width: '100%', 
                                    boxSizing: 'border-box', 
                                    padding: '12px 12px 12px 40px', 
                                    borderRadius: '8px', 
                                    border: 'none',
                                    boxShadow: emailValid || email === '' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 0 0 2px rgba(231, 76, 60, 0.3), 0 2px 8px rgba(231, 76, 60, 0.2)', 
                                    fontSize: '0.9rem', 
                                    background: 'var(--bg)', 
                                    color: 'var(--text)',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        </div>
                        {!emailValid && email !== '' && (
                            <div style={{ 
                                color: 'var(--error-color, #e74c3c)', 
                                fontSize: '0.8rem', 
                                textAlign: 'left',
                                marginTop: '4px'
                            }}>
                                Please enter a valid email address.
                            </div>
                        )}
                    </div>

                    {/* Password Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ 
                            position: 'relative',
                            marginBottom: '8px'
                        }}>
                            <FaLock style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                fontSize: '14px'
                            }} />
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="off"
                                placeholder="Enter your password"
                                style={{ 
                                    width: '100%', 
                                    boxSizing: 'border-box', 
                                    padding: '12px 12px 12px 40px', 
                                    borderRadius: '8px', 
                                    border: 'none',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
                                    fontSize: '0.9rem', 
                                    background: 'var(--bg)', 
                                    color: 'var(--text)',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{ 
                            marginBottom: '16px', 
                            padding: '12px',
                            borderRadius: '8px',
                            background: error.includes('Verification email sent successfully') ? 'rgba(74, 222, 128, 0.1)' : error.includes('verify your email') ? 'rgba(251, 191, 36, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                            color: error.includes('Verification email sent successfully') ? 'var(--success-color)' : error.includes('verify your email') ? 'var(--warning-color)' : 'var(--error-color)',
                            border: 'none',
                            boxShadow: error.includes('Verification email sent successfully') ? '0 2px 8px rgba(74, 222, 128, 0.2)' : error.includes('verify your email') ? '0 2px 8px rgba(251, 191, 36, 0.2)' : '0 2px 8px rgba(248, 113, 113, 0.2)',
                            fontSize: '0.8rem',
                            textAlign: 'center'
                        }}>
                            {error}
                            {error.includes('verify your email') && (
                                <div style={{ marginTop: '8px' }}>
                                    <button
                                        onClick={handleResendVerification}
                                        style={{
                                            background: 'var(--primary)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Resend Verification
                                    </button>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Login Button */}
                    <button 
                        type="submit" 
                        style={{
                            width: '100%',
                            background: 'var(--secondary)',
                            color: 'var(--button-text)',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginBottom: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            opacity: loading ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }} 
                        disabled={loading}
                    >
                        <FaSignInAlt size={14} />
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>

                    {/* Divider */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '16px',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--secondary)' }}></div>
                        <span style={{ margin: '0 12px' }}>or</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--secondary)' }}></div>
                    </div>

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text)',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            marginBottom: '20px'
                        }}
                    >
                        <img
                            src={GoogleLogo}
                            alt="Google logo"
                            style={{ width: '18px', height: '18px' }}
                        />
                        Sign in with Google
                    </button>

                    {/* Links */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.85rem'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: 'var(--text)' }}>
                                Don't have an account?
                            </span>
                            <span 
                                style={{ 
                                    color: 'var(--text)', 
                                    fontWeight: 600, 
                                    cursor: 'pointer', 
                                    textDecoration: 'underline' 
                                }} 
                                onClick={() => navigate('/r')}
                            >
                                Register
                            </span>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: 'var(--text)' }}>
                                Forgot your password?
                            </span>
                            <span 
                                style={{ 
                                    color: 'var(--text)', 
                                    fontWeight: 600, 
                                    cursor: 'pointer', 
                                    textDecoration: 'underline' 
                                }} 
                                onClick={() => navigate('/fp')}
                            >
                                Reset
                            </span>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            paddingTop: '12px',
                            boxShadow: '0 -1px 0 rgba(0, 0, 0, 0.1)'
                        }}>
                            <FaHeadset size={12} />
                            <button
                                onClick={() => window.location.href = '/co'}
                                style={{ 
                                    color: 'var(--text)', 
                                    fontWeight: 600, 
                                    textDecoration: 'underline', 
                                    fontSize: '0.85rem',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                Need Help?
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Mobile Responsive Styles */}
            <style>
                {`
                    @media (max-width: 480px) {
                        div[style*="max-width: 400px"] {
                            max-width: 100% !important;
                            margin: 0 8px !important;
                        }
                        
                        div[style*="padding: 24px"] {
                            padding: 20px 16px !important;
                        }
                        
                        div[style*="font-size: 1.2rem"] {
                            font-size: 1.1rem !important;
                        }
                        
                        div[style*="font-size: 0.9rem"] {
                            font-size: 0.85rem !important;
                        }
                        
                        div[style*="font-size: 0.85rem"] {
                            font-size: 0.8rem !important;
                        }
                    }
                `}
            </style>
            </div>
        </div>
    );
};

export default Login;

function base64urlToUint8Array(base64url: string): Uint8Array {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const str = atob(base64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; ++i) bytes[i] = str.charCodeAt(i);
    return bytes;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
