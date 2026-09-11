import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import axios from 'axios';
import { FaExclamationCircle, FaCheck, FaHourglass, FaTimes } from 'react-icons/fa';
import TabFilter from '../components/TabFilter';

interface Order {
  _id: string;
  symbol: string;
  type: 'market' | 'limit' | 'stop_limit' | 'stop_market';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  stopPrice?: number;
  status: 'open' | 'partially_filled' | 'filled' | 'canceled' | 'rejected';
  filledAmount: number;
  remainingAmount: number;
  avgExecutionPrice?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

const Orders: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/l');
        return;
      }

      // Determine which status to filter by based on active tab
      let statusFilter = '';
      if (activeTab === 'open') {
        statusFilter = 'status=open&status=partially_filled';
      } else {
        statusFilter = 'status=filled&status=canceled&status=rejected';
      }

      const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await axios.get(`${API}/api/trading/orders?${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Ensure response data is an array
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setOrders([]); // Set empty array on error
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/l');
        return;
      }

      const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      await axios.delete(`${API}/api/trading/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Order canceled successfully');
      fetchOrders(); // Refresh orders after cancellation
    } catch (err: any) {
      console.error('Error canceling order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <FaHourglass color="#3b82f6" />;
      case 'partially_filled':
        return <FaHourglass color="#f59e0b" />;
      case 'filled':
        return <FaCheck color="#16a34a" />;
      case 'canceled':
        return <FaTimes color="#6b7280" />;
      case 'rejected':
        return <FaExclamationCircle color="#dc2626" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#3b82f6';
      case 'partially_filled':
        return '#f59e0b';
      case 'filled':
        return '#16a34a';
      case 'canceled':
        return '#6b7280';
      case 'rejected':
        return '#dc2626';
      default:
        return 'var(--text)';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Market';
    return price.toFixed(2);
  };

  return (
    <>
      {/* Loading Animation Styles */}
      <style>
        {`
          @keyframes loading-dots {
            0%, 20% { opacity: 0; }
            50% { opacity: 1; }
            80%, 100% { opacity: 0; }
          }
          .loading-dots {
            animation: loading-dots 1.5s infinite;
            font-weight: bold;
            letter-spacing: 2px;
          }
        `}
      </style>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: window.innerWidth <= 768 ? '4px' : '20px'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Tab Navigation */}
            <div style={{ marginBottom: '12px' }}>
              <TabFilter
                tabs={[
                  { id: 'open', label: 'Open Orders' },
                  { id: 'completed', label: 'Order History' }
                ]}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as 'open' | 'completed')}
              />
            </div>

            {/* Success Message */}
            {success && (
              <div style={{
                color: '#16a34a',
                marginBottom: '12px',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}>
                <FaCheck />
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                color: '#dc2626',
                marginBottom: '12px',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}>
                <FaExclamationCircle />
                {error}
              </div>
            )}

            {/* Orders Table */}
            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Pair</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Side</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Filled</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Status</th>
                    {activeTab === 'open' && <th style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 600 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={activeTab === 'open' ? 9 : 8} style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Loading orders<span className="loading-dots">...</span>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'open' ? 9 : 8} style={{ textAlign: 'center', padding: '16px', fontSize: '13px' }}>
                        No {activeTab} orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr
                        key={order._id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: 'var(--card-bg)'
                        }}
                      >
                        <td style={{ padding: '8px 6px', fontSize: '12px' }}>{formatDate(order.createdAt)}</td>
                        <td style={{ padding: '8px 6px', fontSize: '12px', fontWeight: 500 }}>{order.symbol}</td>
                        <td style={{ padding: '8px 6px', fontSize: '12px', textTransform: 'capitalize' }}>{order.type}</td>
                        <td style={{
                          padding: '8px 6px',
                          fontSize: '12px',
                          color: order.side === 'buy' ? '#16a34a' : '#dc2626',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {order.side}
                        </td>
                        <td style={{ padding: '8px 6px', fontSize: '12px' }}>{formatPrice(order.price)}</td>
                        <td style={{ padding: '8px 6px', fontSize: '12px' }}>{order.amount.toFixed(8)}</td>
                        <td style={{ padding: '8px 6px', fontSize: '12px' }}>
                          {order.filledAmount.toFixed(8)}
                          {' '}
                          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                            ({((order.filledAmount / order.amount) * 100).toFixed(0)}%)
                          </span>
                        </td>
                        <td style={{ padding: '8px 6px', fontSize: '12px' }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: getStatusColor(order.status)
                          }}>
                            {getStatusIcon(order.status)}
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        {activeTab === 'open' && (
                          <td style={{ padding: '8px 6px' }}>
                            <button
                              onClick={() => cancelOrder(order._id)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: 'transparent',
                                color: 'var(--text)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              Cancel
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style>
        {`
          @media (max-width: 768px) {
            /* Make table scrollable on mobile */
            div[style*="overflowX: auto"] {
              -webkit-overflow-scrolling: touch;
            }
            
            /* Reduce padding on mobile */
            th, td {
              padding: 6px 4px !important;
              font-size: 11px !important;
            }
            
            /* Smaller buttons on mobile */
            button {
              padding: 4px 8px !important;
              font-size: 10px !important;
            }
            
            /* Compact header on mobile */
            h1 {
              font-size: 16px !important;
            }
          }
          
          @media (max-width: 480px) {
            /* Extra compact for very small screens */
            th, td {
              padding: 4px 2px !important;
              font-size: 10px !important;
            }
            
            h1 {
              font-size: 14px !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Orders;
