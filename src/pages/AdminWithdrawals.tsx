import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';

const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Only keep withdrawals with status 'pending'
      setWithdrawals((res.data.withdrawals || []).filter((w: any) => !w.status || w.status === 'pending'));
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to fetch withdrawals');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  // Sort withdrawals so newest are at the top (by createdAt or _id)
  const sortedWithdrawals = [...withdrawals].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return (b._id > a._id ? 1 : -1);
  });

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve this withdrawal? This action cannot be undone.'
      : 'Are you sure you want to reject this withdrawal? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) return;
    
    setActionLoading(id + action);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/api/admin/withdrawals/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchWithdrawals();
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Action failed');
    }
    setActionLoading(null);
  };

  const handleCopyWallet = async (wallet: string, id: string) => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // fallback: do nothing
    }
  };

  const filteredWithdrawals = sortedWithdrawals.filter(w =>
    (!w.status || w.status === 'pending') && (
      (w.userId?.spotid || '').toLowerCase().includes(search.toLowerCase()) ||
      (w.wallet || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="admin-withdrawals-container">
      <div className="withdrawals-header">
        <div className="withdrawals-header-content">
          <div className="header-top">
            <h1>💸 Withdrawal Management</h1>
            <span className="badge pending-count">{filteredWithdrawals.length}</span>
          </div>
          <p className="header-subtitle">Review and process pending withdrawal requests</p>
        </div>
      </div>

      <div className="withdrawals-content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Spot ID or wallet address..."
            className="search-input"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading withdrawals...</p>
          </div>
        )}

        {/* Error State */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Empty State */}
        {!loading && filteredWithdrawals.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No pending withdrawals</p>
            <span>All withdrawal requests have been processed</span>
          </div>
        )}

        {/* Withdrawals Grid */}
        {!loading && filteredWithdrawals.length > 0 && (
          <div className="withdrawals-grid">
            {filteredWithdrawals.map((w) => (
              <div key={w._id} className="withdrawal-card">
                <div className="card-top">
                  <div className="card-status pending">
                    <span className="status-icon">⏳</span>
                    Pending
                  </div>
                  <div className="card-amount">
                    ${w.amount} <span className="currency">USDT</span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">👤 Spot ID</span>
                      <span className="info-value">{w.userId?.spotid || 'N/A'}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">📅 Requested</span>
                      <span className="info-value">
                        {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="info-item wallet-item">
                    <span className="info-label">💼 Wallet Address</span>
                    <div className="wallet-address-group">
                      <code className="wallet-address">{w.wallet}</code>
                      <button
                        onClick={() => handleCopyWallet(w.wallet, w._id)}
                        className="btn-copy"
                        title="Copy wallet address"
                      >
                        {copiedId === w._id ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-approve"
                    disabled={!!actionLoading}
                    onClick={() => handleAction(w._id, 'approve')}
                  >
                    {actionLoading === w._id + 'approve' ? (
                      <>⏳ Approving...</>
                    ) : (
                      <>✓ Approve</>
                    )}
                  </button>
                  <button
                    className="btn-reject"
                    disabled={!!actionLoading}
                    onClick={() => handleAction(w._id, 'reject')}
                  >
                    {actionLoading === w._id + 'reject' ? (
                      <>⏳ Rejecting...</>
                    ) : (
                      <>✗ Reject</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .admin-withdrawals-container {
          min-height: 100vh;
          background: var(--bg, #f3f7fd);
          padding-bottom: 1rem;
        }

        .withdrawals-header {
          background: var(--card-bg, #ffffff);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
        }

        .withdrawals-header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.125rem;
        }

        .withdrawals-header h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text, #0d1b3d);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .badge {
          background: var(--primary, #0d1b3d);
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .pending-count {
          background: var(--warning-color, #f1c40f);
          color: #333;
        }

        .header-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted, #888);
          margin: 0;
        }

        .withdrawals-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .search-container {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: var(--text-muted, #888);
        }

        .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.5rem;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 6px;
          font-size: 0.8125rem;
          transition: all 0.2s ease;
          background: var(--card-bg, #ffffff);
          color: var(--text, #0d1b3d);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary, #0d1b3d);
          box-shadow: 0 0 0 3px rgba(13, 27, 61, 0.1);
        }

        .loading-state {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--bg, #f3f7fd);
          border-top-color: var(--primary, #0d1b3d);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .alert {
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          margin-bottom: 0.75rem;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .empty-state {
          padding: 2rem 1rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.375rem;
        }

        .empty-state p {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text, #0d1b3d);
          margin: 0 0 0.125rem 0;
        }

        .empty-state span {
          font-size: 0.8125rem;
          color: var(--text-muted, #888);
        }

        .withdrawals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 0.75rem;
        }

        .withdrawal-card {
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.08));
          overflow: hidden;
        }

        .card-top {
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(241, 196, 15, 0.1), rgba(243, 156, 18, 0.05));
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-status {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-status.pending {
          background: rgba(241, 196, 15, 0.15);
          color: #856404;
        }

        .card-amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text, #0d1b3d);
        }

        .currency {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted, #888);
        }

        .card-body {
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-row {
          display: flex;
          flex-direction: row;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          flex: 1;
          min-width: 0;
        }

        .info-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted, #888);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text, #0d1b3d);
        }

        .wallet-item {
          padding: 0.625rem;
          background: var(--bg, #f3f7fd);
          border-radius: 6px;
        }

        .wallet-address-group {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .wallet-address {
          flex: 1;
          font-size: 0.6875rem;
          font-family: 'Courier New', monospace;
          word-break: break-all;
          color: var(--text, #0d1b3d);
          background: transparent;
          padding: 0;
          border: none;
        }

        .btn-copy {
          padding: 0.375rem;
          background: transparent;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          flex-shrink: 0;
        }

        .card-actions {
          padding: 0.75rem 1rem;
          background: var(--bg, #f3f7fd);
          border-top: 1px solid var(--border-color, #e0e0e0);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .btn-approve,
        .btn-reject {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
        }

        .btn-approve {
          background: var(--success-color, #27ae60);
          color: white;
        }

        .btn-reject {
          background: var(--error-color, #e74c3c);
          color: white;
        }

        .btn-approve:disabled,
        .btn-reject:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 767px) {
          .withdrawals-header {
            padding: 0.5rem;
          }

          .withdrawals-header h1 {
            font-size: 1.125rem;
          }

          .withdrawals-content {
            padding: 0 0.5rem;
          }

          .withdrawals-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .card-top {
            padding: 0.625rem 0.75rem;
          }

          .card-body {
            padding: 0.625rem 0.75rem;
          }

          .info-row {
            gap: 0.75rem;
          }

          .card-actions {
            padding: 0.625rem 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .card-amount {
            font-size: 1.125rem;
          }

          .wallet-address {
            font-size: 0.625rem;
          }
        }

        /* Tablet */
        @media (min-width: 768px) and (max-width: 1024px) {
          .withdrawals-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Dark theme adjustments */
        body[data-theme='dark'] .card-top {
          background: rgba(241, 196, 15, 0.05);
        }

        body[data-theme='dark'] .wallet-item {
          background: rgba(255,255,255,0.03);
        }

        body[data-theme='dark'] .card-actions {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
};

export default AdminWithdrawals;
