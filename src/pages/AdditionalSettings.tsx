import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

const AdditionalSettings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved preferences
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
  }, []);

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Save preferences to localStorage
      localStorage.setItem('language', language);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setSuccess('✅ Preferences saved successfully!');
    } catch (error) {
      setError('❌ Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? '12px' : '24px',
      maxWidth: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          background: '#4CAF50',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideIn 0.3s ease',
          fontSize: '0.9rem'
        }}>
          <span>✅</span>
          {success}
        </div>
      )}
      
      {error && (
        <div style={{
          background: '#f44336',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
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

      {/* Settings Grid */}
       <div style={{ 
         maxWidth: '800px', 
         margin: '0 auto',
         display: 'flex',
         flexDirection: 'column',
         gap: '6px'
       }}>
                 {/* Theme Settings */}
         <div style={{
           background: 'var(--card-bg)',
           borderRadius: '10px',
           padding: '8px',
           boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
           border: 'none'
         }}>
           <h3 style={{ 
             fontSize: '0.75rem', 
             fontWeight: 600, 
             color: 'var(--text)',
             marginBottom: '6px',
             display: 'flex',
             alignItems: 'center',
             gap: '6px'
           }}>
             <span>🎨</span>
             Appearance
           </h3>
           
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
                Theme
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Choose your preferred theme
              </div>
            </div>
            <button
              onClick={toggleTheme}
                style={{
                background: theme === 'dark' ? 'var(--primary)' : 'var(--secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: 0,
                fontSize: '1.2rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

                 {/* Language Settings */}
         <div style={{
           background: 'var(--card-bg)',
           borderRadius: '10px',
           padding: '8px',
           boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
           border: 'none'
         }}>
           <h3 style={{ 
             fontSize: '0.85rem', 
             fontWeight: 500, 
             color: 'var(--text)',
             marginBottom: '6px',
             display: 'flex',
             alignItems: 'center',
             gap: '6px'
           }}>
             <span>🌍</span>
             Language
           </h3>
           
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
                Interface Language
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Select your preferred language
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--secondary)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="zh">🇨🇳 中文</option>
            </select>
          </div>
        </div>



                 {/* Save Button */}
         <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '0.72rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
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
          
          @media (max-width: 768px) {
            div[style*="max-width: 800px"] {
              max-width: 100% !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 14px !important;
            }
            
            div[style*="font-size: 1rem"] {
              font-size: 0.75rem !important;
            }
            
            div[style*="font-size: 0.75rem"] {
              font-size: 0.8rem !important;
            }
            
            div[style*="font-size: 0.75rem"] {
              font-size: 0.7rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdditionalSettings;
