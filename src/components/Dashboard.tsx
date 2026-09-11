import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrices } from '../hooks/usePrices';
import { getCurrentUser } from '../services/api';
import Deposit from '../pages/Deposit';
import Withdraw from '../pages/Withdraw';
import Transfer from '../pages/Transfer';
import Staking from '../pages/Staking';
import CopyTrading from '../pages/CopyTrading';
import Trading from '../pages/Trading';
import TransactionHistory from '../pages/TransactionHistory';
import Agent from '../pages/Agent';
import Contact from '../pages/Contact';
import UserChat from '../pages/UserChat';
import StatisticsProfile from '../pages/StatisticsProfile';
import ProfileStats from '../pages/ProfileStats';
import EditBasicSettings from '../pages/EditBasicSettings';
import PrivacySettings from '../pages/PrivacySettings';
import WalletSettings from '../pages/WalletSettings';
import NotificationPreferences from '../pages/NotificationPreferences';
import AdditionalSettings from '../pages/AdditionalSettings';
import TwoFASettings from '../pages/TwoFASettings';
import WebauthnManagement from '../pages/WebauthnManagement';
import NotificationsPage from '../pages/NotificationsPage';
import Orders from '../pages/Orders';

// Modern icons - Direct imports
import {
  FaUsers,
  FaDollarSign,
  FaGlobe,
  FaChartLine,
  FaUser,
  FaCog,
  FaBell,
  FaQuoteLeft,
  FaStar,
  FaCalendar,
  FaArrowRight,
  FaWallet,
  FaExchangeAlt,
  FaArrowUp,
  FaFolder,
  FaFolderOpen,
  FaChevronDown,
  FaChevronRight,
  FaPiggyBank,
  FaMoneyBillWave,
  FaHistory,
  FaGamepad,
  FaFileAlt,
  FaShieldAlt,
  FaCreditCard,
  FaTrophy,
  FaCoins,
  FaGift,
  FaLock,
  FaUserFriends,
  FaHandshake,
  FaHeadset,
  FaComments,
  FaEnvelope,
  FaFingerprint,
  FaList
} from 'react-icons/fa';

// Company stats
const companyStats = [
  { label: 'Active Traders', value: '12,847', icon: <FaUsers size={24} />, color: '#3b82f6' },
  { label: 'Total Volume', value: '$2.4B', icon: <FaDollarSign size={24} />, color: '#10b981' },
  { label: 'Success Rate', value: '94.2%', icon: <FaArrowUp size={24} />, color: '#f59e0b' },
  { label: 'Global Reach', value: '150+', icon: <FaGlobe size={24} />, color: '#8b5cf6' },
];





// Sidebar menu interfaces
interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route?: string;
  type: 'folder' | 'file';
  children?: MenuItem[];
}

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

// Sidebar menu structure
const sidebarMenu: MenuItem[] = [
  {
    id: 'assets',
    title: 'Assets',
    icon: <FaWallet size={20} />,
    type: 'folder',
    children: [
      {
        id: 'deposit',
        title: 'Deposit',
        icon: <FaPiggyBank size={16} />,
        route: '/sta',
        type: 'file'
      },
      {
        id: 'withdraw',
        title: 'Withdraw',
        icon: <FaMoneyBillWave size={16} />,
        route: '/withdraw',
        type: 'file'
      },
      {
        id: 'exchange',
        title: 'Exchange',
        icon: <FaExchangeAlt size={16} />,
        route: '/exchange',
        type: 'file'
      }
    ]
  },
  {
    id: 'profile',
    title: 'Profile',
    icon: <FaUser size={20} />,
    type: 'folder',
    children: [
      {
        id: 'details',
        title: 'Details',
        icon: <FaFileAlt size={16} />,
        route: '/sta',
        type: 'file'
      },
      {
        id: 'statistics',
        title: 'Statistics',
        icon: <FaChartLine size={16} />,
        route: '/ps',
        type: 'file'
      }
    ]
  },
  {
    id: 'market',
    title: 'Market',
    icon: <FaChartLine size={20} />,
    type: 'folder',
    children: [
      {
        id: 'staking',
        title: 'Staking',
        icon: <FaGamepad size={16} />,
        route: '/market/staking',
        type: 'file'
      },
      {
        id: 'spot-trade',
        title: 'Spot Trade',
        icon: <FaCoins size={16} />,
        route: '/market/spot',
        type: 'file'
      },
      {
        id: 'copy-trade',
        title: 'Copy Trade',
        icon: <FaTrophy size={16} />,
        route: '/market/copy',
        type: 'file'
      },
      {
        id: 'orders',
        title: 'Trade Orders',
        icon: <FaList size={16} />,
        route: '/market/orders',
        type: 'file'
      }
    ]
  },
  {
    id: 'agents',
    title: 'Agents',
    icon: <FaUsers size={20} />,
    type: 'folder',
    children: [
      {
        id: 'referral-tools',
        title: 'Referral Tools',
        icon: <FaUserFriends size={16} />,
        route: '/ag',
        type: 'file'
      },
      {
        id: 'credits-points',
        title: 'Credits and Points',
        icon: <FaGift size={16} />,
        route: '/agents/credits',
        type: 'file'
      }
    ]
  },
  {
    id: 'records',
    title: 'Records',
    icon: <FaHistory size={20} />,
    type: 'folder',
    children: [
      {
        id: 'transactions',
        title: 'Transactions',
        icon: <FaHistory size={16} />,
        route: '/transactions',
        type: 'file'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <FaCog size={20} />,
    type: 'folder',
    children: [
      {
        id: 'profile-account',
        title: 'Account',
        icon: <FaUser size={16} />,
        route: '/st',
        type: 'file'
      },
      {
        id: 'security-privacy',
        title: 'Security',
        icon: <FaLock size={16} />,
        route: '/settings/security',
        type: 'file'
      },
      {
        id: 'wallet-payments',
        title: 'Payment',
        icon: <FaCreditCard size={16} />,
        route: '/settings/wallet',
        type: 'file'
      },
      {
        id: 'notifications-alerts',
        title: 'Notification',
        icon: <FaBell size={16} />,
        route: '/settings/notifications',
        type: 'file'
      },
      {
        id: 'additional-preferences',
        title: 'Preferences',
        icon: <FaCog size={16} />,
        route: '/settings/preferences',
        type: 'file'
      }
    ]
  },
  {
    id: 'support',
    title: 'Support',
    icon: <FaHeadset size={20} />,
    type: 'folder',
    children: [
      {
        id: 'contact',
        title: 'Contact',
        icon: <FaEnvelope size={16} />,
        route: '/contact',
        type: 'file'
      },
      {
        id: 'live-chat',
        title: 'Live Chat',
        icon: <FaComments size={16} />,
        route: '/chat',
        type: 'file'
      }
    ]
  }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();


  // User data state
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Sidebar state management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); // All folders start collapsed
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string | null>(null); // Track current displayed page

  // Load user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true);
        const user = await getCurrentUser();
        setUserData(user);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
    checkForUnreadNotifications();

    // Check for new notifications every 30 seconds
    const notificationInterval = setInterval(checkForUnreadNotifications, 30000);

    return () => clearInterval(notificationInterval);
  }, []);

  // Check for unread notifications
  const checkForUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API = process.env.REACT_APP_API_BASE_URL;
      const res = await fetch(`${API}/api/notifications/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setHasNewNotifications(data.unread > 0);
      }
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  };

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsSidebarCollapsed(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // Hide sidebar scrollbar completely and add mobile styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-sidebar::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      
      @media (max-width: 768px) {
        .dashboard-grid {
          grid-template-columns: 1fr !important;
          gap: 0 !important;
        }

        .dashboard-card {
          border-radius: 0 !important;
          border-right: none !important;
          border-bottom: 1px solid var(--border-color) !important;
          padding: 16px 12px !important;
        }

        .dashboard-card:last-child {
          border-bottom: none !important;
        }

        .dashboard-welcome {
          padding: 0 12px !important;
          margin-bottom: 16px !important;
        }
      }

      @media (max-width: 480px) {
        .dashboard-card {
          padding: 12px 8px !important;
        }

        .dashboard-welcome {
          padding: 0 8px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Return to dashboard
  const returnToDashboard = () => {
    setCurrentPage(null);
    setActiveMenuItem(null);
  };

  // Handle menu item click
  const handleMenuItemClick = (item: MenuItem) => {
    if (item.type === 'folder') {
      toggleFolder(item.id);
    } else if (item.route) {
      setActiveMenuItem(item.id);

      // Special handling for certain pages to display inline
      if (item.id === 'deposit') {
        setCurrentPage('deposit');
      } else if (item.id === 'withdraw') {
        setCurrentPage('withdraw');
      } else if (item.id === 'exchange') {
        setCurrentPage('transfer');
      } else if (item.id === 'staking') {
        setCurrentPage('staking');
      } else if (item.id === 'copy-trade') {
        setCurrentPage('copytrading');
      } else if (item.id === 'spot-trade') {
        setCurrentPage('trading');
      } else if (item.id === 'orders') {
        setCurrentPage('orders');
      } else if (item.id === 'transactions') {
        setCurrentPage('transactions');
      } else if (item.id === 'referral-tools') {
        setCurrentPage('agent');
      } else if (item.id === 'contact') {
        setCurrentPage('contact');
      } else if (item.id === 'live-chat') {
        setCurrentPage('live-chat');
      } else if (item.id === 'details') {
        setCurrentPage('statistics-profile');
      } else if (item.id === 'statistics') {
        setCurrentPage('profile-stats');
      } else if (item.id === 'profile-account') {
        setCurrentPage('profile-settings');
      } else if (item.id === 'security-privacy') {
        setCurrentPage('security-settings');
      } else if (item.id === 'wallet-payments') {
        setCurrentPage('wallet-settings');
      } else if (item.id === 'notifications-alerts') {
        setCurrentPage('notification-settings');
      } else if (item.id === 'additional-preferences') {
        setCurrentPage('additional-settings');
      } else {
        setCurrentPage(null);
        navigate(item.route);
      }

      if (isMobile) {
        setIsSidebarCollapsed(true);
      }
    }
  };

  // Go back to main dashboard
  const goBackToDashboard = () => {
    setCurrentPage(null);
    setActiveMenuItem(null);
  };

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'deposit':
        return <Deposit />;
      case 'withdraw':
        return <Withdraw />;
      case 'transfer':
        return <Transfer />;
      case 'staking':
        return <Staking />;
      case 'copytrading':
        return <CopyTrading />;
      case 'trading':
        return <Trading />;
      case 'orders':
        return <Orders />;
      case 'transactions':
        return <TransactionHistory />;
      case 'agent':
        return <Agent />;
      case 'contact':
        return <Contact />;
      case 'live-chat':
        return <UserChat />;
      case 'statistics-profile':
        return <StatisticsProfile />;
      case 'profile-stats':
        return <ProfileStats />;
      case 'profile-settings':
        return <EditBasicSettings />;
      case 'security-settings':
        return <PrivacySettings onNavigateToSubPage={(page) => {
          if (page === '2fa') {
            setCurrentPage('2fa-settings');
          } else if (page === 'webauthn') {
            setCurrentPage('webauthn-settings');
          }
        }} />;
      case '2fa-settings':
        return <TwoFASettings />;
      case 'webauthn-settings':
        return <WebauthnManagement />;
      case 'wallet-settings':
        return <WalletSettings />;
      case 'notification-settings':
        return <NotificationPreferences />;
      case 'additional-settings':
        return <AdditionalSettings />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return renderDashboardContent();
    }
  };

  // Get current time for greeting
  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get crypto prices
  const { prices } = usePrices();

  // Render main dashboard content
  const renderDashboardContent = () => (
    <div style={{
      padding: window.innerWidth <= 768 ? '4px' : '20px',
      background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
      minHeight: '100vh',
      color: 'var(--text-primary)'
    }}>
      {/* 1. Greeting Section */}
      <section style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #f97316 0%, #eab308 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px'
          }}>
            {getCurrentTimeGreeting()}, {userData?.fullName?.split(' ')[0] || 'Trader'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: '0 auto',
            maxWidth: '600px',
            lineHeight: 1.5
          }}>
            Here's what's happening with your portfolio and the market today.
          </p>
        </div>
      </section>

      {/* 2. Platform Stats (Modern Cards) */}
      <section style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaChartLine style={{ color: '#f97316' }} /> Platform Overview
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: window.innerWidth <= 768 ? '6px' : '8px'
        }}>
          {companyStats.map((stat, index) => (
            <div key={index} style={{
              background: 'var(--card-bg)',
              padding: window.innerWidth <= 768 ? '10px' : '16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
              transition: 'transform 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: window.innerWidth <= 768 ? '40px' : '60px',
                height: window.innerWidth <= 768 ? '40px' : '60px',
                background: `${stat.color}10`,
                borderRadius: '50%',
                filter: 'blur(15px)'
              }} />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: window.innerWidth <= 768 ? '8px' : '12px'
              }}>
                <div style={{
                  padding: window.innerWidth <= 768 ? '6px' : '10px',
                  background: `${stat.color}15`,
                  borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
                  color: stat.color
                }}>
                  {React.cloneElement(stat.icon as React.ReactElement, {
                    size: window.innerWidth <= 768 ? 16 : 24
                  })}
                </div>
                <span style={{
                  fontSize: window.innerWidth <= 768 ? '9px' : '11px',
                  fontWeight: 600,
                  padding: window.innerWidth <= 768 ? '2px 6px' : '3px 8px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '20px',
                  color: 'var(--text-secondary)'
                }}>
                  Live
                </span>
              </div>

              <div style={{
                fontSize: window.innerWidth <= 768 ? '20px' : '28px',
                fontWeight: 800,
                marginBottom: '3px',
                color: 'var(--text-primary)'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: window.innerWidth <= 768 ? '11px' : '13px',
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Crypto Market Info (Live Prices) */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FaCoins style={{ color: '#eab308' }} /> Market Trends
          </h2>
          <button style={{
            background: 'none',
            border: 'none',
            color: '#f97316',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px'
          }} onClick={() => setCurrentPage('trading')}>
            View All <FaArrowRight size={12} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px'
        }}>
          {prices.slice(0, 6).map((coin) => (
            <div key={coin.symbol} style={{
              background: 'var(--card-bg)',
              borderRadius: '6px',
              padding: '12px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              boxShadow: '0 6px 18px rgba(2,6,23,0.06)'
            }} onClick={() => navigate(`/market/spot?coin=${coin.symbol}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`}
                  alt={coin.symbol}
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{coin.symbol}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {{
                      'BTC': 'Bitcoin',
                      'ETH': 'Ethereum',
                      'BNB': 'Binance Coin',
                      'ADA': 'Cardano',
                      'SOL': 'Solana',
                      'DOGE': 'Dogecoin',
                      'LINK': 'Chainlink',
                      'TRX': 'TRON',
                      'LTC': 'Litecoin'
                    }[coin.symbol] || coin.symbol}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>
                  ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: coin.change24h >= 0 ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '3px'
                }}>
                  {coin.change24h >= 0 ? <FaArrowUp size={9} /> : <FaChevronDown size={9} />}
                  {Math.abs(coin.change24h).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
          {prices.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Loading market data...
            </div>
          )}
        </div>
      </section>

      {/* 4. Achievements & Goals */}
      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaTrophy style={{ color: '#8b5cf6' }} /> Your Achievements
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px'
        }}>
          {/* Current Level */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            borderRadius: '6px',
            padding: '16px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '3px' }}>Current Level</div>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>Silver Trader</div>
                </div>
                <FaStar size={28} style={{ opacity: 0.8 }} />
              </div>

              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Progress to Gold</span>
                <span>75%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '75%', height: '100%', background: 'white', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Next Goal */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '6px',
            padding: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(2,6,23,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#ecfccb',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#84cc16'
              }}>
                <FaGift size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Next Reward</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Complete 5 more trades</div>
              </div>
            </div>
            <button style={{
              width: '100%',
              padding: '8px',
              background: 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
              fontSize: '13px'
            }}>
              View All Rewards
            </button>
          </div>
        </div>
      </section>
    </div>
  );


  // Render sidebar menu item recursively
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isActive = activeMenuItem === item.id;

    return (
      <React.Fragment key={item.id}>
        {/* Main menu item */}
        <button
          onClick={() => handleMenuItemClick(item)}
          style={{
            background: isActive
              ? 'var(--bg-hover)'
              : 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'background 0.2s',
            borderLeft: isActive
              ? '3px solid #f97316'
              : '3px solid transparent',
            width: '100%',
            marginLeft: level > 0 ? `${level * 16}px` : '0'
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* Folder/File icon and chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '32px' }}>
            {item.type === 'folder' ? (
              <>
                {isExpanded ?
                  <FaChevronDown size={12} style={{ color: 'var(--text)' }} /> :
                  <FaChevronRight size={12} style={{ color: 'var(--text)' }} />
                }
                {isExpanded ?
                  <FaFolderOpen size={16} style={{ color: 'var(--text)' }} /> :
                  <FaFolder size={16} style={{ color: 'var(--text)' }} />
                }
              </>
            ) : (
              <div style={{ width: '12px' }} /> // Spacer for files
            )}
            {item.type === 'file' && (
              <span style={{ color: 'var(--text)' }}>
                {item.icon}
              </span>
            )}
          </div>

          {/* Title */}
          {!isSidebarCollapsed && (
            <span style={{
              fontSize: '14px',
              fontWeight: item.type === 'folder' ? 600 : 500,
              color: 'var(--text)',
              whiteSpace: 'nowrap'
            }}>
              {item.title}
            </span>
          )}
        </button>

        {/* Children items (for expanded folders) */}
        {item.type === 'folder' && isExpanded && item.children && (
          <div style={{ marginLeft: '16px' }}>
            {item.children.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      {/* Header with Mobile Menu */}
      <div style={{
        background: 'var(--card-bg)',
        padding: '8px 0',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
        width: '100%',
        margin: '0',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 12px',
          width: '100%',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            minWidth: 0,
            flex: 1
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              flexShrink: 0
            }}>
              T
            </div>
            <span style={{
              fontWeight: 700,
              fontSize: 'clamp(14px, 3vw, 18px)',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0
            }}>
              TradeSpot
            </span>
          </div>

          {/* Mobile Hamburger Button */}
          {isMobile && isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '16px',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                width: '16px',
                height: '12px'
              }}>
                <div style={{
                  width: '16px',
                  height: '2px',
                  backgroundColor: 'currentColor',
                  borderRadius: '1px'
                }} />
                <div style={{
                  width: '16px',
                  height: '2px',
                  backgroundColor: 'currentColor',
                  borderRadius: '1px'
                }} />
                <div style={{
                  width: '16px',
                  height: '2px',
                  backgroundColor: 'currentColor',
                  borderRadius: '1px'
                }} />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        position: 'relative',
        flex: 1,
        width: '100%'
      }}>

        {/* Backdrop for mobile overlay */}
        {!isSidebarCollapsed && isMobile && (
          <div
            onClick={() => setIsSidebarCollapsed(true)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998
            }}
          />
        )}

        {/* Left Sidebar */}
        <div className="dashboard-sidebar" style={{
          background: 'var(--card-bg)',
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          position: isMobile ? 'fixed' : 'absolute',
          top: isMobile ? '0' : 'auto',
          left: '0',
          height: isMobile ? '100vh' : '100%',
          width: isSidebarCollapsed ? '60px' : '200px',
          transform: isMobile && isSidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'all 0.3s ease',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 999,
          boxShadow: !isSidebarCollapsed && isMobile ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        } as React.CSSProperties & { scrollbarWidth?: string; msOverflowStyle?: string }}>
          {/* Sidebar Header with Navigation title and Notification Bell */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingLeft: isSidebarCollapsed ? '0' : '8px',
            paddingRight: isSidebarCollapsed ? '0' : '8px'
          }}>
            {!isSidebarCollapsed && (
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: 0
              }}>
                Navigation
              </h2>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => {
                setCurrentPage('notifications');
                setActiveMenuItem(null);
                if (isMobile) {
                  setIsSidebarCollapsed(true);
                }
                // Refresh notification status when opening notifications
                setTimeout(() => checkForUnreadNotifications(), 1000);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '16px',
                transition: 'all 0.2s',
                position: 'relative',
                marginLeft: isSidebarCollapsed ? '0' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Notifications"
            >
              <FaBell size={16} />

              {/* Red Dot for New Notifications */}
              {hasNewNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid var(--card-bg)',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </button>
          </div>

          {/* Menu items */}
          {sidebarMenu.map((item) => renderMenuItem(item))}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              marginTop: 'auto',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              transition: 'all 0.2s',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '20px' }}>{isSidebarCollapsed ? '»' : '«'}</span>
            {!isSidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Right Content Area */}
        <div style={{
          background: 'var(--bg)',
          padding: '0',
          overflowY: 'auto',
          marginLeft: !isMobile ? (isSidebarCollapsed ? '60px' : '200px') : '0',
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 80px)',
          width: !isMobile ? `calc(100% - ${isSidebarCollapsed ? '60px' : '200px'})` : '100%'
        }}>
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
