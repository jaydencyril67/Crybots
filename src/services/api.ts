import axios from 'axios';
import tokenValidator from '../utils/tokenValidation';

const API = process.env.REACT_APP_API_BASE_URL;

// Add response interceptor to handle session expiration
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && 
            error.response?.data?.message?.includes('logged out from another device')) {
            // Clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/l?session_expired=true';
        }
        return Promise.reject(error);
    }
);

export const fetchMarketData = async () => {
    try {
        const response = await axios.get(`${API}/api/market-data`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching market data');
    }
};

export const fetchUserPortfolio = async (userId: string) => {
    try {
        const response = await axios.get(`${API}/users/${userId}/portfolio`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching user portfolio');
    }
};

export const executeTrade = async (tradeDetails: any) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    try {
        const response = await axios.post(`${API}/api/simulated-sellers/buy`, tradeDetails, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Error executing trade');
    }
};

export const loginUser = async (email: string, password: string, twoFAToken?: string, device?: string) => {
    try {
        const payload: any = { email, password };
        if (twoFAToken) payload.twoFAToken = twoFAToken;
        if (device) payload.device = device;
        const response = await axios.post(`${API}/api/auth/login`, payload);
        
        // Start token validation after successful login
        if (response.data.token) {
            tokenValidator.start();
        }
        
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Login failed');
    }
};

// Update registerUser to send a persistent device ID for one-signup-per-device enforcement
export const registerUser = async (fullName: string, email: string, password: string, ref?: string) => {
    // Generate a device ID (persisted in localStorage)
    let device = localStorage.getItem('signupDevice');
    if (!device) {
        device = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('signupDevice', device);
    }
    try {
        const response = await axios.post(`${API}/api/auth/r`, { 
            fullName, 
            email, 
            password, 
            device,
            ref
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Registration failed');
    }
};

// Add new getPortfolio
export const getPortfolio = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.get(`${API}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// KYC removed: functions intentionally deleted
// Transfer USDT to another user by email or spotid
export const transferUSDT = async (recipientEmail: string | null, recipientSpotId: string | null, amount: number, twoFAToken: string, assertionResp?: any) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    // Validate that at least one recipient identifier is provided
    if (!recipientEmail && !recipientSpotId) {
        throw new Error('Recipient email or spotid is required');
    }
    
    const requestBody: any = {
        recipientEmail, 
        recipientSpotId, 
        amount
    };
    
    // Include either 2FA token or WebAuthn assertion response
    if (assertionResp) {
        requestBody.assertionResp = assertionResp;
    } else if (twoFAToken) {
        requestBody.twoFAToken = twoFAToken;
    }
    
    const res = await axios.post(`${API}/api/transfer`, requestBody, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};


// Add API functions to send the name change verification code and to change the user's name after code verification.
export const sendNameVerificationCode = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.post(`${API}/api/send-name-verification`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const changeName = async (newName: string, code: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    try {
        const res = await axios.post(`${API}/api/change-name`, { newName, code }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
            // Return the backend error message as the error message
            throw new Error(error.response.data.error);
        }
        // If no backend error, show the default axios error message
        throw new Error(error.message || 'Failed to update name.');
    }
};

// Add API functions to send verification code and change for email and wallet, similar to name change functions.
export const sendEmailVerificationCode = async () => {
  try {
    const res = await axios.post(`${API}/api/send-email-verification`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Resend email verification for unverified users
export const resendEmailVerification = async (email: string) => {
  try {
    const res = await axios.post(`${API}/api/auth/resend-verification`, { email });
    return res.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to resend verification email');
  }
};

export const changeEmail = async (newEmail: string, password: string, code: string) => {
  try {
    const res = await axios.post(`${API}/api/change-email`, { newEmail, password, code }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return res.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Failed to change email.');
  }
};

// Spot ID change: send verification and apply change
export const sendSpotIdVerificationCode = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const res = await axios.post(`${API}/api/send-spotid-verification`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const changeSpotId = async (newSpotId: string, code: string) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  try {
    const res = await axios.post(`${API}/api/change-spotid`, { newSpotId, code }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Failed to change Spot ID.');
  }
};

// Add this function to actually call the backend for password verification code (placeholder for now)
export const sendPasswordVerificationCode = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.post(`${API}/api/send-password-verification`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Send funds privacy verification code to email
export const sendFundsPrivacyVerificationCode = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.post(`${API}/api/send-funds-privacy-code`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Verify email code for funds privacy
export const verifyFundsEmailCode = async (emailCode: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.post(`${API}/api/verify-funds-email-code`, {
        emailCode
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Verify funds privacy (lock funds actions)
export const verifyFundsPrivacy = async (emailCode: string, twoFAToken: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.post(`${API}/api/verify-funds-privacy`, {
        emailCode, twoFAToken
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Change password
export const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const payload = { oldPassword, newPassword, confirmPassword };
    const res = await axios.post(`${API}/api/change-password`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Admin login
export const adminLogin = async (email: string, password: string) => {
    try {
        const response = await axios.post(`${API}/api/auth/admin/login`, { email, password });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Admin login failed');
    }
};

// Add an API function to fetch all users (for admin).
export const getAllUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};


// API call to resolve email to userId
export const getUserIdByEmail = async (email: string) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const res = await axios.post(`${API}/api/get-user-id`, { email }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.userId;
};

export const getCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const res = await axios.get(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Logout function that stops token validation
export const logoutUser = () => {
    // Stop token validation
    tokenValidator.stop();
    
    // Clear all user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('signupDevice');
    
    // Redirect to login page
    window.location.href = '/l';
};


// Copy Trading API functions
export const getCopyTraders = async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    riskLevel?: string;
    tradingStyle?: string;
}) => {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                queryParams.append(key, value.toString());
            }
        });
    }
    
    const res = await axios.get(`${API}/api/copy-trading/traders?${queryParams.toString()}`);
    return res.data;
};

export const getCopyTraderDetails = async (traderId: string) => {
    const res = await axios.get(`${API}/api/copy-trading/traders/${traderId}`);
    return res.data;
};

export const getCopyTraderPerformance = async (traderId: string, days: number = 30) => {
    const res = await axios.get(`${API}/api/copy-trading/traders/${traderId}/performance?days=${days}`);
    return res.data;
};

export const startCopyTrading = async (traderId: string, amount: number, settings?: {
    copySettings?: {
        autoReinvest?: boolean;
        maxLossPercentage?: number;
        notificationEnabled?: boolean;
    };
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
        const res = await axios.post(`${API}/api/copy-trading/copy/${traderId}`, {
            amount,
            ...settings
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Failed to start copy trading');
    }
};

export const getCopyPositions = async (status?: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    const queryParams = status ? `?status=${status}` : '';
    const res = await axios.get(`${API}/api/copy-trading/positions${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const getCopyPositionDetails = async (positionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    const res = await axios.get(`${API}/api/copy-trading/positions/${positionId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const addFundsToPosition = async (positionId: string, amount: number) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
        const res = await axios.post(`${API}/api/copy-trading/positions/${positionId}/add-funds`, {
            amount
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Failed to add funds');
    }
};

export const withdrawFromPosition = async (positionId: string, amount: number) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
        const res = await axios.post(`${API}/api/copy-trading/positions/${positionId}/withdraw`, {
            amount
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Failed to withdraw funds');
    }
};

export const stopCopyTrading = async (positionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
        const res = await axios.post(`${API}/api/copy-trading/positions/${positionId}/stop`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Failed to stop copy trading');
    }
};

export const updatePositionSettings = async (positionId: string, settings: {
    copySettings?: {
        autoReinvest?: boolean;
        maxLossPercentage?: number;
        notificationEnabled?: boolean;
    };
}) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
        const res = await axios.put(`${API}/api/copy-trading/positions/${positionId}/settings`, settings, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Failed to update settings');
    }
};

export const getCopyTradingDashboard = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    const res = await axios.get(`${API}/api/copy-trading/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Checks if a 5-digit spotid is available
export const checkSpotIdAvailability = async (spotId: string): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  if (!/^[0-9]{5}$/.test(spotId)) throw new Error('Spot ID must be exactly 5 digits');
  const res = await axios.get(`${API}/api/spotid-availability`, {
    params: { spotid: spotId },
    headers: { Authorization: `Bearer ${token}` }
  });
  if (typeof res.data.available === 'boolean') return res.data.available;
  throw new Error('Invalid response from server');
}

// Get live exchange rate between USDT and BTC
export const getExchangeRate = async () => {
    try {
        const response = await axios.get(`${API}/api/exchange-rate`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Error fetching exchange rate');
    }
};

// Convert currency (USDT to BTC or BTC to USDT)
export const convertCurrency = async (fromCurrency: string, toCurrency: string, amount: number) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
        const response = await axios.post(`${API}/api/convert`, {
            fromCurrency,
            toCurrency,
            amount
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Error converting currency');
    }
};