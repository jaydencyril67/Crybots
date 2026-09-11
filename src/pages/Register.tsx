import React, { useState, useEffect } from 'react';
import { registerUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PasswordConfirmationModal from '../components/PasswordConfirmationModal';
import GoogleLogo from '../assets/google-logo.png';
import axios from 'axios';
import { FaUserPlus, FaUser, FaEnvelope, FaLock, FaShieldAlt, FaUsers, FaCheckCircle, FaExclamationTriangle, FaSignInAlt, FaGoogle } from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || 'https://api-tradespot.onrender.com';
const GOOGLE_SIGNUP_URL = `${API}/api/auth/google/signup`;

const Register: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [emailValid, setEmailValid] = useState(true);
    const [passwordValid, setPasswordValid] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [googleUserInfo, setGoogleUserInfo] = useState<{ name: string; email: string } | undefined>(undefined);
    const [googleSignupLoading, setGoogleSignupLoading] = useState(false);
    const navigate = useNavigate();

    // Function to capitalize first letter of each word
    const capitalizeWords = (str: string) => {
        return str.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Function to fetch Google user info from server session
    const fetchGoogleUserInfo = async () => {
        try {
            console.log('Fetching Google user info...');
            const response = await axios.get(`${API}/api/auth/google/user-info`, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log('Google user info response:', response.data);
            
            if (response.data && response.data.email) {
                setGoogleUserInfo({
                    name: response.data.fullName || 'Google User',
                    email: response.data.email
                });
                console.log('Set Google user info:', { name: response.data.fullName || 'Google User', email: response.data.email });
            } else {
                console.log('No email in response data');
                // Fallback if no data available
                setGoogleUserInfo({
                    name: 'Google User',
                    email: 'Loading...'
                });
            }
        } catch (error: any) {
            console.error('Failed to fetch Google user info:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error headers:', error.response?.headers);
            
            // Fallback if request fails
            setGoogleUserInfo({
                name: 'Google User',
                email: 'Unable to load email'
            });
        }
    };

    // Password validation: min 8 chars, at least 1 letter and 1 number, must not match any filled detail
    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) return false;
        if (!/[A-Za-z]/.test(pwd)) return false;
        if (!/[0-9]/.test(pwd)) return false;
        const details = [fullName, email].map(d => d.trim().toLowerCase()).filter(Boolean);
        if (details.some(d => d && pwd.trim().toLowerCase() === d)) return false;
        return true;
    };

    useEffect(() => {
        // Check for Google signup parameters
        const params = new URLSearchParams(window.location.search);
        const googleSignup = params.get('google_signup');
        const signupToken = params.get('gs'); // Google signup token
        const error = params.get('error');
        
        if (googleSignup === 'true') {
            // Show password confirmation modal for Google signup
            setShowPasswordModal(true);
            
            if (signupToken) {
                // Decode the token to get user info (like login does)
                try {
                    const tokenData = JSON.parse(atob(signupToken.split('.')[1]));
                    console.log('Decoded signup token:', tokenData);
                    
                    if (tokenData.email && tokenData.fullName) {
                        setGoogleUserInfo({
                            name: tokenData.fullName,
                            email: tokenData.email
                        });
                        console.log('Set Google user info from token:', { name: tokenData.fullName, email: tokenData.email });
                    } else {
                        setError('Invalid Google signup token. Please try again.');
                    }
                } catch (err) {
                    console.error('Failed to decode signup token:', err);
                    setError('Invalid Google signup token. Please try again.');
                }
            } else {
                // Fallback: try to fetch from session (for backward compatibility)
                setTimeout(() => {
                    fetchGoogleUserInfo();
                }, 1000);
            }
        }
        
        if (error === 'user_exists') {
            setError('An account with this Google email already exists. Please try logging in instead.');
        } else if (error === 'google_profile') {
            setError('Google signup failed. Please try again.');
        } else if (error === 'server_error') {
            setError('A server error occurred during Google signup. Please try again later.');
        } else if (error === 'session_error') {
            setError('Session error occurred. Please try the Google signup again.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }
        if (!emailValid) {
            setError('Please enter a valid email address');
            return;
        }

        if (!passwordValid) {
            setError('Password must be at least 8 characters, contain at least 1 letter and 1 number, and must not match any of your details.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        // Get referral code from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        try {
            const result = await registerUser(fullName, email, password, refCode || undefined);
            console.log('Registration successful:', result);
            setError('');
            setShowSuccess(true);
            
            // Clear form fields
            setFullName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            
            // Redirect to login after 4 seconds
            setTimeout(() => {
                navigate('/l');
            }, 4000);
        } catch (err: any) {
            // Try to extract error message from backend (supports axios and fetch error shapes)
            let errorMsg = 'Registration failed';
            if (err.response && err.response.data && typeof err.response.data === 'object') {
                if (err.response.data.error) {
                    errorMsg = err.response.data.error;
                } else if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data;
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            setError(errorMsg);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordMatch(value === confirmPassword);
        setPasswordValid(validatePassword(value));
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        setPasswordMatch(password === e.target.value);
        setPasswordValid(validatePassword(password));
    };

    const validateEmail = (email: string) => {
        return /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setEmail(value);
        setEmailValid(validateEmail(value) || value === '');
    };

    const handleGoogleSignup = () => {
        window.location.href = GOOGLE_SIGNUP_URL;
    };

    const handleGooglePasswordSubmit = async (password: string, confirmPassword: string) => {
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters, contain at least 1 letter and 1 number.');
            return;
        }

        setGoogleSignupLoading(true);
        setError('');

        try {
            // Get or generate device ID
            let device = localStorage.getItem('signupDevice');
            if (!device) {
                device = Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('signupDevice', device);
            }

            // Get signup token and referral code from URL
            const params = new URLSearchParams(window.location.search);
            const signupToken = params.get('gs');
            const refCode = params.get('ref');

            const response = await axios.post(`${API}/api/auth/google/signup/complete`, {
                password,
                device,
                signupToken, // Send the token instead of relying on session
                ref: refCode
            });

            setShowPasswordModal(false);
            setGoogleSignupLoading(false);
            setError('');
            setShowSuccess(true);
            
            // Clear form fields
            setFullName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            
            // Redirect to login after 4 seconds
            setTimeout(() => {
                navigate('/l');
            }, 4000);
        } catch (err: any) {
            setGoogleSignupLoading(false);
            setError(err.response?.data?.error || 'Failed to complete Google signup. Please try again.');
        }
    };


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
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                border: 'none',
                padding: '24px',
                minWidth: 0,
                maxWidth: '450px',
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
                    <span style={{ fontSize: '24px' }}>🚀</span>
                    <span style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 700, 
                        color: 'var(--text)', 
                        letterSpacing: 0.5
                    }}>
                        Join TradeSpot
                    </span>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off">
                    {/* Error Message */}
                    {error && (
                        <div style={{ 
                            marginBottom: '16px', 
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(248, 113, 113, 0.1)',
                            color: 'var(--error-color)',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.2)',
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

                    {/* Success Message */}
                    {showSuccess && (
                        <div style={{ 
                            marginBottom: '16px', 
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(74, 222, 128, 0.1)',
                            color: 'var(--success-color)',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(74, 222, 128, 0.2)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <FaCheckCircle size={14} />
                            Registration successful! Welcome to TradeSpot!
                        </div>
                    )}

                    {/* Full Name Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ 
                            position: 'relative',
                            marginBottom: '8px'
                        }}>
                            <FaUser style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                fontSize: '14px'
                            }} />
                            <input
                                id="register-fullname"
                                name="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(capitalizeWords(e.target.value))}
                                required
                                autoComplete="off"
                                placeholder="Enter your full name"
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
                                id="register-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                autoComplete="off"
                                placeholder="Enter your email address"
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
                                id="register-password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                                autoComplete="off"
                                placeholder="Create a strong password"
                                style={{ 
                                    width: '100%', 
                                    boxSizing: 'border-box', 
                                    padding: '12px 12px 12px 40px', 
                                    borderRadius: '8px', 
                                    border: 'none',
                                    boxShadow: passwordValid || password === '' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 0 0 2px rgba(231, 76, 60, 0.3), 0 2px 8px rgba(231, 76, 60, 0.2)', 
                                    fontSize: '0.9rem', 
                                    background: 'var(--bg)', 
                                    color: 'var(--text)',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        </div>
                        {!passwordValid && password !== '' && (
                            <div style={{ 
                                color: 'var(--error-color, #e74c3c)', 
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
                                color: 'var(--text-muted)',
                                fontSize: '14px'
                            }} />
                            <input
                                id="register-confirm-password"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                required
                                autoComplete="off"
                                placeholder="Confirm your password"
                                style={{ 
                                    width: '100%', 
                                    boxSizing: 'border-box', 
                                    padding: '12px 12px 12px 40px', 
                                    borderRadius: '8px', 
                                    border: 'none',
                                    boxShadow: passwordMatch || confirmPassword === '' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 0 0 2px rgba(231, 76, 60, 0.3), 0 2px 8px rgba(231, 76, 60, 0.2)', 
                                    fontSize: '0.9rem', 
                                    background: 'var(--bg)', 
                                    color: 'var(--text)',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        </div>
                        {!passwordMatch && confirmPassword !== '' && (
                            <div style={{ 
                                color: 'var(--error-color, #e74c3c)', 
                                fontSize: '0.8rem', 
                                textAlign: 'left',
                                marginTop: '4px'
                            }}>
                                Passwords do not match.
                            </div>
                        )}
                    </div>


                    {/* Register Button */}
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
                            cursor: 'pointer',
                            marginBottom: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <FaUserPlus size={14} />
                        Create Account
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

                    {/* Google Signup Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignup}
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
                        Sign up with Google
                    </button>

                    {/* Email Verification Notice */}
                    <div style={{ 
                        marginBottom: '16px',
                        padding: '12px',
                        background: 'var(--bg)',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text)',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <FaEnvelope size={12} />
                        <span>After registration, you'll receive a verification email. Please verify your email before logging in.</span>
                    </div>

                    {/* Login Link */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: 'var(--text)' }}>
                            Already have an account?
                        </span>
                        <span 
                            style={{ 
                                color: 'var(--text)', 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                textDecoration: 'underline',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }} 
                            onClick={() => navigate('/l')}
                        >
                            <FaSignInAlt size={12} />
                            Login
                        </span>
                    </div>
                </form>
            </div>

            {/* Password Confirmation Modal for Google Signup */}
            <PasswordConfirmationModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSubmit={handleGooglePasswordSubmit}
                loading={googleSignupLoading}
                error={error}
                userInfo={googleUserInfo}
            />

            {/* Mobile Responsive Styles */}
            <style>
                {`
                    @media (max-width: 480px) {
                        div[style*="max-width: 450px"] {
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
                        
                        div[style*="font-size: 0.8rem"] {
                            font-size: 0.75rem !important;
                        }
                    }
                `}
            </style>
            </div>
        </div>
    );
};

export default Register;