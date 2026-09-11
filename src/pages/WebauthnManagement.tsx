import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import '../theme.css';

const API = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';

const actions = [
  { key: 'login', label: 'Login', icon: '🔐', description: 'Use Biometric Security for secure login' },
  { key: 'transfer', label: 'Transfer', icon: '💸', description: 'Use Biometric Security for fund transfers' },
  { key: 'withdraw', label: 'Withdraw', icon: '💰', description: 'Use Biometric Security for withdrawals' },
  { key: 'wallet', label: 'Wallet Binding', icon: '💳', description: 'Use Biometric Security for wallet address changes' },
];

const WebauthnManagement: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showDeregisterModal, setShowDeregisterModal] = useState(false);
  const [deregisterLoading, setDeregisterLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    // Fetch user info from backend
    fetch(API + '/api/me', {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setIsRegistered(!!(data.webauthnCredentials && data.webauthnCredentials.length > 0));
        setUserEmail(data.email || null);
      })
      .catch(() => {
        setIsRegistered(false);
        setUserEmail(null);
      });
  }, []);

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(API + '/api/webauthn-settings/settings', {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await resp.json();
      console.log('Fetched settings:', data);
      setSettings(data.webauthnSettings || {});
    } catch (e: any) {
      console.error('Fetch settings error:', e);
      setError('Failed to load settings');
    }
    setLoading(false);
  };

  const handleToggle = async (action: string, enabled: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      console.log('Toggling', action, 'to', enabled);
      const resp = await fetch(API + '/api/webauthn-settings/settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, enabled })
      });
      const data = await resp.json();
      console.log('Toggle response:', data);
      if (data.webauthnSettings) {
        console.log('Updating settings to:', data.webauthnSettings);
        setSettings(data.webauthnSettings);
        setSuccess('Settings updated successfully!');
      } else {
        setError(data.error || 'Failed to update');
      }
    } catch (e: any) {
      console.error('Toggle error:', e);
      setError('Failed to update');
    }
  };

     const handleRegister = async () => {
     setRegistering(true);
     setError(null);
     setSuccess(null);
     const email = userEmail;

     if (!email) {
       setError('User email not found. Please log out and log in again.');
       setRegistering(false);
       return;
     }

     // Check if Biometric Security is supported
     if (!window.PublicKeyCredential) {
       setError('Biometric Security is not supported in this browser. Please use a modern browser with biometric authentication support.');
       setRegistering(false);
       return;
     }

           // Check if the device supports platform authenticators
      try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log('Platform authenticator available:', isAvailable);
        if (!isAvailable) {
          setError('No platform authenticator (fingerprint/face ID) found on this device. Please ensure biometric authentication is set up.');
          setRegistering(false);
          return;
        }
      } catch (error) {
        console.error('Error checking platform authenticator:', error);
        setError('Unable to check biometric authentication support. Please try a different browser.');
        setRegistering(false);
        return;
      }

    try {
      // Step 1: Get challenge from server
      const challengeResp = await fetch(API + '/api/webauthn/register/options?email=' + encodeURIComponent(email), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!challengeResp.ok) {
        throw new Error('Failed to get challenge');
      }

      const challengeData = await challengeResp.json();
      
      console.log('Challenge data from server:', challengeData);
      console.log('Challenge length:', challengeData.challenge ? challengeData.challenge.length : 'undefined');

             // Step 2: Create credentials
       console.log('Converting challenge to Uint8Array...');
       console.log('Challenge data type:', typeof challengeData.challenge);
       console.log('Challenge data:', challengeData.challenge);
       
       // Handle different challenge formats
       let challengeArray: Uint8Array;
       if (typeof challengeData.challenge === 'string') {
         // If it's a base64url string, decode it
         const binaryString = atob(challengeData.challenge.replace(/-/g, '+').replace(/_/g, '/'));
         const buffer = new ArrayBuffer(binaryString.length);
         challengeArray = new Uint8Array(buffer);
         for (let i = 0; i < binaryString.length; i++) {
           challengeArray[i] = binaryString.charCodeAt(i);
         }
       } else if (challengeData.challenge instanceof ArrayBuffer) {
         challengeArray = new Uint8Array(challengeData.challenge);
       } else if (Array.isArray(challengeData.challenge)) {
         challengeArray = new Uint8Array(challengeData.challenge);
       } else {
         throw new Error('Invalid challenge format');
       }
       
       // Ensure proper ArrayBuffer type for WebAuthn compatibility
       const challengeBuffer = challengeArray.buffer.slice(0);
       const challenge = new Uint8Array(challengeBuffer);
       
       console.log('Challenge array length:', challengeArray.length);
       console.log('User ID data:', challengeData.userId);
       console.log('User ID type:', typeof challengeData.userId);
       console.log('User data:', challengeData.user);
       
       // Handle different user ID field names
       let userIdData = challengeData.userId || (challengeData.user && challengeData.user.id);
       console.log('Resolved user ID data:', userIdData);
       
       if (!userIdData) {
         throw new Error('User ID not found in challenge data');
       }
       
       // Convert user ID to Uint8Array (handle base64 encoding)
       let userIdArray: Uint8Array;
       if (typeof userIdData === 'string') {
         // If it's a base64 string, decode it
         const binaryString = atob(userIdData.replace(/-/g, '+').replace(/_/g, '/'));
         const buffer = new ArrayBuffer(binaryString.length);
         userIdArray = new Uint8Array(buffer);
         for (let i = 0; i < binaryString.length; i++) {
           userIdArray[i] = binaryString.charCodeAt(i);
         }
       } else if (userIdData instanceof ArrayBuffer) {
         userIdArray = new Uint8Array(userIdData);
       } else if (Array.isArray(userIdData)) {
         userIdArray = new Uint8Array(userIdData);
       } else {
         throw new Error('Invalid user ID format');
       }
       
       // Ensure proper ArrayBuffer type for WebAuthn compatibility
       const userIdBuffer = userIdArray.buffer.slice(0);
       const userId = new Uint8Array(userIdBuffer);
       
       console.log('User ID array length:', userIdArray.length);
       
       const publicKeyOptions: PublicKeyCredentialCreationOptions = {
         challenge: challenge as BufferSource,
         rp: {
           name: 'TradeSpot',
           id: window.location.hostname // Use the current hostname to match server config
         },
         user: {
           id: userId as BufferSource,
           name: email,
           displayName: email
         },
         pubKeyCredParams: [
           { type: 'public-key' as const, alg: -7 }, // ES256
           { type: 'public-key' as const, alg: -257 } // RS256
         ],
         timeout: 60000,
         attestation: 'direct' as AttestationConveyancePreference,
         authenticatorSelection: {
           authenticatorAttachment: 'platform' as AuthenticatorAttachment,
           userVerification: 'preferred' as UserVerificationRequirement
         }
       };

             console.log('Creating WebAuthn credential with options:', publicKeyOptions);
             console.log('Current hostname:', window.location.hostname);
             console.log('Current origin:', window.location.origin);
       
       // Show user instruction
       setSuccess('Please complete the biometric prompt (fingerprint/face ID) when it appears...');
       
       let credential: PublicKeyCredential;
       try {
         credential = await navigator.credentials.create({
           publicKey: publicKeyOptions
         }) as PublicKeyCredential;
                } catch (error: any) {
           console.error('WebAuthn credential creation error:', error);
           console.error('Error details:', {
             name: error.name,
             message: error.message,
             hostname: window.location.hostname,
             origin: window.location.origin,
             userAgent: navigator.userAgent
           });
           
           if (error.name === 'NotAllowedError') {
             throw new Error(`Biometric prompt was cancelled or blocked. Please:\n\n1. Make sure you complete the fingerprint/face ID prompt when it appears\n2. Check that biometric authentication is enabled on your device\n3. Try using Chrome, Firefox, or Safari\n4. Ensure you're on HTTPS (which you are)\n5. Current domain: ${window.location.hostname}`);
           } else if (error.name === 'TimeoutError') {
             throw new Error('Biometric Security operation timed out. Please try again and complete the biometric prompt quickly.');
           } else if (error.name === 'NotSupportedError') {
             throw new Error('Biometric Security is not supported on this device/browser. Please use a modern browser with biometric authentication support.');
           } else {
             throw new Error(`Biometric Security error: ${error.message || 'Unknown error occurred'}`);
           }
         }

       if (!credential) {
         throw new Error('Credential creation failed');
       }

      // Step 3: Send credential to server
      const attestationResponse = credential.response as AuthenticatorAttestationResponse;
      
      // Convert ArrayBuffers to base64url strings for proper transmission
      const attResp = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.clientDataJSON)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.attestationObject)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        },
        type: credential.type
      };

             console.log('Sending Biometric Security registration data:', { 
         email, 
         attResp,
         origin: window.location.origin,
         hostname: window.location.hostname
       });
      
      const verificationResp = await fetch(API + '/api/webauthn/register/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: email,
          attResp: attResp
        })
      });

      if (!verificationResp.ok) {
        const errorData = await verificationResp.json().catch(() => ({}));
        console.error('Biometric Security verification failed:', errorData);
        throw new Error(errorData.error || errorData.details || 'Verification failed');
      }

      const verificationData = await verificationResp.json();
      if (verificationData.success) {
        setSuccess('Biometric Security key registered successfully!');
        setIsRegistered(true);
        await fetchSettings();
      } else {
        throw new Error(verificationData.error || 'Registration failed');
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleDeregister = async () => {
    setShowDeregisterModal(true);
  };

  const confirmDeregister = async () => {
    setDeregisterLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const resp = await fetch(API + '/api/webauthn/deregister', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (resp.ok) {
        setSuccess('Biometric Security key removed successfully!');
        setIsRegistered(false);
        await fetchSettings();
        setShowDeregisterModal(false);
      } else {
        const data = await resp.json();
        setError(data.error || 'Failed to remove key');
      }
    } catch (e: any) {
      setError('Failed to remove key');
    } finally {
      setDeregisterLoading(false);
    }
  };

  const cancelDeregister = () => {
    setShowDeregisterModal(false);
  };

  // Remove full-page loading state - show the page structure immediately

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '12px' : '24px',
      maxWidth: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
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
        padding: '0',
        maxWidth: '100%',
        width: '100%',
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
           gap: '8px',
           animation: 'slideIn 0.3s ease',
           fontSize: '0.9rem'
         }}>
           <span style={{ flexShrink: 0 }}>❌</span>
           <div style={{ whiteSpace: 'pre-line' }}>
             {error}
           </div>
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
        
        {/* Biometric Security Status Card */}
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
                Biometric Security Status
              </h3>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--secondary)',
                margin: 0
              }}>
                {loading ? <span className="loading-dots">...</span> : (isRegistered ? 'Biometric key registered' : 'No biometric key set up')}
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '12px',
              background: isRegistered ? '#4CAF50' : '#ff9800',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 500
            }}>
              <span>{isRegistered ? '🔐' : '⚠️'}</span>
              {loading ? <span className="loading-dots">...</span> : (isRegistered ? 'Active' : 'Inactive')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isRegistered ? (
              <button
                onClick={handleDeregister}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🗑️</span>
                Remove Biometric Key
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering}
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--button-text)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🔑</span>
                {registering ? 'Registering...' : 'Register Biometric Key'}
              </button>
            )}
          </div>
        </div>

        {/* Settings Card */}
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
            <span>⚙️</span>
            Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {actions.map((action) => (
              <div key={action.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{action.icon}</span>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500, 
                      color: 'var(--text)',
                      margin: '0 0 2px 0'
                    }}>
                      {action.label}
                    </h4>
                    <p style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--text-muted)',
                      margin: 0
                    }}>
                      {action.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log('Current settings for', action.key, ':', settings[action.key]);
                    handleToggle(action.key, !settings[action.key]);
                  }}
                  disabled={!isRegistered}
                  style={{
                    background: settings[action.key] ? 'var(--secondary)' : 'var(--bg)',
                    color: settings[action.key] ? 'var(--button-text)' : 'var(--text)',
                    border: '1px solid var(--secondary)',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: isRegistered ? 'pointer' : 'not-allowed',
                    opacity: isRegistered ? 1 : 0.5
                  }}
                >
                  {settings[action.key] ? 'On' : 'Off'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deregister Confirmation Modal */}
      {showDeregisterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '12px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '320px',
            width: '100%',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '20px', 
                marginBottom: '6px',
                color: '#e74c3c'
              }}>
                ⚠️
              </div>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                color: 'var(--primary)',
                margin: '0 0 6px 0'
              }}>
                Remove Biometric Key?
              </h3>
              <p style={{ 
                fontSize: '0.85rem', 
                color: 'var(--secondary)', 
                margin: 0,
                lineHeight: '1.3'
              }}>
                This will disable Biometric Security for all features. You'll need to use 2FA codes instead.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={cancelDeregister}
                disabled={deregisterLoading}
                className="webauthn-modal-btn"
                style={{
                  flex: 1,
                  padding: window.innerWidth <= 480 ? '6px 12px' : '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--secondary)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.85rem',
                  fontWeight: 500,
                  cursor: deregisterLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: deregisterLoading ? 0.5 : 1,
                  minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeregister}
                disabled={deregisterLoading}
                className="webauthn-modal-btn"
                style={{
                  flex: 1,
                  padding: window.innerWidth <= 480 ? '6px 12px' : '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#e74c3c',
                  color: 'white',
                  fontSize: window.innerWidth <= 480 ? '0.7rem' : '0.85rem',
                  fontWeight: 500,
                  cursor: deregisterLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: deregisterLoading ? 0.7 : 1,
                  minHeight: window.innerWidth <= 480 ? '32px' : 'auto'
                }}
              >
                {deregisterLoading ? (
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
                    Removing...
                  </>
                ) : (
                  'Remove Key'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Responsive Styles */}
      <style>
        {`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
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
            
            .webauthn-modal-btn {
              padding: 6px 12px !important;
              font-size: 0.7rem !important;
              border-radius: 6px !important;
              min-height: 32px !important;
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
            
            /* Modal mobile styles */
            div[style*="max-width: 320px"] {
              max-width: 280px !important;
              padding: 16px !important;
            }
            
            div[style*="font-size: 1.1rem"] {
              font-size: 1rem !important;
            }
            
            div[style*="font-size: 0.85rem"] {
              font-size: 0.8rem !important;
            }
            
            div[style*="padding: 10px 14px"] {
              padding: 8px 12px !important;
            }
            
            .webauthn-modal-btn {
              padding: 5px 10px !important;
              font-size: 0.65rem !important;
              border-radius: 5px !important;
              min-height: 30px !important;
            }
          }
          
          @media (max-width: 360px) {
            /* Modal mobile styles */
            div[style*="max-width: 320px"] {
              max-width: 260px !important;
              padding: 14px !important;
            }
            
            div[style*="font-size: 1.1rem"] {
              font-size: 0.95rem !important;
            }
            
            div[style*="font-size: 0.85rem"] {
              font-size: 0.75rem !important;
            }
            
            div[style*="padding: 10px 14px"] {
              padding: 8px 10px !important;
            }
            
            div[style*="gap: 10px"] {
              gap: 8px !important;
            }
            
            .webauthn-modal-btn {
              padding: 4px 8px !important;
              font-size: 0.6rem !important;
              border-radius: 4px !important;
              min-height: 28px !important;
            }
          }
        `}
      </style>
      </div>
    </div>
  );
};

export default WebauthnManagement;
