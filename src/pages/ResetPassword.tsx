import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_BASE_URL;

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
      // Validate token on mount
      fetch(`${API}/api/auth/validate-reset-token?token=${t}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setTokenValid(true);
          } else {
            setTokenValid(false);
            setError(data.error || 'Invalid or expired token.');
          }
        })
        .catch(() => {
          setTokenValid(false);
          setError('Could not validate token.');
        });
    } else {
      setTokenValid(false);
      setError('Invalid or missing token.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {

      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Show success for 3 seconds, then redirect to dashboard
        setTimeout(() => {
          window.location.href = 'https://tradespot.online/r';
        }, 3000);
      } else {
        // Show a more specific error if token is invalid/expired
        if (data.error && data.error.toLowerCase().includes('token')) {
          setTokenValid(false);
          setError('Invalid or expired token. Please request a new password reset link.');
        } else {
          setError(data.error || 'Reset failed.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirm;

  if (tokenValid === false) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg)',
        padding: '8px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 6px rgba(244, 67, 54, 0.15)',
          border: 'none',
          textAlign: 'center',
          maxWidth: '340px',
          width: '100%',
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>❌</div>
          <h3 style={{ 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            marginBottom: '6px',
            color: 'var(--text)'
          }}>
            Invalid Token
          </h3>
          <p style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text)',
            lineHeight: '1.3',
            marginBottom: '10px'
          }}>
            {error || 'Invalid or expired token.'}
          </p>
          <a
            href="/fp"
            style={{
              background: 'var(--secondary)',
              color: 'var(--button-text)',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Request New Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      {/* Header */}

      {/* Main Content */}
      <div style={{
        padding: '8px',
        paddingTop: '60px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 120px)',
        maxWidth: '360px',
        margin: '0 auto',
        padding: '8px'
      }}>
        
        {success ? (
          <div style={{ 
            background: 'var(--card-bg)', 
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 6px rgba(16, 201, 143, 0.15)',
            border: 'none',
            textAlign: 'center',
            width: '100%',
            animation: 'slideIn 0.3s ease'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✅</div>
            <h3 style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              marginBottom: '6px',
              color: 'var(--text)'
            }}>
              Password Reset Successfully!
            </h3>
            <p style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text)',
              lineHeight: '1.3',
              marginBottom: '10px'
            }}>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <a
              href="/l"
              style={{
                background: 'var(--secondary)',
                color: 'var(--button-text)',
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Go to Login
            </a>
          </div>
        ) : (
          <div style={{ 
            background: 'var(--card-bg)', 
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            border: 'none',
            width: '100%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🔑</div>
              <h3 style={{ 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                marginBottom: '4px',
                color: 'var(--text)'
              }}>
                Create New Password
              </h3>
              <p style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)',
                lineHeight: '1.3'
              }}>
                Enter your new password below
              </p>
            </div>

            {error && (
              <div style={{
                background: '#f44336',
                color: 'white',
                padding: '8px 10px',
                borderRadius: '6px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                animation: 'slideIn 0.3s ease',
                fontSize: '0.8rem'
              }}>
                <span>❌</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* New Password Input */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 2px 6px rgba(120, 140, 180, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                  }}
                  placeholder="Enter new password"
                />
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)',
                  marginTop: '2px'
                }}>
                  Minimum 6 characters
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    boxShadow: passwordsMatch && confirm 
                      ? '0 1px 3px rgba(16, 201, 143, 0.18)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 2px 6px rgba(120, 140, 180, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = passwordsMatch && confirm 
                      ? '0 1px 3px rgba(16, 201, 143, 0.18)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)';
                  }}
                  placeholder="Confirm new password"
                />
                {confirm && (
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: passwordsMatch ? '#10c98f' : '#f44336',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{passwordsMatch ? '✅' : '❌'}</span>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !password || !confirm || !passwordsMatch}
                style={{
                  background: loading || !password || !confirm || !passwordsMatch ? 'var(--secondary)' : 'var(--secondary)',
                  color: 'var(--button-text)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: loading || !password || !confirm || !passwordsMatch ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: loading || !password || !confirm || !passwordsMatch ? 0.7 : 1
                }}
              >
                {loading ? (
                  <>
                    <span className="loading-dots">...</span>
                    Resetting...
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    Reset Password
                  </>
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '12px',
              paddingTop: '10px'
            }}>
              <a
                href="/login"
                style={{
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                ← Back to Login
              </a>
            </div>
          </div>
        )}
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
          
          @media (max-width: 480px) {
            div[style*="padding: 16px"] {
              padding: 8px !important;
            }
            
            div[style*="padding: 24px"] {
              padding: 12px !important;
            }
            
            div[style*="font-size: 1.1rem"] {
              font-size: 0.95rem !important;
            }
            
            div[style*="font-size: 0.85rem"] {
              font-size: 0.8rem !important;
            }
            
            div[style*="font-size: 0.9rem"] {
              font-size: 0.85rem !important;
            }
          }
        `}
      </style>
      </div>
    </div>
  );
};

export default ResetPassword;
