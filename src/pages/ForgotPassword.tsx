import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import '../theme.css';

const API = process.env.REACT_APP_API_BASE_URL;

const ForgotPassword: React.FC = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [spotid, setSpotid] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        window.location.href = '/l';
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, spotid }),
      });
      await res.json();
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      {/* Header */}

      {/* Main Content */}
      <div style={{
        padding: '12px',
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
        minHeight: 'calc(100vh - 100px)',
        maxWidth: '320px',
        margin: '0 auto',
        padding: '12px'
      }}>
        
        {submitted ? (
          <div style={{ 
            background: 'var(--card-bg)', 
            borderRadius: '8px',
            padding: '16px',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid #10c98f',
            textAlign: 'center',
            width: '100%',
            animation: 'slideIn 0.3s ease'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📧</div>
            <h3 style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              marginBottom: '8px',
              color: 'var(--text)'
            }}>
              Reset Link Sent!
            </h3>
            <p style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text)',
              lineHeight: '1.3',
              marginBottom: '12px'
            }}>
              If the details provided are correct, a password reset link will be sent to your email. Please check your inbox and follow the instructions to reset your password.
            </p>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              background: 'var(--bg)',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid var(--secondary)'
            }}>
              Didn't receive the email? Check your spam folder.
            </div>
          </div>
        ) : (
          <div style={{ 
            background: 'var(--card-bg)', 
            borderRadius: '8px',
            padding: '16px',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid transparent',
            width: '100%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔑</div>
              <h3 style={{ 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                marginBottom: '6px',
                color: 'var(--text)'
              }}>
                Reset Your Password
              </h3>
              <p style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)',
                lineHeight: '1.3'
              }}>
                Enter your email and Spot ID to receive a password reset link
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#f44336',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '12px',
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Email Input */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid var(--secondary)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid var(--primary)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(120, 140, 180, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid var(--secondary)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your email address"
                />
              </div>

              {/* Spot ID Input */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  Spot ID
                </label>
                <input
                  type="text"
                  value={spotid}
                  onChange={(e) => setSpotid(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid var(--secondary)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid var(--primary)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(120, 140, 180, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid var(--secondary)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your Spot ID"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--button-text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: loading ? 0.7 : 1
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
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Send Reset Link
                  </>
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--secondary)'
            }}>
              <a
                href="/l"
                style={{
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  
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
              padding: 12px !important;
            }
            
            div[style*="padding: 24px"] {
              padding: 20px !important;
            }
            
            div[style*="font-size: 1.1rem"] {
              font-size: 1rem !important;
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

export default ForgotPassword;
