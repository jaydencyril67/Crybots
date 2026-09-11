import React, { useState } from 'react';
import './AdminDashboard.css';
import { useNavigate } from 'react-router-dom';

const adminButtons = [
  { label: 'USERS', icon: '👤', route: '/au' },
  { label: 'CASHOUT', icon: '💸', route: '/aw' },
  { label: 'NOTICE', icon: '📢', route: '/an' },
  { label: 'RECENTS', icon: '🕒', route: '/ar' },
  { label: 'SEND FUNDS', icon: '🏧', route: '/asf' },
  { label: 'TRASH', icon: '🗑️', route: '/atr' },
  { label: 'MESSAGE', icon: '✉️', route: '/ac' },
  { label: 'FLEXDROP', icon: '🎁', route: '/afd' },
  { label: 'STATISTICS', icon: '📊', route: '/aps' },
  { label: 'LOGOUT', icon: '🚪', route: 'logout', danger: true },
];

const userDetails = [
  { key: 'email', label: 'Email' },
  { key: 'usdt', label: 'USDT Balance' },
  { key: 'username', label: 'Username' },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<{ key: string, label: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showDetailsList, setShowDetailsList] = useState(false);

  const handleEditDetail = (detail: { key: string, label: string }) => {
    setEditingDetail(detail);
    setInputValue('');
    setShowDetailsList(false);
    setModalOpen(true);
  };

  const handleSave = () => {
    // Save logic here
    setModalOpen(false);
    setEditingDetail(null);
  };
  const openUserModal = () => {
    setShowDetailsList(true);
    setEditingDetail(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDetail(null);
    setShowDetailsList(false);
  };

  const handleButtonClick = (button: typeof adminButtons[0]) => {
    if (button.route === 'logout') {
      localStorage.removeItem('adminToken');
      navigate('/al');
    } else if (button.route) {
      navigate(button.route);
    }
  };

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
      </header>
      <main className="admin-dashboard-main">
        <div className="admin-dashboard-cards">
          {adminButtons.map(btn => (
            <button
              className={`admin-dashboard-card ${btn.danger ? 'admin-dashboard-card--danger' : ''}`}
              key={btn.label}
              onClick={() => handleButtonClick(btn)}
              type="button"
            >
              <span className="admin-dashboard-card-icon" aria-hidden="true">{btn.icon}</span>
              <span className="admin-dashboard-card-label">{btn.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Modal for editing user details */}
      {modalOpen && (
        <div className="admin-dashboard-modal-overlay" onClick={closeModal}>
          <div className="admin-dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
            {showDetailsList && !editingDetail && (
              <>
                <h2 className="admin-dashboard-modal-title">
                  Edit User Detail
                </h2>
                <ul className="admin-dashboard-modal-list">
                  {userDetails.map(detail => (
                    <li key={detail.key} className="admin-dashboard-modal-list-item">
                      <button
                        className="admin-dashboard-modal-button"
                        onClick={() => handleEditDetail(detail)}
                      >
                        {detail.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="admin-dashboard-modal-button-group">
                  <button
                    onClick={closeModal}
                    className="admin-dashboard-modal-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {editingDetail && (
              <>
                <h2 className="admin-dashboard-modal-title">
                  Edit {editingDetail.label}
                </h2>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={`Enter new ${editingDetail.label.toLowerCase()}`}
                  className="admin-dashboard-modal-input"
                />
                <div className="admin-dashboard-modal-button-group">
                  <button
                    onClick={closeModal}
                    className="admin-dashboard-modal-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="admin-dashboard-modal-button-primary"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
