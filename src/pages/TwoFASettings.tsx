import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../ThemeContext';
import '../theme.css';

const API = process.env.REACT_APP_API_BASE_URL;

const TwoFASettings: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [qr, setQr] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API}/api/2fa/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setEnabled(res.data.enabled);
        if (res.data.enabled) {
          setQr(null);
          setOtpauth(null);
        }
      } catch (e: any) {
        setError(e.response?.data?.error || 'Failed to fetch 2FA status');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetch2FASetup = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API}/api/2fa/setup`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQr(res.data.qr);
      setOtpauth(res.data.otpauth);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post(`${API}/api/2fa/verify`, { token }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setEnabled(true);
      setMessage('2FA enabled successfully!');
      setQr(null);
      setOtpauth(null);
      setToken('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when 6-digit code is entered
  const handleTokenChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only allow digits, max 6
    setToken(value);
    
    // Auto-verify when 6 digits are entered
    if (value.length === 6) {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        await axios.post(`${API}/api/2fa/verify`, { token: value }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setEnabled(true);
        setMessage('2FA enabled successfully!');
        setQr(null);
        setOtpauth(null);
        setToken('');
      } catch (e: any) {
        setError(e.response?.data?.error || 'Failed to verify 2FA');
        setToken(''); // Clear the token on error
      } finally {
        setLoading(false);
      }
    }
  };

  const disable2FA = async (code?: string) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const useToken = (code ?? token);
      await axios.post(`${API}/api/2fa/disable`, { token: useToken }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setEnabled(false);
      setMessage('2FA disabled successfully!');
      setToken('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Auto-disable when 6-digit code is entered (when 2FA is currently enabled)
  const handleDisableTokenChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setToken(value);
    if (value.length === 6) {
      await disable2FA(value);
    }
  };

  const copySecret = async () => {
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        setError('Failed to copy secret to clipboard');
      }
    }
  };

  const secret = (() => {
    if (otpauth) {
      try {
        const url = new URL(otpauth);
        const params = new URLSearchParams(url.search);
        return params.get('secret') || '';
      } catch {
        return '';
      }
    }
    return '';
  })();

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '12px' : '24px',
      maxWidth: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>

      {/* Success/Error Messages */}
      {message && (
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
          {message}
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
        
        {/* 2FA Status Card */}
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
                Google Authenticator
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0
              }}>
                {enabled ? '2FA is currently enabled' : 'Add extra security layer'}
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '12px',
              background: enabled ? '#4CAF50' : '#ff9800',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 500
            }}>
              <span>{enabled ? '🔒' : '⚠️'}</span>
              {enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {enabled ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--bg)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--secondary)'
              }}>
                <h4 style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: '6px'
                }}>
                  Disable 2FA
                </h4>
                <p style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)',
                  marginBottom: '12px'
                }}>
                  Enter your 2FA token to disable
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={token}
                    onChange={handleDisableTokenChange}
                    placeholder="Enter 6-digit code"
                    style={{
                      flex: 1,
                      padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--secondary)',
                      background: 'var(--card-bg)',
                      color: 'var(--text)',
                      fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                      boxSizing: 'border-box',
                      minHeight: window.innerWidth <= 480 ? '32px' : 'auto',
                      textAlign: 'center',
                      letterSpacing: '1px'
                    }}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!qr ? (
                <button
                  onClick={fetch2FASetup}
                  disabled={loading}
                  className="twofa-enable-btn"
                  style={{
                    background: 'var(--secondary)',
                    color: 'var(--button-text)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                    fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                  }}
                >
                  <span>🔐</span>
                  {loading ? <span className="loading-dots">....</span> : 'Enable 2FA'}
                </button>
              ) : (
                <div style={{
                  background: 'var(--bg)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--secondary)',
                  textAlign: 'center'
                }}>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: 'var(--text)',
                    marginBottom: '12px'
                  }}>
                    Set up Google Authenticator
                  </h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <img 
                      src={qr} 
                      alt="2FA QR Code" 
                      style={{
                        maxWidth: '150px',
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '2px solid var(--secondary)'
                      }}
                    />
                  </div>
                  
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    marginBottom: '12px'
                  }}>
                    Scan QR code with Google Authenticator
                  </p>
                  
                  {secret && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-muted)',
                        marginBottom: '6px'
                      }}>
                        Or enter secret manually:
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <code style={{
                          background: 'var(--card-bg)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          color: 'var(--text)',
                          border: '1px solid var(--secondary)',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {secret}
                        </code>
                        <button
                          onClick={copySecret}
                          title={copied ? 'Copied!' : 'Copy secret'}
                          style={{
                            background: copied ? '#4CAF50' : 'var(--secondary)',
                            color: 'var(--button-text)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                          }}
                        >
                          <span>{copied ? '✓' : '📋'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={token}
                      onChange={handleTokenChange}
                      placeholder="Enter 6-digit code"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--secondary)',
                        background: 'var(--card-bg)',
                        color: 'var(--text)',
                        fontSize: '0.8rem',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        letterSpacing: '1px'
                      }}
                    />
                    <button
                      onClick={() => {
                        setQr(null);
                        setOtpauth(null);
                        setToken('');
                        setError('');
                      }}
                      className="twofa-enable-btn"
                      style={{
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--secondary)',
                        borderRadius: '8px',
                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                        fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                      }}
                    >
                      <span>❌</span>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Tips Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid transparent',
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
            <span>💡</span>
            Security Tips
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '14px', marginTop: '2px' }}>🔐</span>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: '1.4'
              }}>
                Keep your 2FA secret key safe and never share it
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '14px', marginTop: '2px' }}>📱</span>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: '1.4'
              }}>
                Use Google Authenticator or similar apps
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '14px', marginTop: '2px' }}>⚠️</span>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: '1.4'
              }}>
                Contact support if you lose access to 2FA device
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style>
        {`
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
            
            div[style*="font-size: 0.9rem"] {
              font-size: 0.8rem !important;
            }
            
            div[style*="font-size: 0.75rem"] {
              font-size: 0.7rem !important;
            }
            
            img[style*="max-width: 150px"] {
              max-width: 120px !important;
            }
            
            code[style*="max-width: 120px"] {
              max-width: 100px !important;
              font-size: 0.7rem !important;
            }
            
            .twofa-enable-btn {
              padding: 6px 12px !important;
              font-size: 0.7rem !important;
              border-radius: 6px !important;
              min-height: 32px !important;
            }
            
            /* Horizontal layout for mobile */
            div[style*="display: flex"][style*="gap: 8px"][style*="alignItems: center"] {
              flex-direction: column !important;
              gap: 6px !important;
            }
            
            div[style*="flex: 1"] {
              width: 100% !important;
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
            
            img[style*="max-width: 150px"] {
              max-width: 100px !important;
            }
            
            .twofa-enable-btn {
              padding: 5px 10px !important;
              font-size: 0.65rem !important;
              border-radius: 5px !important;
              min-height: 30px !important;
            }
            
            /* Ensure horizontal layout works on small mobile */
            div[style*="display: flex"][style*="gap: 8px"][style*="alignItems: center"] {
              flex-direction: column !important;
              gap: 4px !important;
            }
            
            input[style*="flex: 1"] {
              padding: 8px 10px !important;
              font-size: 0.8rem !important;
            }
            
            button[style*="padding: 8px 16px"] {
              padding: 4px 8px !important;
              font-size: 0.7rem !important;
            }
          }
          
          @media (max-width: 360px) {
            .twofa-enable-btn {
              padding: 4px 8px !important;
              font-size: 0.6rem !important;
              border-radius: 4px !important;
              min-height: 28px !important;
            }
            
            /* Extra compact buttons for very small screens */
            button[style*="padding: 8px 12px"] {
              padding: 3px 6px !important;
              font-size: 0.6rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default TwoFASettings;