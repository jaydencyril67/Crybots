import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatTradeSpotTime } from '../utils/tradeSpotTime';

const API = process.env.REACT_APP_API_BASE_URL;

interface TrashItem {
  _id: string;
  text: string;
  createdAt: string;
}

const Trash: React.FC = () => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      const res = await axios.get(`${API}/api/admin/trash`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!input.trim()) return;
    // Prevent duplicate items
    if (items.some(item => item.text.trim().toLowerCase() === input.trim().toLowerCase())) {
      setError('Duplicate item: This text already exists in trash.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      await axios.post(`${API}/api/admin/trash`, { text: input }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInput('');
      setSuccess('Saved!');
      fetchItems();
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  // Delete a trash item
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this trash item?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      await axios.delete(`${API}/api/admin/trash/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Deleted!');
      setItems(items.filter(item => item._id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => item.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fa)' }}>
      {/* Compact Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: 'var(--card-bg, #ffffff)', 
        padding: '12px 20px', 
        borderBottom: '1px solid var(--border, #e3e6ef)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <span style={{ 
          fontSize: '1.3rem', 
          fontWeight: 700, 
          color: 'var(--text, #232b36)', 
          letterSpacing: 0.5,
          fontFamily: 'inherit'
        }}>
          🗑️ Admin Trash Bin
        </span>
        {items.length > 0 && (
          <span style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-muted, #888)', 
            fontWeight: 500
          }}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Main Content Container */}
      <div style={{ 
        maxWidth: '900px', 
        margin: '20px auto', 
        padding: '0 16px'
      }}>
        {/* Input Section */}
        <div style={{ 
          background: 'var(--card-bg, #ffffff)', 
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid var(--border, #e3e6ef)'
        }}>
          <form onSubmit={handleAdd} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter text to save..."
                style={{ 
                  flex: 1, 
                  padding: '10px 14px', 
                  fontSize: '0.9rem', 
                  border: '1px solid var(--border, #e3e6ef)', 
                  borderRadius: '8px',
                  background: 'var(--bg, #f8f9fa)',
                  color: 'var(--text, #232b36)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1e3c72';
                  e.target.style.boxShadow = '0 0 0 3px rgba(30, 60, 114, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e3e6ef';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '10px 20px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(30, 60, 114, 0.3)'
                }} 
                disabled={loading}
              >
                {loading ? '⏳' : '💾 Save'}
              </button>
            </div>
          </form>

          {/* Search Bar */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search saved items..."
            style={{ 
              width: '100%',
              padding: '10px 14px', 
              fontSize: '0.9rem', 
              border: '1px solid var(--border, #e3e6ef)', 
              borderRadius: '8px',
              background: 'var(--bg, #f8f9fa)',
              color: 'var(--text, #232b36)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#1e3c72';
              e.target.style.boxShadow = '0 0 0 3px rgba(30, 60, 114, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e3e6ef';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Messages */}
        {error && (
          <div style={{ 
            color: '#e74c3c', 
            padding: '12px 16px',
            marginBottom: '12px',
            borderRadius: '8px',
            background: '#fee',
            border: '1px solid #fcc',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ 
            color: '#27ae60', 
            padding: '12px 16px',
            marginBottom: '12px',
            borderRadius: '8px',
            background: '#efe',
            border: '1px solid #cec',
            fontSize: '0.9rem'
          }}>
            ✓ {success}
          </div>
        )}

        {/* Items List */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: 'var(--text-muted, #888)',
            fontSize: '0.95rem'
          }}>
            ⏳ Loading...
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div style={{ 
            background: 'var(--card-bg, #ffffff)', 
            borderRadius: '12px', 
            padding: '40px 20px',
            textAlign: 'center',
            border: '1px solid var(--border, #e3e6ef)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗑️</div>
            <div style={{ 
              color: 'var(--text-muted, #888)', 
              fontSize: '1rem',
              fontWeight: 500
            }}>
              {search ? 'No items found matching your search.' : 'No items in trash.'}
            </div>
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {filteredItems.map(item => (
              <div 
                key={item._id} 
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid var(--border, #e3e6ef)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text, #25324B)', fontSize: '0.95rem', marginBottom: '8px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                  {item.text}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)', marginBottom: '12px' }}>
                  🕐 {formatTradeSpotTime(item.createdAt)}
                </div>
                <button 
                  onClick={() => handleDelete(item._id)} 
                  style={{ 
                    marginTop: 'auto',
                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '8px 16px', 
                    fontWeight: 600, 
                    fontSize: '0.85rem', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(231, 76, 60, 0.3)',
                    alignSelf: 'flex-start'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responsive Styles */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 768px) {
            div[style*="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))"] {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
            
            div[style*="maxWidth: 900px"] {
              margin: 12px auto !important;
              padding: 0 12px !important;
            }
            
            div[style*="padding: 16px"] {
              padding: 14px !important;
            }
            
            div[style*="font-size: 1.3rem"] {
              font-size: 1.1rem !important;
            }
            
            div[style*="font-size: 0.95rem"] {
              font-size: 0.9rem !important;
            }
            
            button[style*="padding: 10px 20px"] {
              padding: 10px 16px !important;
              font-size: 0.85rem !important;
            }
          }
          
          @media (max-width: 480px) {
            div[style*="maxWidth: 900px"] {
              padding: 0 8px !important;
            }
            
            div[style*="padding: 12px 20px"] {
              padding: 10px 12px !important;
            }
            
            div[style*="padding: 14px"] {
              padding: 12px !important;
            }
            
            div[style*="font-size: 1.1rem"] {
              font-size: 1rem !important;
            }
            
            div[style*="font-size: 0.9rem"] {
              font-size: 0.85rem !important;
            }
            
            input[style*="padding: 10px 14px"] {
              padding: 8px 12px !important;
              font-size: 0.85rem !important;
            }
            
            button[style*="padding: 10px 16px"] {
              padding: 8px 14px !important;
              font-size: 0.8rem !important;
            }
            
            div[style*="font-size: 0.85rem"] {
              font-size: 0.8rem !important;
            }
          }
          
          @media (max-width: 360px) {
            div[style*="padding: 10px 12px"] {
              padding: 8px 10px !important;
            }
            
            div[style*="padding: 12px"] {
              padding: 10px !important;
            }
            
            div[style*="font-size: 1rem"] {
              font-size: 0.95rem !important;
            }
            
            input[style*="padding: 8px 12px"] {
              padding: 8px 10px !important;
              font-size: 0.8rem !important;
            }
            
            button[style*="padding: 8px 14px"] {
              padding: 6px 12px !important;
              font-size: 0.75rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Trash;