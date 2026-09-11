import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../theme.css';
import { useTheme } from '../ThemeContext';
import pushNotificationManager from '../services/pushNotificationManager';

const API = process.env.REACT_APP_API_BASE_URL;

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [initializing, setInitializing] = useState(true);
  
  // 2FA State
  const [qr, setQr] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASecret, setTwoFASecret] = useState<string>('');
  const [twoFACopied, setTwoFACopied] = useState(false);
  
  // WebAuthn State
  const [webAuthnRegistering, setWebAuthnRegistering] = useState(false);
  const [webAuthnError, setWebAuthnError] = useState<string | null>(null);
  const [webAuthnSuccess, setWebAuthnSuccess] = useState<string | null>(null);
  const [isWebAuthnRegistered, setIsWebAuthnRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Wallet State
  const [newWallet, setNewWallet] = useState('');
  const [walletValid, setWalletValid] = useState(true);
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  const [currentWallet, setCurrentWallet] = useState<string>('');
  
  // Notifications State
  const [notifPreferences, setNotifPreferences] = useState<any>(null);
  const [notifPushStatus, setNotifPushStatus] = useState({
    isSupported: false,
    hasPermission: false,
    isSubscribed: false
  });
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [themeSelected, setThemeSelected] = useState(false);
  
  const steps = [
    { id: 'welcome', title: 'Welcome', icon: '👋' },
    { id: 'profile', title: 'Profile', icon: '📸' },
    { id: '2fa', title: '2FA', icon: '🔐' },
    { id: 'webauthn', title: 'Biometric Security', icon: '🔑' },
    { id: 'wallet', title: 'Wallet', icon: '💳' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
    { id: 'theme', title: 'Theme', icon: '🎨' }
  ];

  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep]);

  const handleSkip = async () => {
    // Don't mark any step as completed when user skips - just advance to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNext = async () => {
    // Mark current step as completed
    const currentStepId = steps[currentStep]?.id;
    if (currentStepId) {
      await markStepCompleted(currentStepId);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProfilePictureUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'tradespotppics');
      
      try {
        const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dxnajmalc/image/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await cloudRes.json();
        if (data.secure_url) {
          setProfilePicture(data.secure_url);
          const token = localStorage.getItem('token');
          if (token) {
            await axios.put(`${API}/api/portfolio`, 
              { profilePicture: data.secure_url }, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
          // Auto-advance to next step
          setTimeout(() => handleNext(), 500);
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure all steps are marked as completed
        for (const step of steps) {
          if (!completedSteps.has(step.id)) {
            await markStepCompleted(step.id);
          }
        }
        
        // Finalize onboarding
        await axios.post(`${API}/api/onboarding/complete`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAll = async () => {
    setLoading(true);
    try {
      let userId = 'anonymous';
      try {
        const token = localStorage.getItem('token');
        if (token && token.split('.').length === 3) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId || 'anonymous';
        }
      } catch (e) {
        // If token parsing fails, use anonymous
      }
      
      const skipKey = `onboarding_skip_${userId}`;
      const skipData = localStorage.getItem(skipKey);
      
      let skipCount = 0;
      let lastSkipDate = '';
      
      if (skipData) {
        try {
          const parsed = JSON.parse(skipData);
          skipCount = parsed.count || 0;
          lastSkipDate = parsed.date || '';
        } catch (e) {
          // If parsing fails, reset
          skipCount = 0;
        }
      }
      
      const today = new Date().toDateString();
      
      // If this is a new day, increment skip count
      if (lastSkipDate !== today) {
        skipCount += 1;
      }
      
      // Save skip data
      localStorage.setItem(skipKey, JSON.stringify({
        count: skipCount,
        date: today
      }));
      
      // If 3rd skip, mark onboarding as permanently completed
      if (skipCount >= 3) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await axios.post(`${API}/api/onboarding/complete`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (e) {
            console.error('Failed to mark onboarding as completed:', e);
          }
        }
      }
      
      onComplete();
    } catch (error) {
      console.error('Failed to handle skip:', error);
      onComplete(); // Still close wizard even if error
    } finally {
      setLoading(false);
    }
  };

  // Mark a step as completed
  const markStepCompleted = async (stepId: string) => {
    if (completedSteps.has(stepId)) return; // Already completed
    
    // Update local state immediately for instant UI feedback
    setCompletedSteps(prev => new Set(prev).add(stepId));
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/api/onboarding/complete-step`,
        { stepId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Check if all steps are completed based on server response
      if (response.data.allCompleted) {
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Failed to mark step as completed:', error);
      // On error, remove from completed steps to allow retry
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  // Check onboarding status on mount - only check skip status and load steps
  // ProtectedRoute already verified onboarding status, so we trust that
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/api/onboarding/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // ProtectedRoute already checked onboardingCompleted, but double-check for safety
        if (response.data.onboardingCompleted) {
          onComplete();
          setInitializing(false);
          return;
        }

        // Check skip status (localStorage-based, so needs local check)
        let userId = 'anonymous';
        try {
          if (token && token.split('.').length === 3) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || 'anonymous';
          }
        } catch (e) {
          // If token parsing fails, use anonymous
        }
        
        const skipKey = `onboarding_skip_${userId}`;
        const skipData = localStorage.getItem(skipKey);
        
        if (skipData) {
          try {
            const parsed = JSON.parse(skipData);
            const skipCount = parsed.count || 0;
            const lastSkipDate = parsed.date || '';
            const today = new Date().toDateString();
            
            // If permanently skipped (3rd time), don't show wizard
            if (skipCount >= 3) {
              onComplete();
              setInitializing(false);
              return;
            }
            
            // If skipped today, don't show wizard
            if (lastSkipDate === today) {
              onComplete();
              setInitializing(false);
              return;
            }
          } catch (e) {
            // If parsing fails, continue to show wizard
          }
        }

        // Load completed steps for UI display
        if (response.data.onboardingSteps) {
          const completed = new Set<string>();
          Object.entries(response.data.onboardingSteps).forEach(([step, isCompleted]: [string, any]) => {
            if (isCompleted) {
              completed.add(step);
            }
          });
          setCompletedSteps(completed);
          
          // Check if all steps are completed and close wizard if so
          const allStepsCompleted = Object.values(response.data.onboardingSteps).every((completed: any) => completed === true);
          if (allStepsCompleted) {
            onComplete();
            setInitializing(false);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        // Always set initializing to false after checks complete
        setInitializing(false);
      }
    };
    checkOnboardingStatus();
  }, [onComplete]);

  // Fetch user email on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/api/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserEmail(response.data.email);
        setCurrentWallet(response.data.trc20Wallet || '');
        // Mark wallet step as completed if wallet is already bound (only if wallet address exists and is not empty)
        if (response.data.trc20Wallet && response.data.trc20Wallet.trim() !== '') {
          setCompletedSteps(prev => new Set(prev).add('wallet'));
        } else {
          // If no wallet is bound, ensure wallet step is NOT marked as completed
          setCompletedSteps(prev => {
            const newSet = new Set(prev);
            newSet.delete('wallet');
            return newSet;
          });
        }
        // Set profile picture if user already has one
        if (response.data.profilePicture) {
          setProfilePicture(response.data.profilePicture);
          // Mark profile step as completed
          setCompletedSteps(prev => new Set(prev).add('profile'));
        }
        // Check if 2FA is already enabled
        if (response.data.twoFA && response.data.twoFA.enabled) {
          setTwoFAEnabled(true);
          // Mark 2FA step as completed
          setCompletedSteps(prev => new Set(prev).add('2fa'));
        }
        // Check if WebAuthn is already registered
        if (response.data.webauthnCredentials && response.data.webauthnCredentials.length > 0) {
          setIsWebAuthnRegistered(true);
          // Mark WebAuthn step as completed
          setCompletedSteps(prev => new Set(prev).add('webauthn'));
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    fetchUserData();
  }, []);


  // 2FA Functions
  const fetch2FASetup = async () => {
    setLoading(true);
    setTwoFAError('');
    setTwoFAMessage('');
    try {
      const res = await axios.post(`${API}/api/2fa/setup`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQr(res.data.qr);
      setOtpauth(res.data.otpauth);
      setTwoFASecret(res.data.secret || '');
    } catch (e: any) {
      setTwoFAError(e.response?.data?.error || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const copy2FASecret = async () => {
    if (twoFASecret) {
      try {
        await navigator.clipboard.writeText(twoFASecret);
        setTwoFACopied(true);
        setTimeout(() => setTwoFACopied(false), 2000);
      } catch (err) {
        setTwoFAError('Failed to copy secret to clipboard');
      }
    }
  };

  const handleTwoFATokenChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTwoFAToken(value);
    
    if (value.length === 6) {
      setLoading(true);
      setTwoFAError('');
      setTwoFAMessage('');
      try {
        await axios.post(`${API}/api/2fa/verify`, { token: value }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setTwoFAEnabled(true);
        setTwoFAMessage('2FA enabled successfully!');
        setQr(null);
        setOtpauth(null);
        setTwoFAToken('');
        setTwoFASecret('');
        setTwoFACopied(false);
        // Mark 2FA step as completed immediately (will update UI right away)
        await markStepCompleted('2fa');
        // Wait a bit for state to update, then auto-advance to next step
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, 1000);
      } catch (e: any) {
        setTwoFAError(e.response?.data?.error || 'Failed to verify 2FA');
        setTwoFAToken('');
      } finally {
        setLoading(false);
      }
    }
  };

  // WebAuthn Functions
  const handleWebAuthnRegister = async () => {
    setWebAuthnRegistering(true);
    setWebAuthnError(null);
    setWebAuthnSuccess(null);
    
    if (!userEmail) {
      setWebAuthnError('User email not found. Please log out and log in again.');
      setWebAuthnRegistering(false);
      return;
    }

    if (!window.PublicKeyCredential) {
      setWebAuthnError('WebAuthn is not supported in this browser. Please use a modern browser with biometric authentication support.');
      setWebAuthnRegistering(false);
      return;
    }

    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        setWebAuthnError('No platform authenticator (fingerprint/face ID) found on this device. Please ensure biometric authentication is set up.');
        setWebAuthnRegistering(false);
        return;
      }
    } catch (error) {
      setWebAuthnError('Unable to check biometric authentication support. Please try a different browser.');
      setWebAuthnRegistering(false);
      return;
    }

    try {
      // Step 1: Get challenge from server
      const challengeResp = await fetch(`${API}/api/webauthn/register/options?email=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!challengeResp.ok) {
        throw new Error('Failed to get challenge');
      }

      const challengeData = await challengeResp.json();
      
      // Handle different challenge formats
      let challengeArray: Uint8Array;
      if (typeof challengeData.challenge === 'string') {
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
      
      const challengeBuffer = challengeArray.buffer.slice(0);
      const challenge = new Uint8Array(challengeBuffer);
      
      // Handle different user ID field names
      let userIdData = challengeData.userId || (challengeData.user && challengeData.user.id);
      
      if (!userIdData) {
        throw new Error('User ID not found in challenge data');
      }
      
      // Convert user ID to Uint8Array (handle base64 encoding)
      let userIdArray: Uint8Array;
      if (typeof userIdData === 'string') {
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
      
      const userIdBuffer = userIdArray.buffer.slice(0);
      const userId = new Uint8Array(userIdBuffer);
      
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge as BufferSource,
        rp: {
          name: 'TradeSpot',
          id: window.location.hostname
        },
        user: {
          id: userId as BufferSource,
          name: userEmail,
          displayName: userEmail
        },
        pubKeyCredParams: [
          { type: 'public-key' as const, alg: -7 },
          { type: 'public-key' as const, alg: -257 }
        ],
        timeout: 60000,
        attestation: 'direct' as AttestationConveyancePreference,
        authenticatorSelection: {
          authenticatorAttachment: 'platform' as AuthenticatorAttachment,
          userVerification: 'preferred' as UserVerificationRequirement
        }
      };

      setWebAuthnSuccess('Please complete the biometric prompt (fingerprint/face ID) when it appears...');
      
      let credential: PublicKeyCredential;
      try {
        credential = await navigator.credentials.create({
          publicKey: publicKeyOptions
        }) as PublicKeyCredential;
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Biometric prompt was cancelled or blocked. Please complete the fingerprint/face ID prompt when it appears.');
        } else if (error.name === 'TimeoutError') {
          throw new Error('WebAuthn operation timed out. Please try again and complete the biometric prompt quickly.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('WebAuthn is not supported on this device/browser. Please use a modern browser with biometric authentication support.');
        } else {
          throw new Error(`WebAuthn error: ${error.message || 'Unknown error occurred'}`);
        }
      }

      if (!credential) {
        throw new Error('Credential creation failed');
      }

      // Convert credential to base64url strings for transmission
      const attestationResponse = credential.response as AuthenticatorAttestationResponse;
      
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

      const verificationResp = await fetch(`${API}/api/webauthn/register/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: userEmail,
          attResp: attResp
        })
      });

      if (!verificationResp.ok) {
        const errorData = await verificationResp.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Verification failed');
      }

      const verificationData = await verificationResp.json();
      if (verificationData.success) {
        setWebAuthnSuccess('WebAuthn key registered successfully!');
        setIsWebAuthnRegistered(true);
        // Auto-advance to next step after 1 second
        setTimeout(() => handleNext(), 1000);
      } else {
        throw new Error(verificationData.error || 'Registration failed');
      }
    } catch (e: any) {
      setWebAuthnError(e.message || 'Registration failed');
    } finally {
      setWebAuthnRegistering(false);
    }
  };

  // Wallet Functions
  const validateTRC20Wallet = (address: string) => {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewWallet(value);
    setWalletValid(validateTRC20Wallet(value) || value === '');
  };

  const handleWalletSubmit = async () => {
    setLoading(true);
    setWalletError('');
    setWalletSuccess('');
    
    if (!newWallet) {
      setWalletError('Wallet address is required');
      setLoading(false);
      return;
    }

    if (!validateTRC20Wallet(newWallet)) {
      setWalletError('Invalid TRC20 wallet address format');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API}/api/bind-wallet-onboarding`, {
        walletType: 'trc20',
        walletAddress: newWallet
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setCurrentWallet(newWallet);
      setNewWallet(''); // Clear the input
      setWalletSuccess('Wallet bound successfully!');
      // Mark wallet step as completed
      await markStepCompleted('wallet');
      // Auto-advance to next step after 1 second
      setTimeout(() => handleNext(), 1000);
    } catch (err: any) {
      setWalletError(err?.response?.data?.error || 'Failed to bind wallet');
    } finally {
      setLoading(false);
    }
  };

  // Verify wallet is bound when wallet step is visited
  useEffect(() => {
    const verifyWallet = async () => {
      if (currentStep === 4) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API}/api/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const wallet = response.data.trc20Wallet;
          // Only mark as completed if wallet exists and is not empty
          if (wallet && wallet.trim() !== '') {
            setCurrentWallet(wallet);
            setCompletedSteps(prev => new Set(prev).add('wallet'));
          } else {
            // Ensure wallet step is NOT marked as completed if no wallet is bound
            setCurrentWallet('');
            setCompletedSteps(prev => {
              const newSet = new Set(prev);
              newSet.delete('wallet');
              return newSet;
            });
          }
        } catch (err) {
          console.error('Failed to verify wallet:', err);
        }
      }
    };
    verifyWallet();
  }, [currentStep]);

  // Load notification preferences
  useEffect(() => {
    const loadNotifPreferences = async () => {
      if (currentStep === 5) {
        try {
          const data = await pushNotificationManager.getNotificationPreferences();
          setNotifPreferences(data.preferences);
          const status = await pushNotificationManager.getSubscriptionStatus();
          setNotifPushStatus(status);
          // Don't mark as saved or completed - only mark when user clicks "Save Preferences"
        } catch (err) {
          console.error('Failed to load notification preferences:', err);
        }
      }
    };
    loadNotifPreferences();
  }, [currentStep]);

  const handleNotifChannelToggle = (channel: 'email' | 'push' | 'inApp', enabled: boolean) => {
    if (!notifPreferences) return;
    setNotifPreferences((prev: any) => ({
      ...prev,
      [channel]: { ...prev[channel], enabled }
    }));
  };

  const handleNotifCategoryToggle = (channel: 'email' | 'push' | 'inApp', category: string, enabled: boolean) => {
    if (!notifPreferences) return;
    setNotifPreferences((prev: any) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        categories: { ...prev[channel].categories, [category]: enabled }
      }
    }));
  };

  const handleSaveNotifPreferences = async () => {
    setLoading(true);
    try {
      await pushNotificationManager.updateNotificationPreferences(notifPreferences);
      setWalletSuccess('Notification preferences saved!');
      setNotificationsSaved(true);
      // Mark notifications step as completed
      await markStepCompleted('notifications');
    } catch (err) {
      setWalletError('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div style={{ textAlign: 'center', padding: 'clamp(8px, 2vw, 16px)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 40px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>👋</div>
            <h2 style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
              Welcome to Tradespot!
            </h2>
            <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: 'var(--secondary)', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto clamp(12px, 3vw, 16px)' }}>
              Let's set up your profile in a few quick steps.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 'clamp(6px, 1.5vw, 10px)', 
              maxWidth: '500px', 
              margin: 'clamp(12px, 3vw, 16px) auto' 
            }}>
              <div style={{ padding: 'clamp(8px, 2vw, 12px)', background: 'var(--card-bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: 'clamp(20px, 5vw, 24px)', marginBottom: '4px' }}>🔐</div>
                <h3 style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 600 }}>Security</h3>
              </div>
              <div style={{ padding: 'clamp(8px, 2vw, 12px)', background: 'var(--card-bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: 'clamp(20px, 5vw, 24px)', marginBottom: '4px' }}>💳</div>
                <h3 style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 600 }}>Wallet</h3>
              </div>
              <div style={{ padding: 'clamp(8px, 2vw, 12px)', background: 'var(--card-bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: 'clamp(20px, 5vw, 24px)', marginBottom: '4px' }}>⚙️</div>
                <h3 style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 600 }}>Setup</h3>
              </div>
            </div>
          </div>
        );

      case 1: // Profile Picture
        return (
          <div style={{ textAlign: 'center', padding: 'clamp(8px, 2vw, 16px)' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 40px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>📸</div>
            <h2 style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Add Profile Picture
            </h2>
            
            {profilePicture ? (
              <>
                <div style={{ color: 'var(--success-color)', fontWeight: 600, marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                  ✓ Profile picture Set
                </div>
                <div style={{ 
                  width: 'clamp(100px, 25vw, 120px)', 
                  height: 'clamp(100px, 25vw, 120px)', 
                  margin: '0 auto',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                  Upload a photo or skip for now.
                </p>
                
                <div style={{ 
                  width: 'clamp(100px, 25vw, 120px)', 
                  height: 'clamp(100px, 25vw, 120px)', 
                  margin: '0 auto clamp(12px, 3vw, 16px)',
                  borderRadius: '50%',
                  border: '2px dashed var(--secondary)',
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                onClick={handleProfilePictureUpload}>
                  <div style={{ 
                    fontSize: 'clamp(24px, 6vw, 32px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    lineHeight: 1,
                    margin: 0,
                    padding: 0
                  }}>📷</div>
                </div>
                
                {loading && (
                  <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: 'var(--text)' }}>Uploading...</div>
                )}
              </>
            )}
          </div>
        );

      case 2: // 2FA
        return (
          <div style={{ textAlign: 'center', padding: 'clamp(8px, 2vw, 16px)', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 40px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>🔐</div>
            <h2 style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Secure Account with 2FA
            </h2>
            <p style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
              Add an extra layer of security.
            </p>
            
            {twoFAEnabled ? (
              <div style={{ color: 'var(--success-color)', fontWeight: 600 }}>✓ 2FA Enabled!</div>
            ) : !qr ? (
              <button
                onClick={fetch2FASetup}
                disabled={loading}
                style={{
                  padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Starting...' : 'Setup 2FA'}
              </button>
            ) : (
              <div>
                <img src={qr} alt="QR Code" style={{ maxWidth: '150px', width: '100%', height: 'auto', margin: '0 auto 12px', borderRadius: '8px', border: '2px solid var(--secondary)' }} />
                <p style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: 'var(--secondary)', marginBottom: '16px' }}>
                  Scan QR code with authenticator app
                </p>
                
                {twoFASecret && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ 
                      fontSize: 'clamp(10px, 2.5vw, 12px)', 
                      color: 'var(--secondary)',
                      marginBottom: '8px'
                    }}>
                      Or enter secret manually:
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <code style={{
                        background: 'var(--card-bg)',
                        padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)',
                        borderRadius: '6px',
                        fontSize: 'clamp(11px, 2.5vw, 13px)',
                        fontFamily: 'monospace',
                        color: 'var(--text)',
                        border: '1px solid var(--secondary)',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        wordBreak: 'break-all'
                      }}>
                        {twoFASecret}
                      </code>
                      <button
                        onClick={copy2FASecret}
                        title={twoFACopied ? 'Copied!' : 'Copy secret'}
                        style={{
                          background: twoFACopied ? 'var(--success-color)' : 'var(--card-bg)',
                          color: twoFACopied ? 'white' : 'var(--text)',
                          border: '1px solid var(--secondary)',
                          borderRadius: '6px',
                          padding: 'clamp(6px, 1.5vw, 8px)',
                          fontSize: 'clamp(12px, 3vw, 14px)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '32px',
                          height: '32px'
                        }}
                      >
                        {twoFACopied ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                )}
                
                <input
                  type="text"
                  value={twoFAToken}
                  onChange={handleTwoFATokenChange}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  style={{
                    width: '200px',
                    padding: 'clamp(8px, 2vw, 12px)',
                    borderRadius: '8px',
                    border: '1px solid var(--secondary)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    textAlign: 'center',
                    letterSpacing: '4px',
                    boxSizing: 'border-box',
                    marginTop: '8px'
                  }}
                />
                {twoFAError && <div style={{ color: 'red', fontSize: 'clamp(10px, 2.5vw, 12px)', marginTop: '8px' }}>{twoFAError}</div>}
                {twoFAMessage && <div style={{ color: 'var(--success-color)', fontSize: 'clamp(10px, 2.5vw, 12px)', marginTop: '8px' }}>{twoFAMessage}</div>}
              </div>
            )}
          </div>
        );

      case 3: // WebAuthn
        return (
          <div style={{ textAlign: 'center', padding: 'clamp(8px, 2vw, 16px)', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 40px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>🔑</div>
            <h2 style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Enable Biometric Security
            </h2>
            <p style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
              Use biometric authentication (fingerprint/face ID) for secure login.
            </p>
            
            {isWebAuthnRegistered || webAuthnSuccess ? (
              <div style={{ color: 'var(--success-color)', fontWeight: 600 }}>✓ Biometric Security Registered!</div>
            ) : (
              <div>
                <p style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: 'var(--secondary)', marginBottom: '16px' }}>
                  Register your device for biometric authentication
                </p>
                <button
                  onClick={handleWebAuthnRegister}
                  disabled={webAuthnRegistering}
                  style={{
                    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    fontWeight: 600,
                    cursor: webAuthnRegistering ? 'not-allowed' : 'pointer',
                    opacity: webAuthnRegistering ? 0.7 : 1
                  }}
                >
                  {webAuthnRegistering ? 'Registering...' : 'Register Device'}
                </button>
                {webAuthnError && <div style={{ color: 'red', fontSize: 'clamp(10px, 2.5vw, 12px)', marginTop: '8px' }}>{webAuthnError}</div>}
                {webAuthnSuccess && <div style={{ color: 'var(--success-color)', fontSize: 'clamp(10px, 2.5vw, 12px)', marginTop: '8px' }}>{webAuthnSuccess}</div>}
              </div>
            )}
          </div>
        );

      case 4: // Wallet
        return (
          <div style={{ textAlign: 'center', padding: 'clamp(8px, 2vw, 16px)', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 40px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>💳</div>
            <h2 style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Setup Wallet
            </h2>
            <p style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
              Link your TRC20 wallet for deposits.
            </p>
            
            {currentWallet ? (
              <div>
                <div style={{ color: 'var(--success-color)', fontWeight: 600, marginBottom: '8px' }}>✓ Wallet Set: {currentWallet}</div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={newWallet}
                  onChange={handleWalletChange}
                  placeholder="Enter TRC20 wallet address"
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    padding: 'clamp(8px, 2vw, 12px)',
                    borderRadius: '8px',
                    border: `1px solid ${walletValid ? 'var(--secondary)' : 'red'}`,
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    marginBottom: '8px',
                    boxSizing: 'border-box'
                  }}
                />
                {!walletValid && newWallet && <div style={{ color: 'red', fontSize: 'clamp(10px, 2.5vw, 12px)', marginBottom: '8px' }}>Invalid wallet format</div>}
                
                <button
                  onClick={handleWalletSubmit}
                  disabled={loading || !walletValid || !newWallet}
                  style={{
                    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    fontWeight: 600,
                    cursor: (loading || !walletValid || !newWallet) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !walletValid || !newWallet) ? 0.7 : 1,
                    marginTop: '8px'
                  }}
                >
                  {loading ? 'Binding...' : 'Bind Wallet'}
                </button>
                
                {walletSuccess && <div style={{ color: 'var(--success-color)', fontSize: 'clamp(10px, 2.5vw, 12px)', marginTop: '8px' }}>{walletSuccess}</div>}
                {walletError && <div style={{ color: 'red', fontSize: 'clamp(10px, 2.5vw, 12px)', marginTop: '8px' }}>{walletError}</div>}
              </div>
            )}
          </div>
        );

      case 5: // Notifications
        return (
          <div style={{ textAlign: 'center', padding: 'clamp(8px, 2vw, 16px)', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 40px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>🔔</div>
            <h2 style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Configure Notifications
            </h2>
            <p style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
              Choose notification preferences.
            </p>
            
            {notificationsSaved ? (
              <div>
                <div style={{ color: 'var(--success-color)', fontWeight: 600, marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                  ✓ Notifications Configured
                </div>
                {notifPreferences && (
                  <div style={{ width: '100%', textAlign: 'left', marginBottom: '16px' }}>
                    <div style={{ marginBottom: '12px', fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)' }}>
                      Email: {notifPreferences.email?.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div style={{ marginBottom: '12px', fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)' }}>
                      Push: {notifPreferences.push?.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--secondary)' }}>
                      In-App: {notifPreferences.inApp?.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                )}
              </div>
            ) : notifPreferences && (
              <div style={{ width: '100%', textAlign: 'left' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 600 }}>📧 Email Notifications</span>
                    <button
                      onClick={() => handleNotifChannelToggle('email', !notifPreferences.email.enabled)}
                      style={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        background: notifPreferences.email.enabled ? 'var(--primary)' : 'var(--secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: notifPreferences.email.enabled ? '22px' : '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'white',
                        transition: 'all 0.3s'
                      }} />
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 600 }}>🔔 Push Notifications</span>
                    <button
                      onClick={() => handleNotifChannelToggle('push', !notifPreferences.push.enabled)}
                      style={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        background: notifPreferences.push.enabled ? 'var(--primary)' : 'var(--secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: notifPreferences.push.enabled ? '22px' : '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'white',
                        transition: 'all 0.3s'
                      }} />
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 600 }}>🔔 In-App Notifications</span>
                    <button
                      onClick={() => handleNotifChannelToggle('inApp', !notifPreferences.inApp.enabled)}
                      style={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        background: notifPreferences.inApp.enabled ? 'var(--primary)' : 'var(--secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: notifPreferences.inApp.enabled ? '22px' : '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'white',
                        transition: 'all 0.3s'
                      }} />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleSaveNotifPreferences}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 'clamp(8px, 2vw, 12px)',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    marginTop: '16px'
                  }}
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}
          </div>
        );

      case 6: // Theme
        const handleThemeChange = async (newTheme: 'light' | 'dark') => {
          // Only mark as completed if user selects a different theme than the current one
          if (newTheme !== theme) {
            setTheme(newTheme);
            setThemeSelected(true);
            await markStepCompleted('theme');
          } else {
            // User clicked the same theme they already have, just set it (no-op but consistent)
            setTheme(newTheme);
          }
        };

        return (
          <div style={{ textAlign: 'center', padding: 'clamp(8px, 2vw, 16px)' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 40px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>🎨</div>
            <h2 style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Choose Theme
            </h2>
            
            {themeSelected ? (
              <div>
                <div style={{ color: 'var(--success-color)', fontWeight: 600, marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                  ✓ Theme Selected: {theme === 'light' ? 'Light' : 'Dark'}
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                gap: 'clamp(8px, 2vw, 12px)', 
                justifyContent: 'center', 
                marginBottom: 'clamp(12px, 3vw, 16px)',
                flexWrap: 'wrap'
              }}>
                <div
                  onClick={() => handleThemeChange('light')}
                  style={{
                    background: 'var(--card-bg)',
                    padding: 'clamp(12px, 3vw, 16px)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: theme === 'light' ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    minWidth: 'clamp(100px, 25vw, 120px)'
                  }}
                >
                  <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '6px' }}>☀️</div>
                  <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 600 }}>Light</div>
                  {theme === 'light' && (
                    <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: 'var(--text)', fontWeight: 600, marginTop: '4px' }}>✓</div>
                  )}
                </div>
                
                <div
                  onClick={() => handleThemeChange('dark')}
                  style={{
                    background: 'var(--card-bg)',
                    padding: 'clamp(12px, 3vw, 16px)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: theme === 'dark' ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    minWidth: 'clamp(100px, 25vw, 120px)'
                  }}
                >
                  <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '6px' }}>🌙</div>
                  <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 600 }}>Dark</div>
                  {theme === 'dark' && (
                    <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: 'var(--text)', fontWeight: 600, marginTop: '4px' }}>✓</div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Don't render wizard UI until initialization checks are complete
  if (initializing) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--bg)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
        borderBottom: '1px solid var(--secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <div style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 700, color: 'var(--text)' }}>
          Getting Started
        </div>
        <button
          onClick={handleSkipAll}
          style={{
            padding: 'clamp(4px, 1vw, 6px) clamp(12px, 3vw, 16px)',
            background: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--secondary)',
            borderRadius: '6px',
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Skip Setup
        </button>
      </div>

      {/* Progress Bar with Step Indicators */}
      <div style={{ width: '100%', padding: '0 clamp(12px, 3vw, 20px)', boxSizing: 'border-box' }}>
        {/* Step Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          gap: '4px',
          width: '100%'
        }}>
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = currentStep === index;
            return (
              <div key={step.id} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                flex: 1,
                minWidth: 0,
                padding: '0 2px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isCompleted ? 'var(--success-color)' : isCurrent ? 'var(--primary)' : 'var(--secondary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  transition: 'all 0.3s',
                  flexShrink: 0
                }}>
                  {isCompleted ? '✓' : step.icon}
                </div>
                <div style={{
                  fontSize: '7px',
                  color: isCompleted || isCurrent ? 'var(--primary)' : 'var(--secondary)',
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  wordBreak: 'break-word'
                }}>
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Progress Bar */}
        <div style={{
          height: '3px',
          width: '100%',
          background: 'var(--secondary)',
          borderRadius: '2px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--primary)',
            transition: 'width 0.3s ease',
            borderRadius: '2px'
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(12px, 3vw, 20px)',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'auto',
        overflowX: 'hidden'
      }}>
        {renderStep()}
      </div>

      {/* Footer with Navigation */}
      <div style={{
        padding: 'clamp(12px, 3vw, 16px)',
        borderTop: '1px solid var(--secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        gap: 'clamp(6px, 1.5vw, 10px)',
        flexWrap: 'wrap',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          style={{
            padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)',
            background: currentStep === 0 ? 'transparent' : 'var(--card-bg)',
            color: currentStep === 0 ? 'var(--secondary)' : 'var(--text)',
            border: `1px solid ${currentStep === 0 ? 'transparent' : 'var(--secondary)'}`,
            borderRadius: '6px',
            fontSize: 'clamp(11px, 2.5vw, 13px)',
            fontWeight: 600,
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 0 ? 0.5 : 1
          }}
        >
          Back
        </button>

        <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: 'var(--secondary)', textAlign: 'center' }}>
          {currentStep + 1} / {steps.length}
        </div>

        <button
          onClick={currentStep === 0 ? handleNext : handleSkip}
          style={{
            padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)',
            background: currentStep === 0 ? 'var(--primary)' : 'transparent',
            color: currentStep === 0 ? 'white' : 'var(--secondary)',
            border: `1px solid ${currentStep === 0 ? 'var(--primary)' : 'var(--secondary)'}`,
            borderRadius: '6px',
            fontSize: 'clamp(11px, 2.5vw, 13px)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {currentStep === 0 ? 'Next' : 'Skip'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingWizard;