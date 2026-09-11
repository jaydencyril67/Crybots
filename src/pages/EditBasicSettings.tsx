import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { sendNameVerificationCode, changeName, sendEmailVerificationCode, changeEmail, sendSpotIdVerificationCode, changeSpotId, checkSpotIdAvailability } from '../services/api';
import { useTheme } from '../ThemeContext';

const EditBasicSettings: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingSpotId, setEditingSpotId] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSpotId, setNewSpotId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingSpotId, setLoadingSpotId] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [spotIdError, setSpotIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordChecking, setPasswordChecking] = useState(false);
  const [spotIdAvailable, setSpotIdAvailable] = useState<boolean | null>(null);
  const [spotIdCheckLoading, setSpotIdCheckLoading] = useState(false);
  const spotIdCheckRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const API = process.env.REACT_APP_API_BASE_URL;

  // Auto-dismiss success notification after 2.5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API}/api/portfolio`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };
  
  // Name handlers
  const handleEditNameClick = async () => {
    setEditingName(true);
    setError('');
    setSuccess('');
    setNewName('');
    setCode('');
    setLoadingName(true);
    try {
      await sendNameVerificationCode();
      setSuccess('Verification code sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    }
    setLoadingName(false);
  };
  const handleCancelNameEdit = () => {
    setEditingName(false);
    setNewName('');
    setCode('');
    setError('');
    setNameError('');
  };

  // Email handlers
  const handleEditEmailClick = async () => {
    setEditingEmail(true);
    setError('');
    setSuccess('');
    setNewEmail('');
    setPassword('');
    setCode('');
    setLoadingEmail(true);
    try {
      await sendEmailVerificationCode();
      setSuccess('Verification code sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    }
    setLoadingEmail(false);
  };
  const handleCancelEmailEdit = () => {
    setEditingEmail(false);
    setNewEmail('');
    setPassword('');
    setCode('');
    setError('');
    setEmailError('');
    setPasswordError('');
    setPasswordVerified(false);
  };

  // SpotId handlers
  const handleEditSpotIdClick = async () => {
    setEditingSpotId(true);
    setError('');
    setSuccess('');
    setNewSpotId('');
    setCode('');
    setLoadingSpotId(true);
    try {
      await sendSpotIdVerificationCode();
      setSuccess('Verification code sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    }
    setLoadingSpotId(false);
  };
  const handleCancelSpotIdEdit = () => {
    setEditingSpotId(false);
    setNewSpotId('');
    setCode('');
    setError('');
    setSpotIdError('');
  };

  // Name validation function
  const validateName = (name: string) => {
    // Check minimum length
    if (name.length < 3) {
      return 'Name must be at least 3 letters long';
    }
    
    // Check for only letters (including international characters)
    const letterRegex = /^[a-zA-Z\u00C0-\u017F\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F\u1C80-\u1C88\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u2F800-\u2FA1F\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA000-\uA48F\uA490-\uA4CF\u4DC0-\u4DFF\u1F000-\u1F02F\u1F030-\u1F09F\u1F0A0-\u1F0FF\u1F100-\u1F1FF\u1F200-\u1F2FF\u1F300-\u1F5FF\u1F600-\u1F64F\u1F680-\u1F6FF\u1F700-\u1F77F\u1F780-\u1F7FF\u1F800-\u1F8FF\u1F900-\u1F9FF\u1FA00-\u1FA6F\u1FA70-\u1FAFF\u2190-\u21FF\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F\u1F170-\u1F251\u1F300-\u1F5FF\u1F600-\u1F64F\u1F680-\u1F6FF\u1F700-\u1F77F\u1F780-\u1F7FF\u1F800-\u1F8FF\u1F900-\u1F9FF\u1FA00-\u1FA6F\u1FA70-\u1FAFF\u2190-\u21FF\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F\u1F170-\u1F251\s]+$/;
    if (!letterRegex.test(name)) {
      return 'Name can only contain letters and spaces';
    }
    
    // Check for forbidden words
    const forbiddenWords = ['the', 'admin', 'user', 'test', 'null', 'undefined'];
    const lowerName = name.toLowerCase();
    for (const word of forbiddenWords) {
      if (lowerName.includes(word)) {
        return `Name cannot contain "${word}"`;
      }
    }
    
    // Check for special characters
    if (/[@#$%^&*()+=\[\]{}|\\:";'<>?,./0-9]/.test(name)) {
      return 'Name cannot contain numbers or special characters';
    }
    
    return '';
  };

  // Handle name input change with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewName(value);
    
    // Clear previous errors
    setNameError('');
    setError('');
    
    // Validate name
    const validationError = validateName(value);
    if (validationError) {
      setNameError(validationError);
    }
  };

  // Handle verification code change with auto-verification
  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only allow digits, max 6
    setCode(value);
    
    // Auto-verify when 6 digits are entered
    if (value.length === 6 && newName.length >= 3 && !nameError) {
      setLoadingName(true);
      setError('');
      setSuccess('');
      try {
        await changeName(newName, value);
        setSuccess('Name changed successfully!');
        setEditingName(false);
        setNewName('');
        setCode('');
        setNameError('');
      } catch (err: any) {
        setError(err.message || 'Failed to change name.');
        setCode(''); // Clear code on error
      } finally {
        setLoadingName(false);
      }
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This function is now handled by auto-verification
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmail(value);
    
    // Clear previous errors
    setEmailError('');
    setError('');
    setPasswordVerified(false);
    setPasswordError('');
    setPassword('');
    setCode('');
    
    // Validate email
    const validationError = validateEmail(value);
    if (validationError) {
      setEmailError(validationError);
    }
  };

  // Handle password change with live verification
  const handlePasswordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError('');
    
    // Only verify if email is valid and password is 8+ characters
    if (value.length >= 8 && !emailError && newEmail) {
      setPasswordChecking(true);
      try {
        const response = await axios.post(`${API}/api/auth/verify-password`, { password: value }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.verified) {
          setPasswordVerified(true);
          setPasswordError('');
        } else {
          setPasswordVerified(false);
          setPasswordError('Incorrect password');
        }
      } catch (err: any) {
        setPasswordVerified(false);
        setPasswordError('Incorrect password');
      } finally {
        setPasswordChecking(false);
      }
    } else if (value.length > 0 && value.length < 8) {
      setPasswordVerified(false);
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordVerified(false);
      setPasswordError('');
    }
  };

  // Handle verification code change with auto-verification
  const handleEmailCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only allow digits, max 6
    setCode(value);
    
    // Auto-verify when 6 digits are entered and password is verified
    if (value.length === 6 && passwordVerified && !emailError && newEmail) {
      setLoadingEmail(true);
      setError('');
      setSuccess('');
      try {
        await changeEmail(newEmail, password, value);
        setSuccess('Email changed successfully!');
        setEditingEmail(false);
        setNewEmail('');
        setPassword('');
        setCode('');
        setEmailError('');
        setPasswordError('');
        setPasswordVerified(false);
      } catch (err: any) {
        setError(err.message || 'Failed to change email.');
        setCode(''); // Clear code on error
      } finally {
        setLoadingEmail(false);
      }
    }
  };

  // Spot ID validation
  const validateSpotId = (value: string) => {
    if (!/^[0-9]{5}$/.test(value)) {
      return 'Spot ID must be exactly 5 digits';
    }
    return '';
  };

  const handleSpotIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setNewSpotId(value);
    setSpotIdError(validateSpotId(value));
    setError('');
    setSpotIdAvailable(null);
    if (spotIdCheckRef.current) clearTimeout(spotIdCheckRef.current);
    // Only check if 5 digits
    if (/^[0-9]{5}$/.test(value)) {
      setSpotIdCheckLoading(true);
      spotIdCheckRef.current = setTimeout(async () => {
        try {
          const available = await checkSpotIdAvailability(value);
          setSpotIdAvailable(available);
          setSpotIdError(!available ? 'This Spot ID is already taken' : '');
        } catch (err) {
          setSpotIdAvailable(null);
          setSpotIdError('Error checking Spot ID availability');
        }
        setSpotIdCheckLoading(false);
      }, 400);
    } else {
      setSpotIdCheckLoading(false);
      setSpotIdAvailable(null);
    }
  };

  const handleSpotIdCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (value.length === 6 && !spotIdError && newSpotId) {
      setLoadingSpotId(true);
      setError('');
      setSuccess('');
      try {
        await changeSpotId(newSpotId, value);
        setSuccess('Spot ID changed successfully!');
        setEditingSpotId(false);
        setNewSpotId('');
        setCode('');
        setSpotIdError('');
        // Refresh user data to reflect new spotid
        fetchUserData();
      } catch (err: any) {
        setError(err.message || 'Failed to change Spot ID.');
        setCode('');
      } finally {
        setLoadingSpotId(false);
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    setError('');
    setSuccess('');
    try {
      await changeEmail(newEmail, password, code);
      setSuccess('Email changed successfully!');
      setEditingEmail(false);
    } catch (err: any) {
      setError(err.message || 'Failed to change email.');
    }
    setLoadingEmail(false);
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
          fontSize: '0.75rem'
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
          fontSize: '0.75rem'
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
        
        {/* Name Settings Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '14px',
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
                <span>📝</span>
                Display Name
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0
              }}>
                Update your display name
              </p>
            </div>
            {!editingName ? (
              <button
                onClick={handleEditNameClick}
                disabled={loadingName}
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
                {loadingName ? 'Sending...' : 'Edit'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelNameEdit}
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
                Cancel
              </button>
            )}
          </div>

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
          {editingName && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="New Display Name"
                value={newName}
                onChange={handleNameChange}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: nameError ? '1px solid #e74c3c' : '1px solid var(--secondary)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem'
                }}
              />
              {nameError && (
                <div style={{
                  color: 'var(--error-color, #e74c3c)',
                  fontSize: '0.7rem',
                  marginTop: '-5px'
                }}>
                  {nameError}
                </div>
              )}
              <input
                type="text"
                placeholder="Verification Code"
                value={code}
                onChange={handleCodeChange}
                disabled={newName.length < 3 || !!nameError}
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--secondary)',
                  background: newName.length < 3 || nameError ? '#f5f5f5' : 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                  opacity: newName.length < 3 || nameError ? 0.5 : 1,
                  cursor: newName.length < 3 || nameError ? 'not-allowed' : 'text'
                }}
              />
              {newName.length < 3 && !nameError && (
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  marginTop: '-5px'
                }}>
                  Enter at least 3 letters to enable verification
                </div>
              )}
              {loadingName && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem'
                }}>
                  <span className="loading-dots">...</span>
                  Verifying code...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Settings Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '14px',
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
                <span>📧</span>
                Email Address
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0
              }}>
                Update your email address
              </p>
            </div>
            {!editingEmail ? (
              <button
                onClick={handleEditEmailClick}
                disabled={loadingEmail}
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
                {loadingEmail ? 'Sending...' : 'Edit'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEmailEdit}
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
                Cancel
              </button>
            )}
          </div>

          {editingEmail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="email"
                placeholder="New Email Address"
                value={newEmail}
                onChange={handleEmailChange}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: emailError ? '1px solid #e74c3c' : '1px solid var(--secondary)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem'
                }}
              />
              {emailError && (
                <div style={{
                  color: 'var(--error-color, #e74c3c)',
                  fontSize: '0.7rem',
                  marginTop: '-5px'
                }}>
                  {emailError}
                </div>
              )}
              <input
                type="password"
                placeholder="Current Password"
                value={password}
                onChange={handlePasswordChange}
                disabled={!newEmail || !!emailError}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: passwordVerified ? '2px solid #27ae60' : passwordError ? '1px solid #e74c3c' : '1px solid var(--secondary)',
                  background: !newEmail || emailError ? '#f5f5f5' : 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                  opacity: !newEmail || emailError ? 0.5 : 1,
                  cursor: !newEmail || emailError ? 'not-allowed' : 'text'
                }}
              />
              {passwordError && (
                <div style={{
                  color: 'var(--error-color, #e74c3c)',
                  fontSize: '0.7rem',
                  marginTop: '-5px'
                }}>
                  {passwordError}
                </div>
              )}
              {passwordChecking && (
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  marginTop: '-5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span className="loading-dots">...</span>
                  Verifying password...
                </div>
              )}
              {!newEmail && (
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  marginTop: '-5px'
                }}>
                  Enter a valid email address to enable password field
                </div>
              )}
              <input
                type="text"
                placeholder="Verification Code"
                value={code}
                onChange={handleEmailCodeChange}
                disabled={!passwordVerified || !newEmail || !!emailError}
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--secondary)',
                  background: !passwordVerified || !newEmail || emailError ? '#f5f5f5' : 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                  opacity: !passwordVerified || !newEmail || emailError ? 0.5 : 1,
                  cursor: !passwordVerified || !newEmail || emailError ? 'not-allowed' : 'text'
                }}
              />
              {!passwordVerified && newEmail && !emailError && (
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  marginTop: '-5px'
                }}>
                  Verify your password to enable verification code
                </div>
              )}
              {loadingEmail && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem'
                }}>
                  <span className="loading-dots">...</span>
                  Verifying code...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spot ID Settings Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '14px',
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
                <span>#️⃣</span>
                Spot ID
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                margin: 0
              }}>
                Your current Spot ID: <b>{userData?.spotid || '—'}</b>
              </p>
            </div>
            {!editingSpotId ? (
              <button
                onClick={handleEditSpotIdClick}
                disabled={loadingSpotId}
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
                {loadingSpotId ? 'Sending...' : 'Edit'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelSpotIdEdit}
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
                Cancel
              </button>
            )}
          </div>

          {editingSpotId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="New 5-digit Spot ID"
                value={newSpotId}
                onChange={handleSpotIdChange}
                maxLength={5}
                inputMode="numeric"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: spotIdError ? '1px solid #e74c3c' : '1px solid var(--secondary)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem'
                }}
              />
              {spotIdCheckLoading && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '-5px' }}>
                  Checking availability...
                </div>
              )}
              {!spotIdCheckLoading && spotIdAvailable === true && !spotIdError && newSpotId.length === 5 && (
                <div style={{ color: '#27ae60', fontSize: '0.7rem', marginTop: '-5px' }}>
                  Spot ID is available
                </div>
              )}
              {spotIdError && !spotIdCheckLoading && (
                <div style={{ color: 'var(--error-color, #e74c3c)', fontSize: '0.7rem', marginTop: '-5px' }}>
                  {spotIdError}
                </div>
              )}
              <input
                type="text"
                placeholder="Verification Code"
                value={code}
                onChange={handleSpotIdCodeChange}
                disabled={!!spotIdError || !spotIdAvailable || newSpotId.length !== 5 || spotIdCheckLoading}
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--secondary)',
                  background: (!!spotIdError || !spotIdAvailable || newSpotId.length !== 5 || spotIdCheckLoading) ? '#f5f5f5' : 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                  opacity: (!!spotIdError || !spotIdAvailable || newSpotId.length !== 5 || spotIdCheckLoading) ? 0.5 : 1,
                  cursor: (!!spotIdError || !spotIdAvailable || newSpotId.length !== 5 || spotIdCheckLoading) ? 'not-allowed' : 'text'
                }}
              />
              {loadingSpotId && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem'
                }}>
                  <span className="loading-dots">...</span>
                  Verifying code...
                </div>
              )}
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
            
            div[style*="padding: 14px"] {
              padding: 12px !important;
            }
            
            div[style*="font-size: 8rem"] {
              font-size: 0.75rem !important;
            }
            
            div[style*="font-size: 0.8rem"] {
              font-size: 0.75rem !important;
            }
            
            div[style*="font-size: 0.75rem"] {
              font-size: 0.7rem !important;
            }
            
            /* Edit buttons mobile styles */
            button[style*="padding: 6px 12px"][style*="font-size: 0.75rem"] {
              padding: 7px 14px !important;
              font-size: 0.8rem !important;
              min-height: 24px !important;
              border-radius: 8px !important;
            }
          }
          
          @media (max-width: 480px) {
            div[style*="padding: 14px"] {
              padding: 8px !important;
            }
            
            div[style*="padding: 12px 16px"] {
              padding: 10px 12px !important;
            }
            
            div[style*="font-size: 0.8rem"] {
              font-size: 0.75rem !important;
            }
            
            div[style*="font-size: 0.8rem"] {
              font-size: 0.7rem !important;
            }
            
            /* Edit buttons small mobile styles */
            button[style*="padding: 6px 12px"][style*="font-size: 0.75rem"] {
              padding: 7px 14px !important;
              font-size: 0.75rem !important;
              min-height: 24px !important;
              border-radius: 7px !important;
            }
          }
          
          @media (max-width: 360px) {
            div[style*="padding: 16px"] {
              padding: 6px !important;
            }
            
            div[style*="font-size: 8rem"] {
              font-size: 0.75rem !important;
            }
            
            
            /* Edit buttons extra small mobile styles */
            button[style*="padding: 6px 12px"][style*="font-size: 0.75rem"] {
              padding: 6px 12px !important;
              font-size: 0.7rem !important;
              min-height: 24px !important;
              border-radius: 6px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EditBasicSettings;
