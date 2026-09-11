import React, { useState, useEffect } from 'react';
import { FaWallet, FaHistory, FaCoins, FaExchangeAlt, FaUser, FaClock, FaEye, FaEyeSlash, FaArrowsAltH, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL;

const StatisticsProfile: React.FC = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    // Navigate to login page
    navigate('/login');
  };

  // Add CSS to make scrollbar 1000% invisible
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .stats-horizontal-scroll {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      .stats-horizontal-scroll::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .stats-horizontal-scroll::-webkit-scrollbar-thumb {
        display: none !important;
      }
      .stats-horizontal-scroll::-webkit-scrollbar-track {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch statistics data
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view statistics');
        return;
      }

      const response = await axios.get(`${API}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // The API returns data directly, not wrapped in success/data structure
      setStatistics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  const formatTimeAgo = (days: number) => {
    if (days < 1) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  const handleProfilePictureUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
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
          const token = localStorage.getItem('token');
          if (token) {
            await axios.put(`${API}/api/portfolio`, { profilePicture: data.secure_url }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchStatistics(); // Refresh data
          }
        }
      } catch (err) {
        setError('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Component for dot loading animation
  const DotLoader = () => (
    <span className="loading-dots" style={{ 
      color: 'var(--text-muted)', 
      fontSize: '0.8rem',
      fontWeight: 'bold',
      letterSpacing: '1px'
    }}>
      ...
    </span>
  );

  // Ensure all required properties exist with default values
  const safeStats = {
    totalDeposits: statistics?.totalDeposits || 0,
    totalWithdrawals: statistics?.totalWithdrawals || 0,
    depositCount: statistics?.depositCount || 0,
    withdrawalCount: statistics?.withdrawalCount || 0,
    buyOrderCount: statistics?.buyOrderCount || 0,
    sellOrderCount: statistics?.sellOrderCount || 0,
    pendingWithdrawals: statistics?.pendingWithdrawals || 0,
    totalBuyOrders: statistics?.totalBuyOrders || 0,
    totalSellOrders: statistics?.totalSellOrders || 0,
    totalTransfers: statistics?.totalTransfers || 0,
    transferCount: statistics?.transferCount || 0,
    accountAge: statistics?.accountAge || 0,
    usdtBalance: statistics?.usdtBalance || 0,
    btcBalance: statistics?.btcBalance || 0,
    usdtWallet: statistics?.usdtWallet || '',
    accountCreated: statistics?.accountCreated || new Date(),
    fullName: statistics?.fullName || '',
    email: statistics?.email || '',
    profilePicture: statistics?.profilePicture || '',
    spotid: statistics?.spotid || '',
  };

  return (
    <div style={{
      background: 'var(--bg)',
      padding: isMobile ? '12px' : '20px',
      width: '100%',
      minHeight: '100vh',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
        {error && (
          <div style={{
            background: 'var(--error-bg, #ffe6e6)',
            color: 'var(--error-color, #d32f2f)',
            padding: '8px 10px',
            borderRadius: '6px',
            marginBottom: '12px',
            border: '1px solid var(--error-color, #d32f2f)',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        {/* User Profile Card */}
        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: 'none',
          marginBottom: '12px',
          overflow: 'hidden'
        }}>
          {/* Profile Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            height: '80px',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {/* Profile Picture */}
              <div style={{ position: 'relative' }}>
                <img
                  src={safeStats.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeStats.fullName || 'User')}&size=60&background=var(--primary)&color=fff`}
                  alt="Profile"
                  onClick={handleProfilePictureUpload}
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    border: '3px solid white',
                    cursor: 'pointer',
                    objectFit: 'cover'
                  }}
                />
                {uploading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px'
                  }}>
                    Uploading...
                  </div>
                )}
              </div>

              {/* User Info */}
              <div style={{ color: 'white' }}>
                <h2 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  margin: 0,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {loading ? <DotLoader /> : (safeStats.fullName || 'TradeSpot User')}
                </h2>
                <p style={{ 
                  fontSize: '0.8rem', 
                  margin: 0,
                  opacity: 0.9,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {loading ? <DotLoader /> : safeStats.email}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div style={{ padding: '12px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '8px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Spot ID:</span>
                <span style={{ color: 'var(--text)', fontWeight: '500' }}>{loading ? <DotLoader /> : safeStats.spotid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Joined:</span>
                <span style={{ color: 'var(--text)', fontWeight: '500' }}>
                  {loading ? <DotLoader /> : new Date(safeStats.accountCreated).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '6px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: 'none',
          marginBottom: '8px',
          padding: '8px'
        }}>
          <h3 style={{ 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            margin: '0 0 6px 0', 
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <FaWallet size={12} />
            Portfolio Balance
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
          }}>
            <div style={{
              background: 'var(--bg)',
              borderRadius: '4px',
              padding: '6px 8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                USDT
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text)' }}>
                {loading ? <DotLoader /> : `$${formatCurrency(safeStats.usdtBalance, 2)}`}
              </div>
            </div>
            <div style={{
              background: 'var(--bg)',
              borderRadius: '4px',
              padding: '6px 8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                BTC
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text)' }}>
                {loading ? <DotLoader /> : `₿ ${formatCurrency(safeStats.btcBalance, 8)}`}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div 
          className="stats-horizontal-scroll"
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '8px',
            marginBottom: '12px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Deposits */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: 'none',
            padding: '10px',
            textAlign: 'center',
            minWidth: '160px',
            flexShrink: 0,
            scrollSnapAlign: 'start'
          }}>
            <div style={{ 
              color: 'var(--primary)', 
              fontSize: '1.2rem',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaWallet />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Total Deposits
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
              {loading ? <DotLoader /> : `$${formatCurrency(safeStats.totalDeposits)}`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : `${safeStats.depositCount} transactions`}
            </div>
          </div>

          {/* Withdrawals */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: 'none',
            padding: '10px',
            textAlign: 'center',
            minWidth: '160px',
            flexShrink: 0,
            scrollSnapAlign: 'start'
          }}>
            <div style={{ 
              color: 'var(--secondary)', 
              fontSize: '1.2rem',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaHistory />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Total Withdrawals
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
              {loading ? <DotLoader /> : `$${formatCurrency(safeStats.totalWithdrawals)}`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : `${safeStats.withdrawalCount} transactions`}
            </div>
          </div>

          {/* Buy Orders */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: 'none',
            padding: '10px',
            textAlign: 'center',
            minWidth: '160px',
            flexShrink: 0,
            scrollSnapAlign: 'start'
          }}>
            <div style={{ 
              color: '#10b981', 
              fontSize: '1.2rem',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaCoins />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Buy Orders
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
              {loading ? <DotLoader /> : `$${formatCurrency(safeStats.totalBuyOrders)}`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : `${safeStats.buyOrderCount} orders`}
            </div>
          </div>

          {/* Sell Orders */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: 'none',
            padding: '10px',
            textAlign: 'center',
            minWidth: '160px',
            flexShrink: 0,
            scrollSnapAlign: 'start'
          }}>
            <div style={{ 
              color: '#ef4444', 
              fontSize: '1.2rem',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaExchangeAlt />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Sell Orders
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
              {loading ? <DotLoader /> : `$${formatCurrency(safeStats.totalSellOrders)}`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : `${safeStats.sellOrderCount} orders`}
            </div>
          </div>

          {/* Total Transfers */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: 'none',
            padding: '10px',
            textAlign: 'center',
            minWidth: '160px',
            flexShrink: 0,
            scrollSnapAlign: 'start'
          }}>
            <div style={{ 
              color: '#8b5cf6', 
              fontSize: '1.2rem',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaArrowsAltH />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Total Transfers
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
              {loading ? <DotLoader /> : `$${formatCurrency(safeStats.totalTransfers)}`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : `${safeStats.transferCount} transfers`}
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: 'none',
          padding: '16px',
          textAlign: 'center'
        }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
            }}
          >
            <FaSignOutAlt size={16} />
            Logout
          </button>
        </div>
    </div>
  );
};

export default StatisticsProfile;
