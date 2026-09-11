import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import pushNotificationManager, { NotificationPreferences as NotificationPreferencesType } from '../services/pushNotificationManager';

const NotificationPreferences: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'email' | 'push' | 'inApp'>('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);

  const [pushStatus, setPushStatus] = useState({
    isSupported: false,
    hasPermission: false,
    isSubscribed: false
  });

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, []);

  // Auto-dismiss error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await pushNotificationManager.getNotificationPreferences();
      setPreferences(data.preferences);
      // Get the correct push status structure
      const status = await pushNotificationManager.getSubscriptionStatus();
      setPushStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    try {
      const status = await pushNotificationManager.getSubscriptionStatus();
      setPushStatus(prev => ({
        ...prev,
        ...status
      }));
    } catch (err) {
      console.error('Failed to check push status:', err);
    }
  };

  const handleChannelToggle = (channel: 'email' | 'push' | 'inApp', enabled: boolean) => {
    if (!preferences) return; // Don't allow changes while loading
    setPreferences(prev => prev ? ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled
      }
    }) : null);
  };

  const handleCategoryToggle = (channel: 'email' | 'push' | 'inApp', category: string, enabled: boolean) => {
    if (!preferences) return; // Don't allow changes while loading
    setPreferences(prev => prev ? ({
      ...prev,
      [channel]: {
        ...prev[channel],
        categories: {
          ...prev[channel].categories,
          [category]: enabled
        }
      }
    }) : null);
  };

  const handlePushSubscribe = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      console.log('Starting push notification subscription...');
      
      // Check if push notifications are supported
      if (!pushNotificationManager.isPushSupported()) {
        setError('Push notifications are not supported in this browser or VAPID keys are missing');
        return;
      }
      
      // Check current permission status
      const permission = await pushNotificationManager.getPermissionStatus();
      console.log('Current permission status:', permission);
      
      if (permission === 'denied') {
        setError('Notification permission was denied. Please enable notifications in your browser settings.');
        return;
      }
      
      const success = await pushNotificationManager.subscribe();
      if (success) {
        setSuccess('Successfully subscribed to push notifications');
        await checkPushStatus();
      } else {
        setError('Failed to subscribe to push notifications. Check console for details.');
      }
    } catch (err: any) {
      console.error('Push subscription error:', err);
      setError(`Failed to subscribe to push notifications: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePushUnsubscribe = async () => {
    try {
      setSaving(true);
      const success = await pushNotificationManager.unsubscribe();
      if (success) {
        setSuccess('Successfully unsubscribed from push notifications');
        await checkPushStatus();
      } else {
        setError('Failed to unsubscribe from push notifications');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe from push notifications');
    } finally {
      setSaving(false);
    }
  };


  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      if (!preferences) return;
      const success = await pushNotificationManager.updateNotificationPreferences(preferences);
      if (success) {
        setSuccess('Notification preferences saved successfully');
      } else {
        setError('Failed to save notification preferences');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      deposits: '💰',
      withdrawals: '💸',
      trades: '📈',
      security: '🔒',
      marketing: '📢',
      system: '⚙️'
    };
    return icons[category] || '📄';
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      deposits: 'Deposits',
      withdrawals: 'Withdrawals',
      trades: 'Trades',
      security: 'Security',
      marketing: 'Marketing',
      system: 'System'
    };
    return names[category] || category;
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

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#c33',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#efe',
            border: '1px solid #cfc',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#3c3',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        {/* Tab Filter */}
        <TabFilter
          tabs={[
            { id: 'email', label: '📧 Email' },
            { id: 'push', label: '🔔 Push' },
            { id: 'inApp', label: '💬 In-App' }
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
        />

        {/* Tab Content */}
        {activeTab === 'email' && (
        <>
        {/* Email Notifications */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>📧</span>
              <div>
                <h3 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold',
                  margin: '0 0 4px 0',
                  color: 'var(--text)'
                }}>
                  Email Notifications
                </h3>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  margin: 0,
                  fontSize: '0.9rem'
                }}>
                  Via email
                </p>
              </div>
            </div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={preferences?.email.enabled || false}
                onChange={(e) => handleChannelToggle('email', e.target.checked)}
                disabled={loading || !preferences}
                style={{ 
                  width: '18px', 
                  height: '18px',
                  accentColor: 'var(--primary)'
                }}
              />
              <span style={{ 
                fontSize: '1rem',
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                {loading || !preferences ? <span className="loading-dots">...</span> : (preferences.email.enabled ? 'On' : 'Off')}
              </span>
            </label>
          </div>

          {(preferences?.email.enabled || false) && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '12px',
              marginTop: '16px'
            }}>
              {preferences && Object.entries(preferences.email.categories).map(([category, enabled]) => (
                <label key={category} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleCategoryToggle('email', category, e.target.checked)}
                    disabled={loading || !preferences}
                    style={{ 
                      width: '16px', 
                      height: '16px',
                      accentColor: 'var(--primary)'
                    }}
                  />
                  <span style={{ fontSize: '1.2rem' }}>
                    {getCategoryIcon(category)}
                  </span>
                  <span style={{ 
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'var(--text)'
                  }}>
                    {getCategoryName(category)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        </>
        )}

        {activeTab === 'push' && (
        <>
        {/* Push Notifications */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>🔔</span>
              <div>
                <h3 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold',
                  margin: '0 0 4px 0',
                  color: 'var(--text)'
                }}>
                  Push Notifications
                </h3>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  margin: 0,
                  fontSize: '0.9rem'
                }}>
                  Real-time device notifications
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!pushStatus.isSupported && (
                <span style={{ 
                  fontSize: '0.8rem',
                  color: '#f66',
                  background: '#fee',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  Not Supported
                </span>
              )}
              {pushStatus.isSupported && !pushStatus.hasPermission && (
                <span style={{ 
                  fontSize: '0.8rem',
                  color: '#f66',
                  background: '#fee',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  Permission Required
                </span>
              )}
              {pushStatus.isSupported && pushStatus.hasPermission && (
                <span style={{ 
                  fontSize: '0.8rem',
                  color: pushStatus.isSubscribed ? '#3c3' : '#f66',
                  background: pushStatus.isSubscribed ? '#efe' : '#fee',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {pushStatus.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                </span>
              )}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={preferences?.push.enabled || false}
                  onChange={(e) => handleChannelToggle('push', e.target.checked)}
                  disabled={loading || !preferences || !pushStatus.isSupported || !pushStatus.isSubscribed}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    accentColor: 'var(--primary)'
                  }}
                />
                <span style={{ 
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'var(--text)'
                }}>
                  {loading || !preferences ? <span className="loading-dots">...</span> : (preferences.push.enabled ? 'On' : 'Off')}
                </span>
              </label>
            </div>
          </div>

          {pushStatus.isSupported && (
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              {!pushStatus.isSubscribed ? (
                <button
                  onClick={handlePushSubscribe}
                  disabled={saving}
                  className="notification-btn"
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {saving && <span className="loading-dots">...</span>}
                  Subscribe
                </button>
              ) : (
                <button
                  onClick={handlePushUnsubscribe}
                  disabled={saving}
                  className="notification-btn"
                  style={{
                    background: '#f66',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {saving && <span className="loading-dots">...</span>}
                  Unsubscribe
                </button>
              )}
            </div>
          )}

          {(preferences?.push.enabled || false) && pushStatus.isSubscribed && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '12px',
              marginTop: '16px'
            }}>
              {preferences && Object.entries(preferences.push.categories).map(([category, enabled]) => (
                <label key={category} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleCategoryToggle('push', category, e.target.checked)}
                    disabled={loading || !preferences}
                    style={{ 
                      width: '16px', 
                      height: '16px',
                      accentColor: 'var(--primary)'
                    }}
                  />
                  <span style={{ fontSize: '1.2rem' }}>
                    {getCategoryIcon(category)}
                  </span>
                  <span style={{ 
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'var(--text)'
                  }}>
                    {getCategoryName(category)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        </>
        )}

        {activeTab === 'inApp' && (
        <>
        {/* In-App Notifications */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
              <div>
                <h3 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold',
                  margin: '0 0 4px 0',
                  color: 'var(--text)'
                }}>
                  In-App Notifications
                </h3>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  margin: 0,
                  fontSize: '0.9rem'
                }}>
                  Within the app
                </p>
              </div>
            </div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={preferences?.inApp.enabled || false}
                onChange={(e) => handleChannelToggle('inApp', e.target.checked)}
                disabled={loading || !preferences}
                style={{ 
                  width: '18px', 
                  height: '18px',
                  accentColor: 'var(--primary)'
                }}
              />
              <span style={{ 
                fontSize: '1rem',
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                {loading || !preferences ? <span className="loading-dots">...</span> : (preferences.inApp.enabled ? 'On' : 'Off')}
              </span>
            </label>
          </div>

          {(preferences?.inApp.enabled || false) && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '12px',
              marginTop: '16px'
            }}>
              {preferences && Object.entries(preferences.inApp.categories).map(([category, enabled]) => (
                <label key={category} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleCategoryToggle('inApp', category, e.target.checked)}
                    disabled={loading || !preferences}
                    style={{ 
                      width: '16px', 
                      height: '16px',
                      accentColor: 'var(--primary)'
                    }}
                  />
                  <span style={{ fontSize: '1.2rem' }}>
                    {getCategoryIcon(category)}
                  </span>
                  <span style={{ 
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'var(--text)'
                  }}>
                    {getCategoryName(category)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        </>
        )}

        {/* Save Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '24px'
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="notification-btn save-btn"
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            {saving && <span className="loading-dots">...</span>}
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
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

      {/* Responsive Styles */}
      <style>
        {`
          /* Desktop Compact Styles */
          @media (min-width: 769px) {
            .notification-preferences-container {
              max-width: 900px !important;
              padding: 20px !important;
            }
            
            .notification-preferences-container > div {
              padding: 12px !important;
              margin-bottom: 12px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 12px !important;
            }
            
            div[style*="margin-bottom: 20px"] {
              margin-bottom: 12px !important;
            }
            
            div[style*="margin-bottom: 16px"] {
              margin-bottom: 8px !important;
            }
            
            div[style*="margin-bottom: 24px"] {
              margin-bottom: 16px !important;
            }
            
            h3[style*="font-size: 1.2rem"] {
              font-size: 1rem !important;
            }
            
            p[style*="font-size: 0.9rem"] {
              font-size: 0.8rem !important;
            }
            
            span[style*="font-size: 1.5rem"] {
              font-size: 1.2rem !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))"] {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 8px !important;
            }
            
            div[style*="padding: 12px"] {
              padding: 8px !important;
            }
            
            div[style*="gap: 12px"]:has(label) {
              gap: 6px !important;
            }
            
            div[style*="gap: 8px"]:has(input) {
              gap: 6px !important;
            }
            
            button[style*="padding: 8px 16px"] {
              padding: 6px 12px !important;
              font-size: 0.85rem !important;
            }
            
            .save-btn {
              padding: 8px 20px !important;
              font-size: 0.85rem !important;
            }
            
            span[style*="font-size: 0.9rem"] {
              font-size: 0.85rem !important;
            }
          }
          
          /* Large Desktop - Make it even more compact */
          @media (min-width: 1024px) {
            .notification-preferences-container {
              max-width: 800px !important;
            }
          }
          
          @media (max-width: 768px) {
            div[style*="max-width: 1200px"] {
              padding: 12px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 16px !important;
            }
            
            div[style*="padding: 16px"] {
              padding: 12px !important;
            }
            
            div[style*="padding: 12px"] {
              padding: 8px !important;
            }
            
            div[style*="margin-bottom: 24px"] {
              margin-bottom: 16px !important;
            }
            
            div[style*="margin-bottom: 20px"] {
              margin-bottom: 12px !important;
            }
            
            div[style*="margin-bottom: 16px"] {
              margin-bottom: 8px !important;
            }
            
            h1[style*="font-size: 2rem"] {
              font-size: 1.5rem !important;
            }
            
            h3[style*="font-size: 1.2rem"] {
              font-size: 1rem !important;
            }
            
            p[style*="font-size: 1rem"] {
              font-size: 0.8rem !important;
            }
            
            p[style*="font-size: 0.9rem"] {
              font-size: 0.7rem !important;
            }
            
            span[style*="font-size: 1.5rem"] {
              font-size: 1.2rem !important;
            }
            
            span[style*="font-size: 1.2rem"] {
              font-size: 1rem !important;
            }
            
            span[style*="font-size: 1rem"] {
              font-size: 0.8rem !important;
            }
            
            span[style*="font-size: 0.9rem"] {
              font-size: 0.7rem !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))"] {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8px !important;
            }
            
            button[style*="padding: 12px 32px"] {
              padding: 8px 20px !important;
              font-size: 0.8rem !important;
            }
            
            button[style*="padding: 8px 16px"] {
              padding: 6px 12px !important;
              font-size: 0.7rem !important;
            }
            
            /* Notification buttons mobile styles */
            .notification-btn {
              padding: 6px 12px !important;
              font-size: 0.75rem !important;
              min-width: 60px !important;
              border-radius: 6px !important;
              min-height: 32px !important;
            }
            
            .save-btn {
              padding: 8px 20px !important;
              font-size: 0.8rem !important;
              min-height: 36px !important;
            }
            
            input[style*="width: 18px"] {
              width: 16px !important;
              height: 16px !important;
            }
            
            input[style*="width: 16px"] {
              width: 14px !important;
              height: 14px !important;
            }
          }
          
          @media (max-width: 480px) {
            div[style*="max-width: 1200px"] {
              padding: 8px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 12px !important;
            }
            
            div[style*="padding: 16px"] {
              padding: 8px !important;
            }
            
            div[style*="padding: 12px"] {
              padding: 6px !important;
            }
            
            h1[style*="font-size: 2rem"] {
              font-size: 1.3rem !important;
            }
            
            h3[style*="font-size: 1.2rem"] {
              font-size: 0.9rem !important;
            }
            
            p[style*="font-size: 1rem"] {
              font-size: 0.7rem !important;
            }
            
            p[style*="font-size: 0.9rem"] {
              font-size: 0.6rem !important;
            }
            
            span[style*="font-size: 1.5rem"] {
              font-size: 1rem !important;
            }
            
            span[style*="font-size: 1.2rem"] {
              font-size: 0.9rem !important;
            }
            
            span[style*="font-size: 1rem"] {
              font-size: 0.7rem !important;
            }
            
            span[style*="font-size: 0.9rem"] {
              font-size: 0.6rem !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))"] {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 6px !important;
            }
            
            div[style*="gap: 12px"] {
              gap: 6px !important;
            }
            
            div[style*="gap: 8px"] {
              gap: 4px !important;
            }
            
            button[style*="padding: 12px 32px"] {
              padding: 6px 16px !important;
              font-size: 0.7rem !important;
            }
            
            button[style*="padding: 8px 16px"] {
              padding: 4px 8px !important;
              font-size: 0.6rem !important;
            }
            
            /* Notification buttons small mobile styles */
            .notification-btn {
              padding: 5px 10px !important;
              font-size: 0.7rem !important;
              min-width: 50px !important;
              border-radius: 5px !important;
              min-height: 30px !important;
            }
            
            .save-btn {
              padding: 6px 16px !important;
              font-size: 0.7rem !important;
              min-height: 32px !important;
            }
            
            input[style*="width: 18px"] {
              width: 14px !important;
              height: 14px !important;
            }
            
            input[style*="width: 16px"] {
              width: 12px !important;
              height: 12px !important;
            }
          }
          
          @media (max-width: 360px) {
            div[style*="max-width: 1200px"] {
              padding: 6px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 10px !important;
            }
            
            div[style*="padding: 16px"] {
              padding: 6px !important;
            }
            
            div[style*="padding: 12px"] {
              padding: 4px !important;
            }
            
            h1[style*="font-size: 2rem"] {
              font-size: 1.1rem !important;
            }
            
            h3[style*="font-size: 1.2rem"] {
              font-size: 0.8rem !important;
            }
            
            p[style*="font-size: 1rem"] {
              font-size: 0.6rem !important;
            }
            
            p[style*="font-size: 0.9rem"] {
              font-size: 0.5rem !important;
            }
            
            span[style*="font-size: 1.5rem"] {
              font-size: 0.9rem !important;
            }
            
            span[style*="font-size: 1.2rem"] {
              font-size: 0.8rem !important;
            }
            
            span[style*="font-size: 1rem"] {
              font-size: 0.6rem !important;
            }
            
            span[style*="font-size: 0.9rem"] {
              font-size: 0.5rem !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))"] {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 4px !important;
            }
            
            button[style*="padding: 12px 32px"] {
              padding: 4px 12px !important;
              font-size: 0.6rem !important;
            }
            
            button[style*="padding: 8px 16px"] {
              padding: 3px 6px !important;
              font-size: 0.5rem !important;
            }
            
            /* Notification buttons extra small mobile styles */
            .notification-btn {
              padding: 4px 8px !important;
              font-size: 0.65rem !important;
              min-width: 40px !important;
              border-radius: 4px !important;
              min-height: 28px !important;
            }
            
            .save-btn {
              padding: 4px 12px !important;
              font-size: 0.6rem !important;
              min-height: 28px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationPreferences;
