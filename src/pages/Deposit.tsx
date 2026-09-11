import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import TabFilter from '../components/TabFilter';
import './Deposit.css';

interface DepositInfo {
    address: string;
    coin: string;
    network: string;
    assignedAt: string;
}

interface DepositHistory {
    deposits: Array<{
        _id: string;
        amount: number;
        coin: string;
        network: string;
        status: string;
        paymentMethod?: string;
        address?: string;
        createdAt: string;
        creditedAt?: string;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

interface DepositDetails {
    _id: string;
    depositId: string;
    address: string;
    amount: number;
    coin: string;
    network: string;
    txHash?: string;
    status: string;
    creditedAt?: string;
    paymentMethod?: string;
    paymentId?: string;
    purchaseId?: string;
    createdAt: string;
    updatedAt: string;
}

interface PaymentDetails {
    payment_status?: string;
    actually_paid?: number;
    pay_amount?: number;
    pay_currency?: string;
    price_amount?: number;
    price_currency?: string;
    expiration_estimate_date?: string;
    pay_address?: string;
}

interface NOWPaymentsPayment {
    payment_id: number;
    payment_status: string;
    pay_address: string;
    pay_amount: number;
    pay_currency: string;
    price_amount: number;
    price_currency: string;
    expiration_estimate_date?: string;
    order_id: string;
    purchase_id: string;
    network?: string;
}

const Deposit: React.FC = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const processedParamsRef = useRef<string>('');
    const [depositMethod, setDepositMethod] = useState<'bitget' | 'nowpayments' | 'flutterwave'>('bitget');
    const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
    const [depositHistory, setDepositHistory] = useState<DepositHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // NOWPayments states
    const [npAmount, setNpAmount] = useState<string>('');
    const [npCurrency, setNpCurrency] = useState<string>('USDT');
    const [npPayCurrency, setNpPayCurrency] = useState<string>('');
    const [npCurrencies, setNpCurrencies] = useState<string[]>([]);
    const [npLoading, setNpLoading] = useState(false);
    const [npPayment, setNpPayment] = useState<NOWPaymentsPayment | null>(null);
    const [npCheckingStatus, setNpCheckingStatus] = useState(false);
    const [pendingPaymentCount, setPendingPaymentCount] = useState<number>(0);

    // Flutterwave states
    const [fwAmount, setFwAmount] = useState<string>('');
    const [fwCurrency, setFwCurrency] = useState<string>('USD');
    const [fwLoading, setFwLoading] = useState(false);
    const [fwPaymentLink, setFwPaymentLink] = useState<string | null>(null);
    const [fwVerifying, setFwVerifying] = useState(false);
    const [fwSuccess, setFwSuccess] = useState<string | null>(null);


    useEffect(() => {
        fetchDepositInfo();
        fetchDepositHistory();
        if (depositMethod === 'nowpayments') {
            fetchNOWPaymentsCurrencies();
        }
    }, [depositMethod]);

    // Verify Flutterwave payment status
    const verifyFlutterwavePayment = async (txRef: string) => {
        try {
            setFwVerifying(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/deposit-addresses/flutterwave/status/${encodeURIComponent(txRef)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'successful' || data.status === 'credited') {
                    setFwSuccess(`Payment successful! ${data.amount} ${data.currency} has been added to your account.`);
                    // Refresh history to show updated balance
                    setTimeout(() => {
                        fetchDepositHistory();
                        fetchDepositInfo();
                    }, 1000);
                } else if (data.status === 'pending') {
                    setFwSuccess('Payment is being processed. Your account will be credited shortly.');
                    setTimeout(() => {
                        fetchDepositHistory();
                    }, 1000);
                } else {
                    setError(`Payment status: ${data.status}`);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to verify payment status');
            }
        } catch (err) {
            console.error('Error verifying Flutterwave payment:', err);
            setError('Failed to verify payment. Please check your deposit history.');
        } finally {
            setFwVerifying(false);
        }
    };

    // Check URL params for payment status
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        // Get all status values to handle duplicate parameters
        const statuses = urlParams.getAll('status');
        const status = statuses.length > 0 ? statuses[statuses.length - 1] : urlParams.get('status');
        const txRef = urlParams.get('tx_ref');
        const transactionId = urlParams.get('transaction_id');
        
        // If there are query parameters, we should process them and clean up URL after reading
        const hasParams = location.search && location.search.length > 1;
        
        // Skip if we've already processed these exact parameters (prevents double-processing after navigate)
        if (hasParams && processedParamsRef.current === location.search) {
            return;
        }
        
        // Mark these parameters as processed
        if (hasParams) {
            processedParamsRef.current = location.search;
        }
        
        // Check if any status indicates success
        const hasFlutterwaveSuccess = statuses.includes('flutterwave_success') || statuses.includes('completed') || 
                                      status === 'flutterwave_success' || status === 'completed';
        
        // Check for error statuses
        const hasFlutterwaveError = status === 'flutterwave_error' || status === 'flutterwave_failed';
        const hasFlutterwavePending = status === 'flutterwave_pending';
        const errorParam = urlParams.get('error');
        
        // Process payment status first, then clean up URL
        if (status === 'success' && depositMethod === 'nowpayments') {
            // Payment was successful, refresh history
            setTimeout(() => {
                fetchDepositHistory();
            }, 2000);
        } else if (hasFlutterwaveSuccess) {
            // Flutterwave payment was successful (already processed by callback route)
            setDepositMethod('flutterwave');
            setError(null); // Clear any previous errors
            
            // Show success message with amount if available
            const amount = urlParams.get('amount');
            const currency = urlParams.get('currency');
            if (amount && currency) {
                setFwSuccess(`Payment successful! ${amount} ${currency} has been credited to your account.`);
            } else {
                setFwSuccess('Payment successful! Your account has been credited.');
            }
            
            // Refresh balance immediately since payment was already processed
            setTimeout(() => {
                fetchDepositHistory();
                fetchDepositInfo();
                setFwVerifying(false);
            }, 500);
            
            // Clear success message after 15 seconds
            setTimeout(() => {
                setFwSuccess(null);
            }, 15000);
        } else if (hasFlutterwaveError) {
            // Flutterwave payment failed
            setDepositMethod('flutterwave');
            setFwVerifying(false);
            const errorMessage = errorParam 
                ? `Payment failed: ${errorParam.replace(/_/g, ' ')}`
                : 'Payment failed. Please try again.';
            setError(errorMessage);
        } else if (hasFlutterwavePending) {
            // Flutterwave payment is pending
            setDepositMethod('flutterwave');
            setFwSuccess('Payment is being processed. Your account will be credited shortly.');
            setFwVerifying(true);
            
            // Verify payment if we have tx_ref
            if (txRef) {
                verifyFlutterwavePayment(txRef).catch((err) => {
                    console.error('Verification error:', err);
                    setFwVerifying(false);
                });
            } else {
                setTimeout(() => {
                    fetchDepositHistory();
                    setFwVerifying(false);
                }, 2000);
            }
        }

        // Clean up URL parameters after processing (if they existed)
        // This should be the last thing we do to ensure parameters are read first
        if (hasParams) {
            // Immediately navigate to clean URL (parameters already processed)
            navigate('/dp', { replace: true });
        }
    }, [location.search, navigate, depositMethod])


    const fetchDepositInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }
            
            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/deposit-addresses/my-address`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDepositInfo(data);
            } else if (response.status === 404) {
                // Don't set error for missing address - just don't show the address section
                console.log('No deposit address assigned');
            } else {
                setError('Failed to load deposit information');
            }
        } catch (err) {
            console.error('Error fetching deposit info:', err);
            // Only set critical errors
        }
    };

    const fetchDepositHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/deposit-addresses/my-deposits?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Count pending payments from all deposits
                const pendingCount = data.deposits.filter((deposit: any) => deposit.status === 'pending').length;
                setPendingPaymentCount(pendingCount);
                // Set only first 3 for display
                const displayData = {
                    ...data,
                    deposits: data.deposits.slice(0, 3)
                };
                setDepositHistory(displayData);
            }
        } catch (err) {
            console.error('Failed to fetch deposit history:', err);
        } finally {
            setLoading(false);
        }
    };


    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'credited':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'failed':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    // Fetch detailed payment information and display inline
    const fetchPaymentDetails = async (depositId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/deposit-addresses/deposit/${depositId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const deposit = data.deposit;
                const paymentDetails = data.paymentDetails || {};
                
                // For NOWPayments deposits, convert to NOWPaymentsPayment format
                // For Bitget deposits, create a similar structure for display
                if (deposit.paymentMethod === 'nowpayments' && deposit.paymentId) {
                    const payment: NOWPaymentsPayment = {
                        payment_id: parseInt(deposit.paymentId) || 0,
                        payment_status: paymentDetails.payment_status || deposit.status,
                        pay_address: paymentDetails.pay_address || deposit.address,
                        pay_amount: paymentDetails.pay_amount || deposit.amount,
                        pay_currency: paymentDetails.pay_currency || deposit.coin,
                        price_amount: paymentDetails.price_amount || deposit.amount,
                        price_currency: paymentDetails.price_currency || 'USD',
                        expiration_estimate_date: paymentDetails.expiration_estimate_date,
                        order_id: deposit.depositId || '',
                        purchase_id: deposit.purchaseId || '',
                        network: deposit.network || paymentDetails.pay_currency
                    };
                    
                    // Switch to NOWPayments method and show payment
                    setDepositMethod('nowpayments');
                    setNpPayment(payment);
                    setNpAmount(payment.price_amount?.toString() || '');
                    
                    // If payment is still pending, start checking status
                    if ((payment.payment_status === 'pending' || deposit.status === 'pending') && payment.payment_id) {
                        checkPaymentStatus(payment.payment_id);
                    }
                } else {
                    // For Bitget deposits, show address in Bitget section
                    // Switch to Bitget method
                    setDepositMethod('bitget');
                    // The address will be displayed in the Bitget section via depositInfo
                    // Note: Bitget deposits don't need special payment tracking
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to load payment details');
            }
        } catch (err) {
            console.error('Error fetching payment details:', err);
            setError('Network error. Please try again.');
        }
    };

    // Handle deposit item click
    const handleDepositClick = (deposit: any) => {
        if (deposit.status === 'pending') {
            fetchPaymentDetails(deposit._id);
        }
    };

    // Format currency name for display
    const formatCurrencyName = (currency: string): string => {
        const upper = currency.toUpperCase();
        // Handle common USDT variants
        if (upper === 'USDT') return 'USDT';
        if (upper.includes('TRC20') || upper.includes('TRX') || upper.includes('TRON')) {
            return 'USDT (TRC20)';
        }
        if (upper.includes('ERC20') || upper.includes('ETH') || upper.includes('ETHEREUM')) {
            return 'USDT (ERC20)';
        }
        if (upper.includes('BSC') || upper.includes('BEP20') || upper.includes('BNB')) {
            return 'USDT (BSC/BEP20)';
        }
        if (upper.includes('POLYGON') || upper.includes('MATIC') || upper.includes('POLY')) {
            return 'USDT (Polygon)';
        }
        if (upper.includes('ARBITRUM') || upper.includes('ARB')) {
            return 'USDT (Arbitrum)';
        }
        if (upper.includes('OPTIMISM') || upper.includes('OP')) {
            return 'USDT (Optimism)';
        }
        if (upper.includes('AVALANCHE') || upper.includes('AVAX')) {
            return 'USDT (Avalanche)';
        }
        // Extract network from currency code (e.g., "USDTTRC20" -> "USDT (TRC20)")
        const match = upper.match(/USDT(.+)/);
        if (match && match[1]) {
            return `USDT (${match[1]})`;
        }
        return upper;
    };

    // Sort currencies - standard USDT first, then alphabetically
    const sortCurrencies = (currencies: string[]): string[] => {
        return [...currencies].sort((a, b) => {
            const aUpper = a.toUpperCase();
            const bUpper = b.toUpperCase();
            // Put exact "USDT" first
            if (aUpper === 'USDT' && bUpper !== 'USDT') return -1;
            if (bUpper === 'USDT' && aUpper !== 'USDT') return 1;
            // Then sort alphabetically
            return aUpper.localeCompare(bUpper);
        });
    };

    // NOWPayments functions
    const fetchNOWPaymentsCurrencies = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/deposit-addresses/nowpayments/currencies`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const sorted = sortCurrencies(data.currencies || []);
                setNpCurrencies(sorted);
            }
        } catch (err) {
            console.error('Failed to fetch NOWPayments currencies:', err);
        }
    };

    const createNOWPaymentsDeposit = async () => {
        if (!npAmount || parseFloat(npAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!npPayCurrency || npPayCurrency.trim() === '') {
            setError('Please select a payment currency');
            return;
        }

        // Check pending payment count
        if (pendingPaymentCount >= 3) {
            setError('You already have 3 pending payments. Please complete or cancel existing payments before creating a new one.');
            return;
        }

        setNpLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/deposit-addresses/nowpayments/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(npAmount),
                    currency: npCurrency,
                    payCurrency: npPayCurrency
                })
            });

            if (response.ok) {
                const data = await response.json();
                setNpPayment(data.payment);
                // Update pending count
                setPendingPaymentCount(prev => prev + 1);
                // Refresh deposit history
                fetchDepositHistory();
                // Start checking payment status
                checkPaymentStatus(data.payment.payment_id);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create payment');
            }
        } catch (err) {
            console.error('Error creating NOWPayments deposit:', err);
            setError('Network error. Please try again.');
        } finally {
            setNpLoading(false);
        }
    };

    const checkPaymentStatus = async (paymentId: number) => {
        setNpCheckingStatus(true);
        
        const checkInterval = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
                const response = await fetch(`${API_BASE}/api/deposit-addresses/nowpayments/status/${paymentId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Handle expired payment
                    if (data.expired || data.payment_status === 'expired') {
                        clearInterval(checkInterval);
                        setNpCheckingStatus(false);
                        setNpPayment(null);
                        setNpAmount('');
                        // Update pending count
                        setPendingPaymentCount(prev => Math.max(0, prev - 1));
                        fetchDepositHistory();
                        setError(data.error || 'This payment link has expired. Please create a new payment.');
                        return;
                    }
                    
                    if (data.payment_status === 'finished') {
                        clearInterval(checkInterval);
                        setNpCheckingStatus(false);
                        setNpPayment(null);
                        setNpAmount('');
                        // Update pending count
                        setPendingPaymentCount(prev => Math.max(0, prev - 1));
                        fetchDepositHistory();
                        alert('Payment completed! Your balance has been credited.');
                    } else if (['failed', 'refunded', 'expired'].includes(data.payment_status)) {
                        clearInterval(checkInterval);
                        setNpCheckingStatus(false);
                        setNpPayment(null);
                        setNpAmount('');
                        // Update pending count
                        setPendingPaymentCount(prev => Math.max(0, prev - 1));
                        fetchDepositHistory();
                        setError(`Payment ${data.payment_status}`);
                    } else {
                        // Update payment with latest status
                        setNpPayment((prev) => prev ? { ...prev, payment_status: data.payment_status } : null);
                    }
                }
            } catch (err) {
                console.error('Error checking payment status:', err);
            }
        }, 5000); // Check every 5 seconds

        // Stop checking after 10 minutes
        setTimeout(() => {
            clearInterval(checkInterval);
            setNpCheckingStatus(false);
        }, 600000);
    };

    // Flutterwave functions
    const initializeFlutterwavePayment = async () => {
        if (!fwAmount || parseFloat(fwAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setFwLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
            
            // Get user info from token or fetch it
            // For now, we'll use defaults and let the backend get user info
            const response = await fetch(`${API_BASE}/api/deposit-addresses/flutterwave/initialize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(fwAmount),
                    currency: fwCurrency,
                    customerName: '', // Backend will get from user
                    customerEmail: '', // Backend will get from user
                    customerPhone: '' // Backend will get from user
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.payment && data.payment.link) {
                    setFwPaymentLink(data.payment.link);
                    // Redirect user to Flutterwave payment page
                    window.location.href = data.payment.link;
                } else {
                    setError('Failed to get payment link');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to initialize payment');
            }
        } catch (err) {
            console.error('Error initializing Flutterwave payment:', err);
            setError('Network error. Please try again.');
        } finally {
            setFwLoading(false);
        }
    };

    // Only show full error page for critical authentication errors
    if (error && error === 'Not authenticated') {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                padding: window.innerWidth <= 768 ? '4px' : '20px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div className="error-message">
                    <h2>❌ Authentication Error</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
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
                background: 'var(--bg)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                padding: window.innerWidth <= 768 ? '4px' : '20px',
                width: '100%',
                minHeight: '100vh',
                boxSizing: 'border-box'
        }}>
            <div className="deposit-container" style={{padding: '0'}}>
                {/* Method Selector */}
                <TabFilter
                  tabs={[
                    { id: 'bitget', label: '🎯 Direct Deposit' },
                    { id: 'nowpayments', label: '🌐 Multi Networks' },
                    { id: 'flutterwave', label: '💳 Fiat Payment' }
                  ]}
                  activeTab={depositMethod}
                  onTabChange={(tabId) => setDepositMethod(tabId as typeof depositMethod)}
                />

                {error && (
                    <div style={{
                        padding: '12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        {error}
                    </div>
                )}

            <div className="deposit-grid">
                {depositMethod === 'bitget' ? (
                    <>
                        <div className="deposit-card main-card">
                            <div className="card-header">
                                <div>
                                    <h2><span>💰</span>Your Deposit Address</h2>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Send USDT to this address</p>
                                </div>
                                {depositInfo && (
                                    <div className="badges">
                                        <span className="coin-badge">{depositInfo.coin || 'USDT'}</span>
                                        <span className="network-badge">{depositInfo.network || 'TRC20'}</span>
                                    </div>
                                )}
                            </div>
                            
                            {depositInfo ? (
                                <div className="address-section">
                                    <div className="address-text">{depositInfo.address}</div>
                                    <button 
                                        onClick={() => copyToClipboard(depositInfo.address)}
                                        title={copied ? 'Copied!' : 'Copy address'}
                                        style={{
                                            background: copied ? '#4CAF50' : 'var(--secondary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '32px',
                                            height: '32px',
                                            flexShrink: 0
                                        }}
                                    >
                                        <span>{copied ? '✓' : '📋'}</span>
                                    </button>
                                </div>
                            ) : loading ? (
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <span className="loading-dots">Loading address...</span>
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#f59e0b' }}>
                                    <p>No deposit address assigned yet. Please contact support or use NOWPayments method.</p>
                                </div>
                            )}
                        </div>

                        <div className="info-cards">
                            <div className="info-card">
                                <h3>📋 Quick Steps</h3>
                                <ul>
                                    <li>Copy address above</li>
                                    <li>Send USDT (TRC20)</li>
                                    <li>Wait 3-5 minutes</li>
                                    <li>Auto-credited</li>
                                </ul>
                            </div>

                            <div className="info-card warning">
                                <h3>⚠️ Important</h3>
                                <ul>
                                    <li>Only USDT (TRC20)</li>
                                    <li>Min: 10 USDT</li>
                                    <li>Auto-processed</li>
                                    <li>Contact support if delayed</li>
                                </ul>
                            </div>
                        </div>
                    </>
                ) : depositMethod === 'nowpayments' ? (
                    <>
                        <div className="deposit-card main-card">
                            <div className="card-header">
                                <div>
                                    <h2><span>🌐</span>Multi-network Deposit</h2>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Choose your preferred network</p>
                                </div>
                            </div>
                            
                            {!npPayment ? (
                                <div style={{ padding: '12px' }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem' }}>
                                            Amount (USDT)
                                        </label>
                                        <input
                                            type="text"
                                            value={npAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Allow only numbers and one decimal point
                                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                    setNpAmount(value);
                                                }
                                            }}
                                            placeholder="Enter amount"
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg)',
                                                color: 'var(--text)',
                                                fontSize: '0.8rem',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)' }}>
                                            💰 Payment Currency <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            value={npPayCurrency}
                                            onChange={(e) => setNpPayCurrency(e.target.value)}
                                            className="currency-select"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '2px solid var(--border)',
                                                background: 'var(--bg)',
                                                color: 'var(--text)',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                                appearance: 'none',
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'dark' ? '%239ca3af' : '%236b7280'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 12px center',
                                                paddingRight: '36px'
                                            }}
                                        >
                                            <option value="" disabled style={{ padding: '8px' }}>
                                                🌐 Choose USDT Network
                                            </option>
                                            {npCurrencies.map(currency => (
                                                <option key={currency} value={currency} style={{ padding: '8px' }}>
                                                    {formatCurrencyName(currency)}
                                                </option>
                                            ))}
                                        </select>
                                        {npPayCurrency && (
                                            <div style={{
                                                marginTop: '6px',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-secondary)',
                                                fontStyle: 'italic'
                                            }}>
                                                Selected: {formatCurrencyName(npPayCurrency)}
                                            </div>
                                        )}
                                    </div>

                                    {pendingPaymentCount >= 3 && (
                                        <div style={{
                                            marginBottom: '10px',
                                            padding: '8px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            color: '#ef4444',
                                            textAlign: 'center'
                                        }}>
                                            ⚠️ You have {pendingPaymentCount} pending payments. Please complete or cancel existing payments before creating a new one.
                                        </div>
                                    )}
                                    <button
                                        onClick={createNOWPaymentsDeposit}
                                        disabled={npLoading || !npAmount || !npPayCurrency || pendingPaymentCount >= 3}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            background: npLoading || !npAmount || !npPayCurrency || pendingPaymentCount >= 3 ? '#ccc' : 'var(--primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: npLoading || !npAmount || !npPayCurrency || pendingPaymentCount >= 3 ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {npLoading ? 'Creating...' : 'Create Payment'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: '12px' }}>
                                    <div className="payment-created-box">
                                        <h3 className="payment-created-title">⚠️ Payment Created</h3>
                                        <p className="payment-created-text">Send <strong>{npPayment.pay_amount} {formatCurrencyName(npPayment.pay_currency)}</strong> to:</p>
                                        <div className="payment-address-box">
                                            {npPayment.pay_address}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(npPayment.pay_address)}
                                            style={{
                                                width: '100%',
                                                padding: '6px',
                                                background: 'var(--secondary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginBottom: '8px',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {copied ? '✓ Copied!' : '📋 Copy'}
                                        </button>
                                        <p className="payment-status-text">
                                            Status: <strong>{npPayment.payment_status}</strong>
                                            {npPayment.expiration_estimate_date && (
                                                <><br />Expires: {new Date(npPayment.expiration_estimate_date).toLocaleString()}</>
                                            )}
                                        </p>
                                        {npCheckingStatus && (
                                            <p className="payment-checking-text">
                                                🔄 Checking...
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNpPayment(null);
                                            setNpAmount('');
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '6px',
                                            background: 'transparent',
                                            color: 'var(--text)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        New Payment
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="info-cards">
                            <div className="info-card">
                                <h3>📋 Steps</h3>
                                <ul>
                                    <li>Enter amount</li>
                                    <li>Select currency</li>
                                    <li>Send payment</li>
                                    <li>Auto-credited</li>
                                </ul>
                            </div>

                            <div className="info-card warning">
                                <h3>⚠️ Notes</h3>
                                <ul>
                                    <li>Multi-crypto supported</li>
                                    <li>Expires in 3 hours</li>
                                    <li>Auto-processed</li>
                                    <li>Min: $1 USD</li>
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="deposit-card main-card">
                            <div className="card-header">
                                <div>
                                    <h2><span>💳</span>Fiat Deposit</h2>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Pay with card, bank, or mobile money</p>
                                </div>
                            </div>
                            
                            {!fwPaymentLink ? (
                                <div style={{ padding: '12px' }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.85rem' }}>
                                            Amount
                                        </label>
                                        <input
                                            type="text"
                                            value={fwAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Allow only numbers and one decimal point
                                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                    setFwAmount(value);
                                                }
                                            }}
                                            placeholder="Enter amount"
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg)',
                                                color: 'var(--text)',
                                                fontSize: '0.8rem',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)' }}>
                                            💰 Currency <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            value={fwCurrency}
                                            onChange={(e) => setFwCurrency(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '2px solid var(--border)',
                                                background: 'var(--bg)',
                                                color: 'var(--text)',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                                appearance: 'none',
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'dark' ? '%239ca3af' : '%236b7280'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 12px center',
                                                paddingRight: '36px'
                                            }}
                                        >
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="NGN">NGN - Nigerian Naira</option>
                                            <option value="KES">KES - Kenyan Shilling</option>
                                            <option value="GHS">GHS - Ghanaian Cedi</option>
                                            <option value="ZAR">ZAR - South African Rand</option>
                                            <option value="UGX">UGX - Ugandan Shilling</option>
                                            <option value="TZS">TZS - Tanzanian Shilling</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => { /* disabled for now */ }}
                                        disabled={true}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            background: '#ccc',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: 'not-allowed',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        Coming soon
                                    </button>

                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: 'rgba(59, 130, 246, 0.08)',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '6px',
                                        color: '#3b82f6',
                                        fontSize: '0.85rem',
                                        textAlign: 'center'
                                    }}>
                                        ℹ️ Fiat card/bank payments are coming soon.
                                    </div>
                                    
                                    {/* Success Message */}
                                    {fwSuccess && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            border: '1px solid #10b981',
                                            borderRadius: '6px',
                                            color: '#10b981',
                                            fontSize: '0.85rem',
                                            textAlign: 'center'
                                        }}>
                                            ✅ {fwSuccess}
                                        </div>
                                    )}
                                    
                                    {/* Verification Status */}
                                    {fwVerifying && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '6px',
                                            color: '#3b82f6',
                                            fontSize: '0.85rem',
                                            textAlign: 'center'
                                        }}>
                                            🔄 Verifying payment status...
                                        </div>
                                    )}
                                    
                                    {/* Error Message */}
                                    {error && depositMethod === 'flutterwave' && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid #ef4444',
                                            borderRadius: '6px',
                                            color: '#ef4444',
                                            fontSize: '0.85rem',
                                            textAlign: 'center'
                                        }}>
                                            ⚠️ {error}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: '12px', textAlign: 'center' }}>
                                    <p style={{ marginBottom: '16px' }}>Redirecting to payment page...</p>
                                    <button
                                        onClick={() => window.location.href = fwPaymentLink}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Open Payment Page
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="info-cards">
                            <div className="info-card">
                                <h3>📋 Steps</h3>
                                <ul>
                                    <li>Enter amount</li>
                                    <li>Select currency</li>
                                    <li>Complete payment</li>
                                    <li>Auto-credited</li>
                                </ul>
                            </div>

                            <div className="info-card warning">
                                <h3>⚠️ Notes</h3>
                                <ul>
                                    <li>Multiple payment methods</li>
                                    <li>Card, Bank, Mobile Money</li>
                                    <li>Secure & Fast</li>
                                    <li>Auto-converted to USDT</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}

            </div>
            </div>
        </div>
        </>
    );
};

export default Deposit;
