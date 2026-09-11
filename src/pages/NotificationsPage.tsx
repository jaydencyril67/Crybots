import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';

const API = process.env.REACT_APP_API_BASE_URL;

interface Notification {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'security' | 'marketing' | 'system';
  category: 'deposit' | 'withdrawal' | 'trade' | 'security' | 'marketing' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: any;
  channels: string[];
  read: boolean;
  readAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  clickedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: { [key: string]: number };
  byPriority: { [key: string]: number };
}

const NotificationsPage: React.FC = () => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'deposit' | 'withdrawal' | 'trade' | 'security' | 'marketing' | 'system'>('all');
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  // Mark as read if opened with a notificationId query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notificationId = params.get('notificationId');
    if (notificationId) {
      markAsRead(notificationId);
    }
  }, []);

  // Handle service worker message for notification clicks
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;
      if (!message || typeof message !== 'object') return;
      if (message.type === 'NOTIFICATION_CLICK') {
        const nid = message.data?.notificationId;
        if (nid) {
          markAsRead(nid);
        }
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handler);
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handler);
      }
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [page, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (filter === 'unread') {
        params.append('unreadOnly', 'true');
      }

      const res = await fetch(`${API}/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await res.json();
      
      if (page === 1) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
      }
      
      setHasMore(data.pagination?.hasMore || false);
      setUnreadCount(data.pagination?.unreadCount || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API}/api/notifications/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setMarkingAsRead(notificationId);

      // Optimistically update the UI first
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      const res = await fetch(`${API}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Revert the optimistic update if the request failed
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: false, readAt: undefined }
              : notif
          )
        );
        setUnreadCount(prev => prev + 1);
        console.error('Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert the optimistic update if there was an error
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: false, readAt: undefined }
            : notif
        )
      );
      setUnreadCount(prev => prev + 1);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API}/api/notifications/mark-read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      deposit: '💰',
      withdrawal: '💸',
      trade: '📈',
      security: '🔒',
      marketing: '📢',
      system: '⚙️'
    };
    return icons[type] || '📄';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: '#6c757d',
      medium: '#007bff',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  // Remove full-page loading state - show the page structure immediately

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
        padding: '20px 0',
        width: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#f44336',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            marginLeft: '16px',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideIn 0.3s ease',
            fontSize: '0.9rem'
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
          padding: '0 16px'
        }}>
        
        {/* Notifications Summary Card */}
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
            <span>📊</span>
            Notifications Summary
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Total Messages
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                {loading ? <span className="loading-dots">...</span> : notifications.length}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                This Week
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                {loading ? <span className="loading-dots">...</span> : notifications.filter(n => {
                  const notificationDate = new Date(n.createdAt);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return notificationDate >= weekAgo;
                }).length}
              </div>
            </div>
          </div>
        </div>

        </div>

        {/* Notifications List */}
        <div style={{ 
          margin: '16px 0 0',
          padding: '0 16px'
        }}>
        {loading && page === 1 ? (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '40px 16px',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid transparent',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔔</div>
            <div style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
              <span className="loading-dots">....</span>
            </div>
          </div>
        ) : !loading && notifications.length === 0 ? (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '40px 16px',
            boxShadow: 'var(--card-shadow)',
            border: '1px solid transparent',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔔</div>
            <div style={{ 
              fontSize: '1rem', 
              color: 'var(--text)', 
              marginBottom: '8px',
              fontWeight: 600
            }}>
              No Notifications
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)' 
            }}>
              You're all caught up! Check back later for updates.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              maxHeight: '60vh',
              overflowY: 'auto',
              paddingRight: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {notifications.map((notification, index) => (
                <div
                  key={notification._id || index}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                  style={{
                    background: 'var(--card-bg)',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: 'var(--card-shadow)',
                    border: '1px solid transparent',
                    cursor: notification.read ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: notification.read ? 0.7 : 1
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px'
                  }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      marginTop: '2px',
                      color: notification.read ? 'var(--secondary)' : 'var(--text)'
                    }}>
                      {notification.message.includes('deposit') || notification.message.includes('credit') ? '💰' :
                       notification.message.includes('withdraw') || notification.message.includes('debit') ? '💸' :
                       notification.message.includes('security') || notification.message.includes('login') ? '🔐' :
                       notification.message.includes('announcement') || notification.message.includes('update') ? '📢' :
                       notification.message.includes('promo') || notification.message.includes('offer') ? '🎉' : '🔔'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: 'var(--text)', 
                        fontWeight: notification.read ? 400 : 600,
                        lineHeight: '1.4',
                        marginBottom: '6px'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)'
                      }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: markingAsRead === notification._id ? '#28a745' : 'var(--primary)',
                        flexShrink: 0,
                        marginTop: '4px',
                        transition: 'all 0.3s ease'
                      }}></div>
                    )}
                    {markingAsRead === notification._id && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#28a745',
                        marginTop: '4px',
                        fontWeight: 500
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load more control when there are more pages */}
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  onClick={loadMore}
                  style={{
                    background: 'var(--secondary)',
                    color: 'var(--button-text)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
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
          }
        `}
      </style>
      </div>
    </>
  );
};

export default NotificationsPage;
