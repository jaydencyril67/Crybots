import React, { useEffect, useState } from 'react';
import axios from 'axios';
// --- Use same API base URL logic as AdminChat.tsx ---
const API = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';

interface User {
  _id: string;
  fullName: string;
  email: string;
  spotid: string;
  trc20Wallet?: string;
  usdtBalance: number;
  btcBalance: number;
  validMember: boolean;
  banned: boolean;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken'); // Use adminToken
        if (!token) throw new Error('Not authenticated');
        const res = await axios.get(`${API}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || e.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      const updateData = {
        fullName: selectedUser.fullName,
        email: selectedUser.email,
        spotid: selectedUser.spotid,
        trc20Wallet: selectedUser.trc20Wallet,
  // trxWallet removed
        usdtBalance: selectedUser.usdtBalance,
        btcBalance: selectedUser.btcBalance
      };
      // Call backend API to update user details
      await axios.put(
        `${API}/api/admin/users/${selectedUser._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Update users list in UI
      setUsers(users.map(u => u._id === selectedUser._id ? selectedUser : u));
      setModalOpen(false);
      setSelectedUser(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      await axios.delete(`${API}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter(u => u._id !== userId));
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle valid member status
  const handleToggleValidMember = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      await axios.post(
        `${API}/api/admin/users/${userId}/toggle-valid-member`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refetch users to ensure up-to-date validMember status
      const res = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
      // Update selectedUser if open
      if (selectedUser) {
        const updated = res.data.users.find((u: User) => u._id === selectedUser._id);
        if (updated) setSelectedUser(updated);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to toggle valid member.');
    } finally {
      setLoading(false);
    }
  };

  // Restrict (ban/unban) user
  const handleRestrictUser = async (user: User) => {
    setBanLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      await axios.post(
        `${API}/api/auth/admin/ban`,
        { email: user.email, ban: !user.banned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update user banned status in UI
      setUsers(users.map(u => u._id === user._id ? { ...u, banned: !user.banned } : u));
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser({ ...selectedUser, banned: !user.banned });
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to restrict user.');
    } finally {
      setBanLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (user.spotid || '').toLowerCase().includes(search.toLowerCase()) ||
    (user.trc20Wallet || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        padding: isMobile ? '8px 12px' : '8px 16px',
        border: '1.5px solid #232b36',
        borderTop: 0,
        borderLeft: 0,
        borderRight: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 700, color: '#232b36', letterSpacing: 1, fontFamily: 'serif' }}>
          USERS MANAGEMENT
        </span>
        {!isMobile && (
          <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div style={{ 
        padding: isMobile ? '12px' : '16px 20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, spot ID, or wallet..."
            style={{ 
              width: '100%', 
              padding: isMobile ? '8px 12px' : '10px 16px', 
              fontSize: isMobile ? 14 : 15, 
              border: '1px solid #e3e6ef', 
              borderRadius: 0, 
              boxSizing: 'border-box',
              background: '#fff'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: isMobile ? '8px' : '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#999',
                padding: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '6px' : '12px',
          marginBottom: '16px'
        }}>
          <div style={{ background: '#f6f9fe', padding: isMobile ? '6px 8px' : '10px 14px', border: '1px solid #e3e6ef' }}>
            <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: '#666', marginBottom: isMobile ? '2px' : '4px' }}>Total Users</div>
            <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#1e3c72' }}>{users.length}</div>
          </div>
          <div style={{ background: '#f6f9fe', padding: isMobile ? '6px 8px' : '10px 14px', border: '1px solid #e3e6ef' }}>
            <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: '#666', marginBottom: isMobile ? '2px' : '4px' }}>Banned</div>
            <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#e74c3c' }}>{users.filter(u => u.banned).length}</div>
          </div>
          <div style={{ background: '#f6f9fe', padding: isMobile ? '6px 8px' : '10px 14px', border: '1px solid #e3e6ef' }}>
            <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: '#666', marginBottom: isMobile ? '2px' : '4px' }}>Valid Members</div>
            <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#27ae60' }}>{users.filter(u => u.validMember).length}</div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '12px',
            marginTop: '12px'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: '#fff',
                border: '1px solid #e3e6ef',
                padding: '16px',
                height: '120px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #e74c3c', 
            padding: '12px 16px', 
            color: '#e74c3c', 
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* Users Grid */}
        {!loading && filteredUsers.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '12px'
          }}>
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                style={{
                  background: '#fff',
                  borderRadius: 0,
                  boxShadow: '0 2px 8px 0 rgba(30,60,114,0.15), 0 1px 4px 0 rgba(30,60,114,0.10)',
                  border: '1px solid #e3e6ef',
                  padding: isMobile ? '12px' : '16px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Status Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {user.banned && (
                    <span style={{
                      background: '#fee',
                      color: '#e74c3c',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}>
                      BANNED
                    </span>
                  )}
                  {user.validMember && (
                    <span style={{
                      background: '#efe',
                      color: '#27ae60',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}>
                      VALID
                    </span>
                  )}
                  {!user.banned && !user.validMember && (
                    <span style={{
                      background: '#f6f9fe',
                      color: '#666',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div>
                  <div style={{ 
                    fontSize: isMobile ? '0.9rem' : '0.95rem', 
                    color: '#1e3c72', 
                    fontWeight: 600, 
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.fullName || 'No Name'}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.8rem' : '0.85rem', 
                    color: '#666', 
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.email}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#999',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>Spot ID: {user.spotid || 'N/A'}</span>
                    <span>•</span>
                    <span>Joined: {formatDate(user.createdAt)}</span>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={async () => {
                    setSelectedUser({
                      _id: user._id,
                      fullName: user.fullName,
                      email: user.email,
                      spotid: user.spotid,
                      trc20Wallet: user.trc20Wallet || '',
                      usdtBalance: user.usdtBalance,
                      btcBalance: user.btcBalance,
                      validMember: user.validMember,
                      banned: user.banned,
                      createdAt: user.createdAt
                    });
                    setModalOpen(true);
                    try {
                      const token = localStorage.getItem('adminToken');
                      if (!token) throw new Error('Not authenticated');
                      const res = await axios.get(`${API}/api/validate-user-valid-member/${user._id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (res.data && typeof res.data.validMember === 'boolean') {
                        setSelectedUser(prev => prev ? { ...prev, validMember: res.data.validMember } : prev);
                      }
                    } catch (e) {
                      // Optionally handle error
                    }
                  }}
                  style={{
                    background: '#1e3c72',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 0,
                    padding: isMobile ? '8px' : '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    width: '100%',
                    marginTop: 'auto'
                  }}
                >
                  Edit User
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#999'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>No users found</div>
            <div style={{ fontSize: '14px', color: '#bbb' }}>
              {search ? 'Try adjusting your search criteria' : 'No users available'}
            </div>
          </div>
        )}
      </div>
      {/* User Details Modal */}
      {modalOpen && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '16px' : '24px',
            overflowY: 'auto'
          }}
          onClick={() => { setModalOpen(false); setSelectedUser(null); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 0,
              boxShadow: '0 12px 40px 0 rgba(30,60,114,0.38), 0 4px 16px 0 rgba(30,60,114,0.22)',
              border: '1px solid #e3e6ef',
              padding: isMobile ? '16px 12px' : '20px',
              minWidth: isMobile ? '100%' : 320,
              maxWidth: isMobile ? '100%' : 600,
              width: '100%',
              fontFamily: 'inherit',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e3e6ef'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: isMobile ? 16 : 18, 
                color: '#232b36', 
                fontWeight: 700, 
                letterSpacing: 1 
              }}>
                Edit User Details
              </h2>
              <button
                onClick={() => { setModalOpen(false); setSelectedUser(null); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{ 
                color: '#e74c3c', 
                marginBottom: 16, 
                fontSize: 14, 
                padding: '10px 12px',
                background: '#fee',
                border: '1px solid #e74c3c'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveUserEdit}>
              {/* User Status */}
              <div style={{ 
                marginBottom: 16,
                padding: '10px',
                background: '#f6f9fe',
                border: '1px solid #e3e6ef',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>Status:</span>
                  <span style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: selectedUser.banned ? '#fee' : selectedUser.validMember ? '#efe' : '#f6f9fe',
                    color: selectedUser.banned ? '#e74c3c' : selectedUser.validMember ? '#27ae60' : '#666'
                  }}>
                    {selectedUser.banned ? 'BANNED' : selectedUser.validMember ? 'VALID MEMBER' : 'ACTIVE'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  Joined: {formatDate(selectedUser.createdAt)}
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#232b36' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={selectedUser.fullName}
                    onChange={e => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: isMobile ? '8px 10px' : '10px', 
                      borderRadius: 0, 
                      border: '1px solid #ccc', 
                      fontSize: 14, 
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#232b36' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: isMobile ? '8px 10px' : '10px', 
                      borderRadius: 0, 
                      border: '1px solid #ccc', 
                      fontSize: 14, 
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#232b36' }}>
                    Spot ID
                  </label>
                  <input
                    type="text"
                    value={selectedUser.spotid}
                    onChange={e => setSelectedUser({ ...selectedUser, spotid: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: isMobile ? '8px 10px' : '10px', 
                      borderRadius: 0, 
                      border: '1px solid #ccc', 
                      fontSize: 14, 
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#232b36' }}>
                    TRC20 Wallet
                  </label>
                  <input
                    type="text"
                    value={selectedUser.trc20Wallet || ''}
                    onChange={e => setSelectedUser({ ...selectedUser, trc20Wallet: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: isMobile ? '8px 10px' : '10px', 
                      borderRadius: 0, 
                      border: '1px solid #ccc', 
                      fontSize: 14, 
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#232b36' }}>
                    Balances
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '12px' 
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666', fontWeight: 500 }}>
                        USDT
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedUser.usdtBalance}
                        onChange={e => setSelectedUser({ ...selectedUser, usdtBalance: parseFloat(e.target.value) || 0 })}
                        style={{ 
                          width: '100%', 
                          padding: isMobile ? '8px 10px' : '10px', 
                          borderRadius: 0, 
                          border: '1px solid #ccc', 
                          fontSize: 14, 
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#666', fontWeight: 500 }}>
                        BTC
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        value={selectedUser.btcBalance}
                        onChange={e => setSelectedUser({ ...selectedUser, btcBalance: parseFloat(e.target.value) || 0 })}
                        style={{ 
                          width: '100%', 
                          padding: isMobile ? '8px 10px' : '10px', 
                          borderRadius: 0, 
                          border: '1px solid #ccc', 
                          fontSize: 14, 
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                  gap: '8px',
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e3e6ef'
                }}>
                  <button
                    type="button"
                    onClick={() => handleToggleValidMember(selectedUser._id)}
                    style={{
                      padding: isMobile ? '10px 8px' : '10px 16px',
                      background: selectedUser.validMember ? '#e74c3c' : '#27ae60',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      gridColumn: isMobile ? '1 / -1' : 'span 1'
                    }}
                    disabled={loading}
                  >
                    {selectedUser.validMember ? 'Revoke Valid' : 'Make Valid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestrictUser(selectedUser)}
                    style={{
                      padding: isMobile ? '10px 8px' : '10px 16px',
                      background: selectedUser.banned ? '#27ae60' : '#e67e22',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      gridColumn: isMobile ? '1 / -1' : 'span 1'
                    }}
                    disabled={banLoading}
                  >
                    {banLoading ? '...' : (selectedUser.banned ? 'Unrestrict' : 'Restrict')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUser._id)}
                    style={{
                      padding: isMobile ? '10px 8px' : '10px 16px',
                      background: '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      gridColumn: isMobile ? 'span 1' : 'span 1'
                    }}
                    disabled={loading}
                  >
                    Delete
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: isMobile ? '10px 8px' : '10px 16px',
                      background: '#1e3c72',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      gridColumn: isMobile ? 'span 1' : 'span 1'
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setModalOpen(false); setSelectedUser(null); }}
                    style={{
                      padding: isMobile ? '10px 8px' : '10px 16px',
                      background: '#eee',
                      color: '#232b36',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      gridColumn: isMobile ? '1 / -1' : 'span 4',
                      marginTop: isMobile ? '0' : '0'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default AdminUsers;
