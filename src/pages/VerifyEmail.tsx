import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

const API = process.env.REACT_APP_API_BASE_URL;

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'error' | 'expired'>('verifying');
    const [message, setMessage] = useState('');
    const [showResendForm, setShowResendForm] = useState(false);
    const [resendEmail, setResendEmail] = useState('');
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');


    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        const pending = searchParams.get('pending');
        
        if (pending === 'true' && email) {
            // User just registered, show pending verification notice
            setVerificationStatus('pending');
            setResendEmail(email);
            setMessage(`We've sent a verification email to ${email}. Please check your inbox and click the verification link to activate your account.`);
        } else if (token) {
            // User clicked verification link, verify the token
            verifyEmail(token);
        } else {
            setVerificationStatus('error');
            setMessage('No verification token provided.');
        }
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const response = await axios.get(`${API}/api/auth/verify-email/${token}`);
            setVerificationStatus('success');
            setMessage(response.data.message);
        } catch (error: any) {
            if (error.response?.data?.error) {
                const errorMsg = error.response.data.error;
                if (errorMsg.includes('expired')) {
                    setVerificationStatus('expired');
                    setMessage(errorMsg);
                } else {
                    setVerificationStatus('error');
                    setMessage(errorMsg);
                }
            } else {
                setVerificationStatus('error');
                setMessage('An error occurred during verification. Please try again.');
            }
        }
    };

    const handleResendVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resendEmail) return;

        setResendStatus('sending');
        try {
            await axios.post(`${API}/api/auth/resend-verification`, { email: resendEmail });
            setResendStatus('success');
            setShowResendForm(false);
        } catch (error: any) {
            setResendStatus('error');
        }
    };

    const renderContent = () => {
        switch (verificationStatus) {
            case 'pending':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#3a2a1a',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <span style={{ fontSize: '32px', color: '#1976d2' }}>📧</span>
                        </div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: '16px',
                            color: '#1976d2'
                        }}>
                            Pending Email Verification
                        </h2>
                        <p style={{
                            color: '#cbd5e1',
                            marginBottom: '16px',
                            lineHeight: 1.5
                        }}>
                            {message}
                        </p>
                        <button
                            onClick={() => setShowResendForm(true)}
                            style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            Resend Verification Email
                        </button>
                    </div>
                );

            case 'verifying':
                return (
                    <div style={{ textAlign: 'center' }}>
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
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: 'var(--text)'
                        }}>
                            Verifying your email...
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            lineHeight: 1.5
                        }}>
                            Please wait while we verify your email address.
                        </p>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                );

            case 'success':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#d4edda',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <span style={{ fontSize: '32px', color: '#155724' }}>✅</span>
                        </div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: '16px',
                            color: '#155724'
                        }}>
                            Email Verified Successfully!
                        </h2>
                        <p style={{
                            color: '#cbd5e1',
                            marginBottom: '16px',
                            lineHeight: 1.5
                        }}>
                            {message}
                        </p>
                        <p style={{
                            color: '#94a3b8',
                            marginBottom: '24px',
                            fontSize: '0.875rem',
                            lineHeight: 1.5
                        }}>
                            Your email has been successfully verified. You can now continue to the login page to sign in to your account.
                        </p>
                        <button
                            onClick={() => navigate('/l')}
                            style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            Continue to Login
                        </button>
                    </div>
                );

            case 'error':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#f8d7da',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <span style={{ fontSize: '32px', color: '#721c24' }}>❌</span>
                        </div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: '16px',
                            color: '#721c24'
                        }}>
                            Verification Failed
                        </h2>
                        <p style={{
                            color: '#cbd5e1',
                            marginBottom: '16px',
                            lineHeight: 1.5
                        }}>
                            {message}
                        </p>
                        <button
                            onClick={() => setShowResendForm(true)}
                            style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            Resend Verification Email
                        </button>
                    </div>
                );

            case 'expired':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#fff3cd',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <span style={{ fontSize: '32px', color: '#856404' }}>⚠️</span>
                        </div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            marginBottom: '16px',
                            color: '#856404'
                        }}>
                            Verification Token Expired
                        </h2>
                        <p style={{
                            color: '#cbd5e1',
                            marginBottom: '16px',
                            lineHeight: 1.5
                        }}>
                            {message}
                        </p>
                        <button
                            onClick={() => setShowResendForm(true)}
                            style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            Get New Verification Email
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'var(--bg)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
        }} className="verify-email-page">
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
                flexDirection: 'column', 
                justifyContent: 'center', 
                minHeight: '100vh'
            }}>
                <div style={{ margin: '0 auto', maxWidth: '500px', width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }} className="page-header">
                    <h1 style={{ 
                        fontSize: '2rem', 
                        fontWeight: 700, 
                        marginBottom: '8px', 
                        color: 'var(--text)',
                        letterSpacing: 1
                    }}>
                        TradeSpot
                    </h1>
                    <p style={{ color: 'var(--text)', opacity: 0.8 }}>Email Verification</p>
                </div>

                <div style={{ 
                    background: 'var(--card-bg)',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px 0 rgba(30,60,114,0.25), 0 2px 8px 0 rgba(30,60,114,0.18)',
                    border: '1px solid #282829',
                    padding: '32px 24px'
                }} className="verification-card">
                    {renderContent()}

                    {showResendForm && (
                        <div style={{ marginTop: '24px', borderTop: '1px solid #444', paddingTop: '24px' }}>
                            <h3 style={{ 
                                fontSize: '1.125rem', 
                                fontWeight: 600, 
                                marginBottom: '16px', 
                                color: 'var(--text)' 
                            }}>
                                Resend Verification Email
                            </h3>
                            <form onSubmit={handleResendVerification}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label htmlFor="email" style={{ 
                                        display: 'block', 
                                        fontSize: '0.875rem', 
                                        fontWeight: 500, 
                                        marginBottom: '8px',
                                        color: 'var(--text)'
                                    }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            background: 'var(--bg)',
                                            color: 'var(--text)',
                                            boxSizing: 'border-box'
                                        }}
                                        placeholder="Enter your email address"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={resendStatus === 'sending'}
                                    style={{
                                        width: '100%',
                                        background: resendStatus === 'sending' ? '#666' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: resendStatus === 'sending' ? 'not-allowed' : 'pointer',
                                        opacity: resendStatus === 'sending' ? 0.5 : 1
                                    }}
                                >
                                    {resendStatus === 'sending' ? 'Sending...' : 'Send Verification Email'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <style>{`
          /* Mobile Styles */
          @media (max-width: 768px) {
            .page-header {
              margin-bottom: 20px !important;
            }
            
            .page-header h1 {
              font-size: 1.5rem !important;
              margin-bottom: 4px !important;
            }
            
            .verification-card {
              padding: 20px 16px !important;
              border-radius: 12px !important;
            }
            
            div[style*="width: 64px"] {
              width: 48px !important;
              height: 48px !important;
            }
            
            div[style*="margin: 0 auto 16px"] {
              margin: 0 auto 12px !important;
            }
            
            h2[style*="fontSize: '1.25rem'"] {
              font-size: 1.1rem !important;
              margin-bottom: 12px !important;
            }
            
            p[style*="marginBottom: '16px'"] {
              margin-bottom: 12px !important;
              font-size: 0.9rem !important;
            }
            
            p[style*="marginBottom: '24px'"] {
              margin-bottom: 16px !important;
              font-size: 0.85rem !important;
            }
            
            button[style*="padding: '12px 24px'"] {
              padding: 10px 20px !important;
              font-size: 0.9rem !important;
            }
            
            div[style*="marginTop: '24px'"] {
              margin-top: 16px !important;
            }
            
            div[style*="paddingTop: '24px'"] {
              padding-top: 16px !important;
            }
            
            div[style*="marginBottom: '16px'"] {
              margin-bottom: 10px !important;
            }
            
            input[style*="padding: '8px 12px'"] {
              padding: 6px 10px !important;
              font-size: 0.9rem !important;
            }
            
            button[style*="padding: '12px'"] {
              padding: 10px !important;
              font-size: 0.9rem !important;
            }
            
            h3[style*="marginBottom: '16px'"] {
              margin-bottom: 12px !important;
              font-size: 1rem !important;
            }
            
            label[style*="marginBottom: '8px'"] {
              margin-bottom: 6px !important;
              font-size: 0.8rem !important;
            }
            
            span[style*="fontSize: '32px'"] {
              font-size: 24px !important;
            }
            
            p[style*="fontSize: '0.875rem'"] {
              font-size: 0.75rem !important;
            }
            
            button[style*="fontSize: '0.875rem'"] {
              font-size: 0.8rem !important;
            }
          }
          
          /* Desktop Compact Styles */
          @media (min-width: 769px) {
            .page-header {
              margin-bottom: 20px !important;
            }
            
            .page-header h1 {
              font-size: 1.75rem !important;
              margin-bottom: 6px !important;
            }
            
            .verification-card {
              padding: 24px 20px !important;
              border-radius: 14px !important;
            }
            
            div[style*="width: 64px"] {
              width: 52px !important;
              height: 52px !important;
            }
            
            div[style*="margin: 0 auto 16px"] {
              margin: 0 auto 12px !important;
            }
            
            h2[style*="fontSize: '1.25rem'"] {
              font-size: 1.15rem !important;
              margin-bottom: 12px !important;
            }
            
            p[style*="marginBottom: '16px'"] {
              margin-bottom: 12px !important;
              font-size: 0.95rem !important;
            }
            
            p[style*="marginBottom: '24px'"] {
              margin-bottom: 16px !important;
              font-size: 0.85rem !important;
            }
            
            button[style*="padding: '12px 24px'"] {
              padding: 10px 20px !important;
              font-size: 0.95rem !important;
            }
            
            div[style*="marginTop: '24px'"] {
              margin-top: 16px !important;
            }
            
            div[style*="paddingTop: '24px'"] {
              padding-top: 16px !important;
            }
            
            div[style*="marginBottom: '16px'"] {
              margin-bottom: 10px !important;
            }
            
            h3[style*="marginBottom: '16px'"] {
              margin-bottom: 12px !important;
              font-size: 1rem !important;
            }
            
            label[style*="marginBottom: '8px'"] {
              margin-bottom: 6px !important;
              font-size: 0.8rem !important;
            }
            
            span[style*="fontSize: '32px'"] {
              font-size: 28px !important;
            }
            
            button[style*="fontSize: '0.875rem'"] {
              font-size: 0.8rem !important;
            }
          }
          
          /* Extra Small Mobile */
          @media (max-width: 480px) {
            .verification-card {
              padding: 16px 12px !important;
            }
            
            .page-header h1 {
              font-size: 1.3rem !important;
            }
            
            div[style*="width: 64px"] {
              width: 44px !important;
              height: 44px !important;
            }
            
            span[style*="fontSize: '32px'"] {
              font-size: 20px !important;
            }
            
            h2[style*="fontSize: '1.25rem'"] {
              font-size: 1rem !important;
            }
            
            button[style*="padding: '12px 24px'"] {
              padding: 8px 16px !important;
              font-size: 0.85rem !important;
            }
            
            p[style*="marginBottom: '16px'"] {
              font-size: 0.85rem !important;
            }
          }
        `}</style>
        </div>
    );
};

export default VerifyEmail;
