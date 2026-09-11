import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerificationCode } from '../services/api';
import { sendFundsPrivacyVerificationCode, verifyFundsEmailCode, verifyFundsPrivacy, getPortfolio } from '../services/api';
import { changeName, changeEmail } from '../services/api';
import { changePassword } from '../services/api';
import './PrivacySettings.css';
import { useTheme } from '../ThemeContext';

const PrivacySettings: React.FC<{ onClose?: () => void; onNavigateToSubPage?: (page: string) => void }> = ({ onClose, onNavigateToSubPage }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showFundsPrivacyDropdown, setShowFundsPrivacyDropdown] = useState(false);
  const [fundsEmailCode, setFundsEmailCode] = useState('');
  const [funds2fa, setFunds2fa] = useState('');
  const [codeValid, setCodeValid] = useState<null | boolean>(null);
  const [emailCodeVerified, setEmailCodeVerified] = useState(false);
  const [step, setStep] = useState(1); // 1: email code, 2: 2fa
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fundsLocked, setFundsLocked] = useState<boolean | null>(null);
  const [loadingFundsState, setLoadingFundsState] = useState(true);

  const API = process.env.REACT_APP_API_BASE_URL;

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Password match validation
  useEffect(() => {
    setPasswordMatch(newPassword === confirmPassword || confirmPassword === '');
  }, [newPassword, confirmPassword]);

  // Check if new password is different from current password
  const isNewPasswordDifferent = newPassword !== oldPassword;

  // Fetch funds privacy state on component mount
  useEffect(() => {
    const fetchFundsState = async () => {
      try {
        const data = await getPortfolio();
        setFundsLocked(!!data.fundsLocked);
      } catch (error: any) {
        console.error('Error fetching funds state:', error);
        setFundsLocked(false);
      } finally {
        setLoadingFundsState(false);
      }
    };
    fetchFundsState();
  }, []);

  // Add the real API call for password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!oldPassword || !newPassword || !confirmPassword) {
        setError('All fields are required.');
        return;
      }
      if (!passwordMatch || confirmPassword === '') {
        setError('Passwords do not match.');
        return;
      }
      if (newPassword === oldPassword) {
        setError('New password must be different from current password.');
        return;
      }
      await import('../services/api').then(m => m.changePassword(
        oldPassword,
        newPassword,
        confirmPassword
      ));
      setSuccess('Password updated successfully.');
      setShowUpdatePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // Funds Privacy Dropdown: on successful verification, lock funds actions
  const handleFundsPrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const resp = await import('../services/api').then(m => m.verifyFundsPrivacy(
        fundsEmailCode,
        funds2fa
      ));
      setShowFundsPrivacyDropdown(false);
      setFundsEmailCode('');
      setFunds2fa('');
      setSuccess(resp.message || 'Funds privacy verified successfully.');
      
      // Refresh funds state after successful verification
      try {
        const data = await getPortfolio();
        setFundsLocked(!!data.fundsLocked);
      } catch (error) {
        console.error('Error refreshing funds state:', error);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Email code verification (6 digits)
  const verifyEmailCode = async (code: string) => {
    if (code.length === 6) {
      setLoading(true);
      setError(null);
      try {
        // Verify email code against the sent code
        const resp = await verifyFundsEmailCode(code);
        if (resp.success) {
          setEmailCodeVerified(true);
          setStep(2);
          setSuccess('Email code verified! Now enter your 2FA code.');
        }
      } catch (e: any) {
        setError(e?.response?.data?.error || e.message || 'Invalid email code.');
        setFundsEmailCode('');
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 2: 2FA verification (6 digits) - complete funds lock process
  const verify2FAAndComplete = async (code: string) => {
    if (code.length === 6) {
      setLoading(true);
      setError(null);
      try {
        const resp = await import('../services/api').then(m => m.verifyFundsPrivacy(
          fundsEmailCode,
          code
        ));
        setShowFundsPrivacyDropdown(false);
        setFundsEmailCode('');
        setFunds2fa('');
        setEmailCodeVerified(false);
        setStep(1);
        setSuccess(resp.message || 'Funds privacy verified successfully.');
        
        // Refresh funds state after successful verification
        try {
          const data = await getPortfolio();
          setFundsLocked(!!data.fundsLocked);
        } catch (error) {
          console.error('Error refreshing funds state:', error);
        }
      } catch (e: any) {
        setError(e?.response?.data?.error || e.message || 'Invalid 2FA code.');
        setFunds2fa('');
      } finally {
        setLoading(false);
      }
    }
  };

  // Auto-verification handlers
  const handleEmailCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setFundsEmailCode(value);
    if (value.length === 6) {
      await verifyEmailCode(value);
    }
  };

  const handle2FAChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setFunds2fa(value);
    if (value.length === 6) {
      await verify2FAAndComplete(value);
    }
  };


  // Live code validation
  const validateCode = async (value: string) => {
    if (!value) {
      setCodeValid(null);
      return;
    }
    try {
      const response = await fetch(`${API}/api/validate-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value })
      });
      const data = await response.json();
      setCodeValid(data.valid);
    } catch {
      setCodeValid(false);
    }
  };

  return (
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '8px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* Password Settings Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '10px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid transparent',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ 
                fontSize: '0.8rem', 
                fontWeight: 500, 
                color: 'var(--text)',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🔐</span>
                Password
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0
              }}>
                Update your account password
              </p>
            </div>
            {!showUpdatePassword && (
              <button
                onClick={() => setShowUpdatePassword(true)}
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--button-text)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Update
              </button>
            )}
          </div>

          {showUpdatePassword && (
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                placeholder="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--secondary)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem'
                }}
              />
              <div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: newPassword.length > 0 
                      ? (newPassword.length >= 8 && isNewPasswordDifferent 
                          ? '2px solid #27ae60' 
                          : '2px solid #e74c3c')
                      : '1px solid var(--secondary)',
                    background: newPassword.length > 0 
                      ? (newPassword.length >= 8 && isNewPasswordDifferent 
                          ? '#f8fff9' 
                          : '#fdf2f2')
                      : 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                />
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <div style={{
                    color: 'var(--warning-color, #f39c12)',
                    fontSize: '0.7rem',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⚠️</span>
                    Password must be at least 8 characters
                  </div>
                )}
                {newPassword.length >= 8 && !isNewPasswordDifferent && oldPassword.length > 0 && (
                  <div style={{
                    color: 'var(--error-color, #e74c3c)',
                    fontSize: '0.7rem',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>✗</span>
                    New password must be different from current password
                  </div>
                )}
                {newPassword.length >= 8 && isNewPasswordDifferent && (
                  <div style={{
                    color: 'var(--success-color, #27ae60)',
                    fontSize: '0.7rem',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>✓</span>
                    Password length is good and different from current
                  </div>
                )}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: confirmPassword.length > 0 
                      ? (passwordMatch ? '2px solid #27ae60' : '2px solid #e74c3c')
                      : '1px solid var(--secondary)',
                    background: confirmPassword.length > 0 
                      ? (passwordMatch ? '#f8fff9' : '#fdf2f2')
                      : 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                />
                {confirmPassword.length > 0 && (
                  <div style={{
                    color: passwordMatch ? 'var(--success-color, #27ae60)' : 'var(--error-color, #e74c3c)',
                    fontSize: '0.7rem',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{passwordMatch ? '✓' : '✗'}</span>
                    {passwordMatch ? 'Passwords match!' : 'Passwords do not match'}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={loading || !passwordMatch || newPassword.length < 8 || confirmPassword === '' || !isNewPasswordDifferent}
                  style={{
                    background: (!passwordMatch || newPassword.length < 8 || confirmPassword === '' || !isNewPasswordDifferent) 
                      ? '#bdc3c7' 
                      : 'var(--secondary)',
                    color: 'var(--button-text)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: (!passwordMatch || newPassword.length < 8 || confirmPassword === '' || !isNewPasswordDifferent) 
                      ? 'not-allowed' 
                      : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1,
                    opacity: (!passwordMatch || newPassword.length < 8 || confirmPassword === '' || !isNewPasswordDifferent) ? 0.6 : 1
                  }}
                >
                  {loading ? (
                    <>
                      <span className="loading-dots">...</span>
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdatePassword(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError(null);
                  }}
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--secondary)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* KYC verification removed */}

        {/* Funds Privacy Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '10px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--border, rgba(0,0,0,0.1))',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ 
                fontSize: '0.8rem', 
                fontWeight: 500, 
                color: 'var(--text)',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>💰</span>
                Funds Privacy
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0
              }}>
                {loadingFundsState ? 'Loading privacy status...' : 
                 'Manage your funds privacy settings'}
              </p>
            </div>
            {!showFundsPrivacyDropdown && (
              <button
                onClick={async () => {
                  setShowFundsPrivacyDropdown(true);
                  setError(null);
                  setSuccess(null);
                  setLoading(true);
                  try {
                    await sendFundsPrivacyVerificationCode();
                    setSuccess('Verification code sent to your email.');
                  } catch (err: any) {
                    setError(err?.response?.data?.error || err.message || 'Failed to send verification code.');
                    setShowFundsPrivacyDropdown(false);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || loadingFundsState}
                style={{
                  background: fundsLocked ? '#e74c3c' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: (loading || loadingFundsState) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: (loading || loadingFundsState) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {loading ? (
                  <>
                    <span className="loading-dots">...</span>
                  </>
                ) : loadingFundsState ? (
                  <>
                    <span className="loading-dots">...</span>
                  </>
                ) : (
                  <>
                    <span>{fundsLocked ? '🔒' : '🔓'}</span>
                    {fundsLocked ? 'Unlock' : 'Secure'}
                  </>
                )}
              </button>
            )}

            {showFundsPrivacyDropdown && (
              <button
                onClick={() => {
                  setShowFundsPrivacyDropdown(false);
                  setFundsEmailCode('');
                  setFunds2fa('');
                  setEmailCodeVerified(false);
                  setStep(1);
                  setError(null);
                }}
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--secondary)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Cancel
              </button>
            )}
          </div>

            {showFundsPrivacyDropdown && (
            <div className="funds-privacy-inputs-container" style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '6px', 
              marginTop: '12px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Email Code */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit email code"
                  value={fundsEmailCode}
                  onChange={handleEmailCodeChange}
                  disabled={emailCodeVerified}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: emailCodeVerified 
                      ? '2px solid #27ae60' 
                      : '1px solid var(--secondary)',
                    background: emailCodeVerified 
                      ? '#f8fff9' 
                      : 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    opacity: emailCodeVerified ? 0.7 : 1,
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              {/* 2FA Code */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  placeholder={emailCodeVerified ? "Enter 6-digit 2FA code" : "Complete email verification first"}
                  value={funds2fa}
                  onChange={handle2FAChange}
                  disabled={!emailCodeVerified}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--secondary)',
                    background: emailCodeVerified ? 'var(--bg)' : '#f5f5f5',
                    color: 'var(--text)',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    opacity: emailCodeVerified ? 1 : 0.5,
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              {loading && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  width: '100%'
                }}>
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
                  {step === 1 ? 'Verifying email code...' : 'Verifying 2FA code...'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Two-Factor Auth Card */}
        <div 
          onClick={() => onNavigateToSubPage?.('2fa')}
          style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '10px',
            cursor: 'pointer',
            border: '1px solid transparent',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🔐</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: 500, 
                color: 'var(--text)',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Two-Factor Auth
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                lineHeight: '1.2',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                Set up & manage 2FA
              </div>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-muted)',
              opacity: 0.7,
              flexShrink: 0
            }}>
              →
            </div>
          </div>
        </div>

        {/* WebAuthn Keys Card */}
        <div 
          onClick={() => onNavigateToSubPage?.('webauthn')}
          style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '10px',
            cursor: 'pointer',
            border: '1px solid transparent',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🔑</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: 500, 
                color: 'var(--text)',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                WebAuthn Keys
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                lineHeight: '1.2',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                Biometric & security keys
              </div>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-muted)',
              opacity: 0.7,
              flexShrink: 0
            }}>
              →
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
              font-size: 0.75rem !important;
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
              font-size: 8rem !important;
            }
            
            div[style*="font-size: 0.8rem"] {
              font-size: 0.7rem !important;
            }
          }
          
          /* Input field responsive styles for perfect alignment */
          @media (max-width: 768px) {
            input[placeholder*="6-digit"] {
              padding: 8px 12px !important;
              font-size: 0.75rem !important;
              letter-spacing: 3px !important;
            }
            
            /* Stack inputs vertically on mobile for better usability */
            div[style*="flex-direction: row"][style*="gap: 8px"] {
              flex-direction: column !important;
              gap: 8px !important;
            }
          }
          
          @media (max-width: 480px) {
            input[placeholder*="6-digit"] {
              padding: 8px 12px !important;
              font-size: 0.75rem !important;
              letter-spacing: 4px !important;
            }
            
            /* Ensure vertical stacking on small mobile */
            div[style*="flex-direction: row"][style*="gap: 8px"] {
              flex-direction: column !important;
              gap: 6px !important;
            }
          }
        `}
      </style>
      </div>
  );
};

export default PrivacySettings;
