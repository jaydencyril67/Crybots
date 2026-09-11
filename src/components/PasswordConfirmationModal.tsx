import React, { useState } from 'react';
import { FaLock, FaShieldAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string, confirmPassword: string) => void;
  loading?: boolean;
  error?: string;
  userInfo?: {
    name: string;
    email: string;
  };
}

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = '',
  userInfo
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(true);
  const [passwordMatch, setPasswordMatch] = useState(true);

  // Password validation: min 8 chars, at least 1 letter and 1 number, must not match any filled detail
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return false;
    if (!/[A-Za-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    // Check if password matches user details (name or email)
    if (userInfo) {
      const details = [userInfo.name, userInfo.email].map(d => d.trim().toLowerCase()).filter(Boolean);
      if (details.some(d => d && pwd.trim().toLowerCase() === d)) return false;
    }
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordValid(validatePassword(value));
    setPasswordMatch(value === confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(password === value);
    setPasswordValid(validatePassword(password));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && confirmPassword && passwordValid && passwordMatch) {
      onSubmit(password, confirmPassword);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000,
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.15s ease'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--card-bg)',
          borderRadius: window.innerWidth <= 480 ? '8px' : '12px',
          padding: window.innerWidth <= 480 ? '12px' : '16px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--secondary)',
          maxWidth: window.innerWidth <= 480 ? '95vw' : '380px',
          width: '100%',
          textAlign: 'center',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: window.innerWidth <= 480 ? '10px' : '0',
          animation: 'slideUp 0.15s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '20px' }}>🔐</span>
            <span style={{ 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              color: 'var(--text)' 
            }}>
              Complete Your Registration
            </span>
          </div>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.85rem',
            margin: 0
          }}>
            Set a password for your TradeSpot account
          </p>
        </div>

        {/* User Info Display */}
        {userInfo && (
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--secondary)',
            borderRadius: '6px',
            padding: '8px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text)', 
              fontWeight: 500,
              marginBottom: '2px'
            }}>
              {userInfo.name}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)' 
            }}>
              {userInfo.email}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(248, 113, 113, 0.1)',
            color: 'var(--error-color)',
            border: '1px solid var(--error-color)',
            fontSize: '0.8rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <FaExclamationTriangle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Password Input */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              position: 'relative',
              marginBottom: '8px'
            }}>
              <FaLock style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--secondary)',
                fontSize: '14px'
              }} />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Create a strong password"
                required
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  padding: window.innerWidth <= 480 ? '14px 14px 14px 44px' : '12px 12px 12px 40px', 
                  borderRadius: '8px', 
                  border: passwordValid || password === '' ? '1px solid var(--secondary)' : '1.5px solid #e74c3c', 
                  fontSize: window.innerWidth <= 480 ? '1rem' : '0.9rem', 
                  background: 'var(--bg)', 
                  color: 'var(--text)',
                  transition: 'all 0.2s ease',
                  minHeight: window.innerWidth <= 480 ? '48px' : 'auto',
                  boxShadow: passwordValid || password === '' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 0 0 2px rgba(231, 76, 60, 0.3), 0 2px 8px rgba(231, 76, 60, 0.2)'
                }}
              />
            </div>
            {!passwordValid && password !== '' && (
              <div style={{ 
                color: 'var(--error-color)', 
                fontSize: '0.8rem', 
                textAlign: 'left',
                marginTop: '4px'
              }}>
                Password must be at least 8 characters, contain at least 1 letter and 1 number, and must not match any of your details.
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              position: 'relative',
              marginBottom: '8px'
            }}>
              <FaShieldAlt style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--secondary)',
                fontSize: '14px'
              }} />
              <input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                required
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  padding: window.innerWidth <= 480 ? '14px 14px 14px 44px' : '12px 12px 12px 40px', 
                  borderRadius: '8px', 
                  border: passwordMatch || confirmPassword === '' ? '1px solid var(--secondary)' : '1.5px solid #e74c3c', 
                  fontSize: window.innerWidth <= 480 ? '1rem' : '0.9rem', 
                  background: 'var(--bg)', 
                  color: 'var(--text)',
                  transition: 'all 0.2s ease',
                  minHeight: window.innerWidth <= 480 ? '48px' : 'auto',
                  boxShadow: passwordMatch || confirmPassword === '' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 0 0 2px rgba(231, 76, 60, 0.3), 0 2px 8px rgba(231, 76, 60, 0.2)'
                }}
              />
            </div>
            {!passwordMatch && confirmPassword !== '' && (
              <div style={{ 
                color: 'var(--error-color)', 
                fontSize: '0.8rem', 
                textAlign: 'left',
                marginTop: '4px'
              }}>
                Passwords do not match.
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center'
          }}>
            <button 
              type="submit"
              disabled={loading || !password || !confirmPassword || !passwordValid || !passwordMatch}
              style={{
                background: loading || !password || !confirmPassword || !passwordValid || !passwordMatch ? 'var(--secondary)' : 'var(--primary)',
                color: 'var(--button-text)',
                border: 'none',
                padding: window.innerWidth <= 480 ? '12px 24px' : '10px 20px',
                borderRadius: '8px',
                fontSize: window.innerWidth <= 480 ? '0.8rem' : '0.75rem',
                fontWeight: 500,
                cursor: loading || !password || !confirmPassword || !passwordValid || !passwordMatch ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading || !password || !confirmPassword || !passwordValid || !passwordMatch ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: window.innerWidth <= 480 ? '44px' : 'auto',
                width: '100%'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '10px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating Account...
                </>
              ) : (
                <>
                  <FaCheckCircle size={14} />
                  Complete Registration
                </>
              )}
            </button>
          </div>
        </form>

        {/* CSS Animation for spinner */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
        `}</style>
      </div>
    </div>
  );
};

export default PasswordConfirmationModal;
