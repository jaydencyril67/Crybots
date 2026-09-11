import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Activity {
  _id: string;
  type: string;
  user?: { fullName: string; email: string; spotid: string };
  createdAt: string;
  details?: any;
}

const API = process.env.REACT_APP_API_BASE_URL;

const AdminRecent: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('Not authenticated');
        const res = await axios.get(`${API}/api/admin/recent-activities`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Only keep activities from the last 7 days
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const filtered = (res.data.activities || []).filter((a: Activity) => now - new Date(a.createdAt).getTime() <= sevenDaysMs);
        setAllActivities(filtered);
        setActivities(filtered);
      } catch (e: any) {
        setError(e?.response?.data?.error || e.message || 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // Filter activities when filterType changes
  useEffect(() => {
    if (filterType === 'all') {
      setActivities(allActivities);
    } else {
      setActivities(allActivities.filter(activity => activity.type === filterType));
    }
  }, [filterType, allActivities]);

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'USER_SIGNUP', label: 'User Signup' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'DEPOSIT_SUBMITTED', label: 'Deposit Submitted' },
    { value: 'DEPOSIT', label: 'Deposit Approved' },
    { value: 'DEPOSIT_REJECTED', label: 'Deposit Rejected' },
    { value: 'WITHDRAWAL_SUBMITTED', label: 'Withdrawal Submitted' },
    { value: 'WITHDRAWAL_APPROVED', label: 'Withdrawal Approved' },
    { value: 'WITHDRAWAL_REJECTED', label: 'Withdrawal Rejected' },
    { value: 'TRANSFER', label: 'Transfer' },
    { value: 'CONVERT', label: 'Convert' },
    { value: 'ADMIN_SEND_FUNDS', label: 'Admin Send Funds' },
    { value: 'USER_BANNED', label: 'User Banned' },
    { value: 'USER_UNBANNED', label: 'User Unbanned' },
    { value: 'VALID_MEMBER_TOGGLED', label: 'Valid Member Toggled' },
    { value: 'USER_UPDATE', label: 'User Update' },
  ];

  const getActivityTypeColor = (type: string): string => {
    const colorMap: { [key: string]: string } = {
      'USER_SIGNUP': '#10b981',
      'LOGIN': '#3b82f6',
      'DEPOSIT': '#10b981',
      'DEPOSIT_SUBMITTED': '#f59e0b',
      'DEPOSIT_REJECTED': '#ef4444',
      'WITHDRAWAL_APPROVED': '#10b981',
      'WITHDRAWAL_SUBMITTED': '#f59e0b',
      'WITHDRAWAL_REJECTED': '#ef4444',
      'TRANSFER': '#8b5cf6',
      'CONVERT': '#06b6d4',
      'ADMIN_SEND_FUNDS': '#6366f1',
      'USER_BANNED': '#ef4444',
      'USER_UNBANNED': '#10b981',
      'VALID_MEMBER_TOGGLED': '#f59e0b',
      'USER_UPDATE': '#6366f1',
    };
    return colorMap[type] || '#6b7280';
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderActivityDetails = (activity: Activity) => {
    if (!activity.details) return null;

    if (activity.type === 'USER_UPDATE' && activity.details.updatedFields) {
      const fields = Object.entries(activity.details.updatedFields)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
            return `${key}: ${value.old === null ? 'null' : value.old} → ${value.new === null ? 'null' : value.new}`;
          } else {
            return `${key}: ${value === null ? 'null' : value}`;
          }
        })
        .join(' • ');
      return <span>{fields}</span>;
    }
    
    if (activity.type === 'TRANSFER') {
      if (activity.details.action === 'sent') {
        return (
          <span>
            Sent {activity.details.amount} {activity.details.currency} to {activity.details.recipient} (SpotID: {activity.details.recipientSpotId})
          </span>
        );
      } else if (activity.details.action === 'received') {
        return (
          <span>
            Received {activity.details.amount} {activity.details.currency} from {activity.details.sender} (SpotID: {activity.details.senderSpotId})
          </span>
        );
      }
    }
    
    if (activity.type === 'DEPOSIT_SUBMITTED') {
      return (
        <span>
          Deposit request: {activity.details.amount} USDT via {activity.details.network || 'TRC20'} (TXID: {activity.details.txid})
        </span>
      );
    }
    
    if (activity.type === 'DEPOSIT') {
      return (
        <span>
          Deposit approved: {activity.details.amount} USDT (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'DEPOSIT_REJECTED') {
      return (
        <span>
          Deposit rejected: {activity.details.amount} USDT (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'WITHDRAWAL_SUBMITTED') {
      return (
        <span>
          Withdrawal request: {activity.details.amount} USDT to {activity.details.wallet}
        </span>
      );
    }
    
    if (activity.type === 'WITHDRAWAL_APPROVED') {
      return (
        <span>
          Withdrawal approved: {activity.details.amount} USDT (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'WITHDRAWAL_REJECTED') {
      return (
        <span>
          Withdrawal rejected: {activity.details.amount} USDT (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'CONVERT') {
      return (
        <span>
          Converted {activity.details.amount} ({activity.details.direction})
        </span>
      );
    }
    
    if (activity.type === 'ADMIN_SEND_FUNDS') {
      return (
        <span>
          Admin sent {activity.details.amount} {activity.details.currency} (Tag: "{activity.details.tag}") (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'USER_BANNED') {
      return (
        <span>
          User banned (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'USER_UNBANNED') {
      return (
        <span>
          User unbanned (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'VALID_MEMBER_TOGGLED') {
      return (
        <span>
          Valid member: {activity.details.previousStatus ? 'Valid' : 'Invalid'} → {activity.details.newStatus ? 'Valid' : 'Invalid'} (Admin: {activity.details.admin})
        </span>
      );
    }
    
    if (activity.type === 'LOGIN') {
      return (
        <span>
          Logged in from device: {activity.details.device || 'Unknown'}
        </span>
      );
    }
    
    if (activity.type === 'USER_SIGNUP') {
      return (
        <span>
          New user signup (SpotID: {activity.details.spotid})
        </span>
      );
    }
    
    // Default fallback
    return <span>{Object.keys(activity.details).length ? JSON.stringify(activity.details) : 'No further details.'}</span>;
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#fff',
    padding: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  };

  const isMobile = windowWidth <= 480;
  const isTablet = windowWidth <= 768;
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isTablet ? 'column' : 'row',
    alignItems: isTablet ? 'stretch' : 'center',
    justifyContent: 'space-between',
    gap: isTablet ? '12px' : '16px',
    background: '#f6f9fe',
    padding: isMobile ? '12px' : '16px 20px',
    borderBottom: '1.5px solid #232b36',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1rem' : isTablet ? '1.1rem' : '1.25rem',
    fontWeight: 700,
    color: '#232b36',
    letterSpacing: '0.5px',
    margin: 0,
    lineHeight: 1.2,
  };

  const headerRightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const countStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.75rem' : '0.8rem',
    color: '#6b7280',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };

  const filterStyle: React.CSSProperties = {
    padding: isMobile ? '6px 10px' : '8px 12px',
    border: '1px solid #e3e6ef',
    borderRadius: '6px',
    fontSize: isMobile ? '0.8rem' : '0.875rem',
    backgroundColor: '#fff',
    color: '#232b36',
    cursor: 'pointer',
    boxSizing: 'border-box',
    minWidth: isMobile ? '140px' : '160px',
    outline: 'none',
  };

  const contentStyle: React.CSSProperties = {
    padding: isMobile ? '12px' : isTablet ? '16px' : '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px 20px',
    color: '#1e3c72',
  };

  const spinnerStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    border: '3px solid #e3e6ef',
    borderTop: '3px solid #1e3c72',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const errorStyle: React.CSSProperties = {
    padding: '16px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: '16px 0',
  };

  const emptyStyle: React.CSSProperties = {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.875rem',
  };

  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #e5e7eb',
    padding: isMobile ? '12px' : '14px 16px',
    cursor: 'default',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '10px',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
  };

  const cardTypeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 1 auto',
    minWidth: 0,
  };

  const typeBadgeStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
    boxShadow: '0 0 0 2px rgba(255,255,255,0.8)',
  };

  const typeTextStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#1e3c72',
    fontSize: isMobile ? '0.75rem' : '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const cardTimeStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    flexShrink: 0,
  };

  const timeAgoStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.7rem' : '0.75rem',
    color: '#6b7280',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };

  const timeFullStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.65rem' : '0.7rem',
    color: '#9ca3af',
    fontWeight: 400,
    display: isTablet ? 'none' : 'inline',
  };

  const getUserStyle = (hasDetails: boolean): React.CSSProperties => ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: isMobile ? '6px' : '8px',
    marginBottom: hasDetails ? '8px' : 0,
    fontSize: isMobile ? '0.8rem' : '0.875rem',
  });

  const userNameStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#1f2937',
    fontSize: isMobile ? '0.8rem' : '0.875rem',
  };

  const userEmailStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: isMobile ? '0.7rem' : '0.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: isMobile ? '150px' : '200px',
  };

  const userSpotIdStyle: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: isMobile ? '0.7rem' : '0.75rem',
    fontWeight: 500,
  };

  const cardDetailsStyle: React.CSSProperties = {
    background: '#f7faff',
    padding: isMobile ? '8px 10px' : '10px 12px',
    borderRadius: '6px',
    fontSize: isMobile ? '0.75rem' : '0.8rem',
    color: '#1e3c72',
    border: '1px solid #eaf1fb',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    marginTop: '8px',
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Recent Activities</h1>
        <div style={headerRightStyle}>
          <span style={countStyle}>
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={filterStyle}
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={contentStyle}>
        {loading && (
          <div style={loadingStyle}>
            <div style={spinnerStyle}></div>
            <span style={{ fontSize: '0.875rem' }}>Loading activities...</span>
          </div>
        )}
        
        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}
        
        {!loading && activities.length === 0 && (
          <div style={emptyStyle}>
            <span>No recent activities found.</span>
          </div>
        )}
        
        {!loading && activities.length > 0 && (
          <div style={listStyle}>
            {activities.map((activity) => (
              <div 
                key={activity._id} 
                style={cardStyle}
              >
                <div style={cardHeaderStyle}>
                  <div style={cardTypeStyle}>
                    <span 
                      style={{
                        ...typeBadgeStyle,
                        backgroundColor: getActivityTypeColor(activity.type),
                      }}
                    ></span>
                    <span style={typeTextStyle}>
                      {activity.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={cardTimeStyle}>
                    <span style={timeAgoStyle}>{formatTimeAgo(activity.createdAt)}</span>
                    <span style={timeFullStyle}>
                      {new Date(activity.createdAt).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
                
                <div style={getUserStyle(!!activity.details)}>
                  <span style={userNameStyle}>{activity.user?.fullName || 'Unknown User'}</span>
                  {activity.user?.email && (
                    <span style={userEmailStyle} title={activity.user.email}>
                      {isMobile && activity.user.email.length > 20
                        ? activity.user.email.substring(0, 20) + '...'
                        : activity.user.email}
                    </span>
                  )}
                  {activity.user?.spotid && (
                    <span style={userSpotIdStyle}>ID: {activity.user.spotid}</span>
                  )}
                </div>
                
                {activity.details && (
                  <div style={cardDetailsStyle}>
                    {renderActivityDetails(activity)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecent;