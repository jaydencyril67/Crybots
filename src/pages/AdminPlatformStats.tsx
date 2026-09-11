import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaUsers, 
  FaHandshake, 
  FaCalculator,
  FaCoins,
  FaServer,
  FaCopy,
  FaBell,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

const API = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';

const AdminPlatformStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/api/admin/platform-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        setError('Failed to fetch platform stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toLocaleString();
  };

  const statCards = [
    // Financial Overview
    {
      title: 'Total Deposits',
      value: stats?.totalDeposits || 0,
      unit: 'USDT',
      color: '#27ae60',
      icon: FaArrowUp,
      gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)'
    },
    {
      title: 'Total Withdrawals',
      value: stats?.totalWithdrawals || 0,
      unit: 'USDT',
      color: '#e74c3c',
      icon: FaArrowDown,
      gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
    },
    {
      title: 'Net Cash Flow',
      value: stats?.netCashFlow || 0,
      unit: 'USDT',
      color: stats?.netCashFlow >= 0 ? '#27ae60' : '#e74c3c',
      icon: FaCalculator,
      gradient: stats?.netCashFlow >= 0 
        ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)'
        : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.pendingWithdrawals || 0,
      unit: '',
      color: '#f39c12',
      icon: FaExclamationTriangle,
      gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
    },
    
    // User Metrics
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      unit: '',
      color: '#1e3c72',
      icon: FaUsers,
      gradient: 'linear-gradient(135deg, #1e3c72 0%, #4a90e2 100%)'
    },
    {
      title: 'Active Users (30d)',
      value: stats?.activeUsers || 0,
      unit: '',
      color: '#16a085',
      icon: FaChartLine,
      gradient: 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)'
    },
    
    // Trading Metrics
    {
      title: 'P2P Trades',
      value: stats?.totalP2PTrades || 0,
      unit: '',
      color: '#8e44ad',
      icon: FaHandshake,
      gradient: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)'
    },
    {
      title: 'Deposit Count',
      value: stats?.totalDepositCount || 0,
      unit: '',
      color: '#3498db',
      icon: FaCheckCircle,
      gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
    },
    {
      title: 'Withdrawal Count',
      value: stats?.totalWithdrawalCount || 0,
      unit: '',
      color: '#e74c3c',
      icon: FaCheckCircle,
      gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
    },
    
    // Service Metrics
    {
      title: 'Mining Contracts',
      value: stats?.totalMiningContracts || 0,
      unit: 'Active',
      color: '#f39c12',
      icon: FaCoins,
      gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
    },
    {
      title: 'Staking Contracts',
      value: stats?.totalStakingContracts || 0,
      unit: 'Active',
      color: '#16a085',
      icon: FaServer,
      gradient: 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)'
    },
    {
      title: 'Copy Positions',
      value: stats?.totalCopyPositions || 0,
      unit: 'Active',
      color: '#3498db',
      icon: FaCopy,
      gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
    },
    
    // System Metrics
    {
      title: 'Notifications Sent',
      value: stats?.totalNotifications || 0,
      unit: '',
      color: '#8e44ad',
      icon: FaBell,
      gradient: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)'
    }
  ];

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f3f7fd',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box'
  };

  const headerStyle: React.CSSProperties = {
    background: '#ffffff',
    padding: '0.5rem 1rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid rgba(120,130,150,0.13)'
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0d1b3d',
    textAlign: 'center' as const,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    padding: '0.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '1200px',
    boxSizing: 'border-box'
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    color: '#0d1b3d',
    fontWeight: 500
  };

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f7fd',
    borderTop: '4px solid #1e3c72',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const errorStyle: React.CSSProperties = {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    fontWeight: 500,
    textAlign: 'center' as const,
    border: '1px solid #fecaca'
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(120,130,150,0.13)',
    padding: '1rem',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '120px',
    boxSizing: 'border-box'
  };

  const accentStyle: React.CSSProperties = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    borderRadius: '12px 12px 0 0'
  };

  const cardContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    flex: 1
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    flexShrink: 0,
    marginTop: '0.25rem'
  };

  const cardInfoStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem'
  };

  const cardTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };

  const cardValueStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.25rem',
    flexWrap: 'wrap' as const
  };

  const cardNumberStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 800,
    lineHeight: 1.2
  };

  const cardUnitStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    opacity: 0.8
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (min-width: 768px) {
          .stats-header { padding: 0.75rem 1.5rem !important; }
          .stats-title { font-size: 1.125rem !important; }
          .stats-main { padding: 1.25rem !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
          .stats-card { padding: 1.25rem !important; min-height: 140px !important; }
          .stats-icon { font-size: 1.75rem !important; }
          .stats-title-text { font-size: 0.875rem !important; }
          .stats-number { font-size: 1.5rem !important; }
        }
        
        @media (min-width: 1024px) {
          .stats-main { padding: 1.5rem !important; }
          .stats-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 1.25rem !important; }
          .stats-card { min-height: 150px !important; }
          .stats-icon { font-size: 2rem !important; }
          .stats-number { font-size: 1.75rem !important; }
        }
        
        @media (max-width: 480px) {
          .stats-main { padding: 0.5rem !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem !important; }
          .stats-card { padding: 0.75rem !important; min-height: 100px !important; }
          .stats-icon { font-size: 1.25rem !important; }
          .stats-title-text { font-size: 0.65rem !important; }
          .stats-number { font-size: 1rem !important; }
          .stats-unit { font-size: 0.65rem !important; }
        }
        
        @media (max-width: 360px) {
          .stats-main { padding: 0.375rem !important; }
          .stats-grid { gap: 0.375rem !important; }
          .stats-card { padding: 0.625rem !important; min-height: 90px !important; }
        }
      `}</style>
      <div style={pageStyle}>
        <header className="stats-header" style={headerStyle}>
          <h1 className="stats-title" style={titleStyle}>Platform Statistics</h1>
        </header>
        
        <main className="stats-main" style={mainStyle}>
          {loading && (
            <div style={loadingStyle}>
              <div style={spinnerStyle}></div>
              <span>Loading statistics...</span>
            </div>
          )}
          
          {error && (
            <div style={errorStyle}>
              <span>{error}</span>
            </div>
          )}
          
          {!loading && !error && stats && (
            <div className="stats-grid" style={gridStyle}>
              {statCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <div 
                    key={index} 
                    className="stats-card"
                    style={cardStyle}
                  >
                    <div 
                      className="stats-accent"
                      style={{ ...accentStyle, background: card.gradient }}
                    ></div>
                    <div className="stats-card-content" style={cardContentStyle}>
                      <div 
                        className="stats-icon"
                        style={{ ...iconStyle, color: card.color }}
                      >
                        <IconComponent />
                      </div>
                      <div className="stats-card-info" style={cardInfoStyle}>
                        <h3 className="stats-title-text" style={cardTitleStyle}>{card.title}</h3>
                        <div 
                          className="stats-value" 
                          style={{ ...cardValueStyle, color: card.color }}
                        >
                          <span className="stats-number" style={cardNumberStyle}>
                            {card.unit === 'USDT' 
                              ? formatNumber(Math.abs(card.value))
                              : card.value.toLocaleString()}
                          </span>
                          {card.unit && card.unit !== '' && (
                            <span className="stats-unit" style={cardUnitStyle}>{card.unit}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminPlatformStats;