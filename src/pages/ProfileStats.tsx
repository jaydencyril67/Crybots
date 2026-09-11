import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaKey, FaBell, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaFingerprint, FaMobileAlt, FaClock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL;

interface SecurityStats {
  twoFactorEnabled: boolean;
  webauthnEnabled: boolean;
  notificationsEnabled: boolean;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  recentSecurityChanges: SecurityChange[];
  newDeviceLogins: DeviceLogin[];
  lastPasswordChange: string;
  lastLogin: string;
  trustedDevices: number;
}

interface SecurityChange {
  id: string;
  type: 'password' | '2fa' | 'webauthn' | 'email' | 'withdrawal';
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

interface DeviceLogin {
  id: string;
  deviceInfo: string;
  location: string;
  timestamp: string;
  trusted: boolean;
}

const ProfileStats: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSensitive, setShowSensitive] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CSS for invisible scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .profile-stats-scroll {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      .profile-stats-scroll::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch security statistics
  useEffect(() => {
    const fetchSecurityStats = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/api/statistics/security-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (err: any) {
        setError('Failed to load security statistics.');
        console.error('Security stats error:', err);
      }
      setLoading(false);
    };
    fetchSecurityStats();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getSecurityScore = () => {
    if (!stats) return 0;
    let score = 0;
    if (stats.twoFactorEnabled) score += 30;
    if (stats.webauthnEnabled) score += 25;
    if (stats.notificationsEnabled) score += 15;
    if (stats.pendingWithdrawals === 0) score += 10;
    if (!stats.recentSecurityChanges || stats.recentSecurityChanges.length === 0) score += 10;
    if (!stats.newDeviceLogins || stats.newDeviceLogins.length === 0) score += 10;
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
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

  if (error) {
    return (
      <div style={{
        padding: isMobile ? '12px' : '20px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'var(--text)',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: '#ef4444',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaExclamationTriangle />
          {error}
        </div>
      </div>
    );
  }

  const securityScore = getSecurityScore();
  const scoreColor = getScoreColor(securityScore);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      padding: isMobile ? '12px' : '20px',
      width: '100%',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
        
        {/* Header */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '1.1rem',
            fontWeight: 'bold',
            margin: '0 0 6px 0',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <FaShieldAlt size={18} />
            Security & Profile Stats
          </h1>
          
          {/* Security Score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px'
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Security Score:</span>
            <div style={{
              background: scoreColor,
              color: 'white',
              padding: '3px 10px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }}>
              {securityScore}/100
            </div>
          </div>
        </div>

        {/* Security Status Cards */}
        <div className="profile-stats-scroll" style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '8px',
          marginBottom: '12px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}>
          
          {/* 2FA Status */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            minWidth: '140px',
            flexShrink: 0,
            scrollSnapAlign: 'start',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.4rem',
              marginBottom: '6px',
              color: stats?.twoFactorEnabled ? '#10b981' : '#ef4444'
            }}>
              {stats?.twoFactorEnabled ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
            <h3 style={{ margin: '0 0 3px 0', fontSize: '0.8rem', color: 'var(--text)' }}>
              Two-Factor Auth
            </h3>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : (stats?.twoFactorEnabled ? 'Enabled ✅' : 'Disabled ❌')}
            </p>
          </div>

          {/* WebAuthn Status */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            minWidth: '140px',
            flexShrink: 0,
            scrollSnapAlign: 'start',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.4rem',
              marginBottom: '6px',
              color: stats?.webauthnEnabled ? '#10b981' : '#ef4444'
            }}>
              <FaFingerprint />
            </div>
            <h3 style={{ margin: '0 0 3px 0', fontSize: '0.8rem', color: 'var(--text)' }}>
              WebAuthn
            </h3>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : (stats?.webauthnEnabled ? 'Enabled ✅' : 'Disabled ❌')}
            </p>
          </div>

          {/* Notifications Status */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            minWidth: '140px',
            flexShrink: 0,
            scrollSnapAlign: 'start',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.4rem',
              marginBottom: '6px',
              color: stats?.notificationsEnabled ? '#10b981' : '#f59e0b'
            }}>
              <FaBell />
            </div>
            <h3 style={{ margin: '0 0 3px 0', fontSize: '0.8rem', color: 'var(--text)' }}>
              Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : (stats?.notificationsEnabled ? 'Enabled ✅' : 'Disabled ❌')}
            </p>
          </div>

          {/* Pending Withdrawals */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            minWidth: '140px',
            flexShrink: 0,
            scrollSnapAlign: 'start',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.4rem',
              marginBottom: '6px',
              color: (stats?.pendingWithdrawals || 0) > 0 ? '#f59e0b' : '#10b981'
            }}>
              <FaClock />
            </div>
            <h3 style={{ margin: '0 0 3px 0', fontSize: '0.8rem', color: 'var(--text)' }}>
              Pending Withdrawals
            </h3>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {loading ? <DotLoader /> : `${stats?.pendingWithdrawals || 0} withdrawals`}
            </p>
            {(stats?.pendingWithdrawalAmount || 0) > 0 && (
              <p style={{ margin: '3px 0 0 0', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                ${stats?.pendingWithdrawalAmount?.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Recent Security Changes */}
        {stats?.recentSecurityChanges && stats.recentSecurityChanges.length > 0 && (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FaExclamationTriangle size={14} style={{ color: '#f59e0b' }} />
              Recent Security Changes
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stats.recentSecurityChanges.slice(0, 3).map((change) => (
                <div key={change.id} style={{
                  background: 'var(--bg)',
                  padding: '8px',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${change.status === 'success' ? '#10b981' : change.status === 'pending' ? '#f59e0b' : '#ef4444'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text)', fontSize: '0.75rem', fontWeight: '500' }}>
                      {change.description}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                      {formatTimeAgo(change.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Login History */}
        {stats?.newDeviceLogins && stats.newDeviceLogins.length > 0 && (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h3 style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                margin: '0',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FaMobileAlt size={14} style={{ color: '#f59e0b' }} />
                Recent Login History ({Math.min(stats.newDeviceLogins.length, 10)})
              </h3>
              
              <button
                onClick={() => setShowSensitive(!showSensitive)}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--button-text)',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {showSensitive ? <FaEyeSlash size={10} /> : <FaEye size={10} />}
                {showSensitive ? 'Hide' : 'Show'}
              </button>
            </div>
            
            <div className="profile-stats-scroll" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              maxHeight: '240px',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingRight: '2px'
            }}>
              {stats.newDeviceLogins.slice(0, 10).map((login, index) => (
                <div key={login.id} style={{
                  background: 'var(--bg)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${login.trusted ? '#10b981' : '#f59e0b'}`,
                  transition: 'all 0.2s ease',
                  opacity: index === 0 ? 1 : 0.9 - (index * 0.05)
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: index === 0 ? '#10b981' : login.trusted ? '#10b981' : '#f59e0b',
                        flexShrink: 0
                      }} />
                      <span style={{ 
                        color: 'var(--text)', 
                        fontSize: '0.75rem', 
                        fontWeight: index === 0 ? '600' : '500',
                        flex: 1
                      }}>
                        {showSensitive ? login.deviceInfo : '••••••••••••••••'}
                      </span>
                    </div>
                    <span style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: '0.65rem',
                      whiteSpace: 'nowrap',
                      marginLeft: '8px'
                    }}>
                      {formatTimeAgo(login.timestamp)}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginLeft: '14px'
                  }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      color: 'var(--text-muted)',
                      flex: 1
                    }}>
                      {showSensitive ? login.location : '••••••••••••'}
                    </span>
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: login.trusted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: login.trusted ? '#10b981' : '#f59e0b',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      {login.trusted ? 'Trusted' : 'New'}
                    </span>
                  </div>
                  
                  {index === 0 && (
                    <div style={{
                      marginTop: '4px',
                      marginLeft: '14px',
                      fontSize: '0.6rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      Current Session
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {stats.newDeviceLogins.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: 'var(--text-muted)',
                fontSize: '0.8rem'
              }}>
                No recent login activity
              </div>
            )}
          </div>
        )}

        {/* Account Information */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <h3 style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FaKey size={14} />
            Account Security Info
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '8px',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Password Change:</span>
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>
                {loading ? <DotLoader /> : (stats?.lastPasswordChange ? formatTimeAgo(stats.lastPasswordChange) : 'Never')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Login:</span>
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>
                {loading ? <DotLoader /> : (stats?.lastLogin ? formatTimeAgo(stats.lastLogin) : 'Unknown')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Trusted Devices:</span>
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>
                {loading ? <DotLoader /> : (stats?.trustedDevices || 0)}
              </span>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ProfileStats;
