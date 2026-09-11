import React, { useState } from 'react';
import axios from 'axios';
import '../theme.css';

const API = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';

const AdminSendFunds: React.FC = () => {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API}/api/admin/send-funds`,
        { email, amount, currency, tag },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Successfully sent ${amount} ${currency} to ${email}`);
      setEmail('');
      setAmount('');
      setCurrency('USDT');
      setTag('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Failed to send funds');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .admin-send-funds {
          min-height: 100vh;
          background: var(--bg);
          padding: 1rem;
          box-sizing: border-box;
        }
        .admin-send-funds-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--card-bg);
          padding: 0.875rem 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .admin-send-funds-header h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: 0.5px;
        }
        .admin-send-funds-container {
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          background: var(--card-bg);
          border-radius: 12px;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .admin-send-funds-form {
          padding: 1.25rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .form-row.two-columns {
          grid-template-columns: 1fr 1fr;
        }
        .form-group {
          margin-bottom: 0;
        }
        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 0.5rem;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.9375rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--card-bg);
          color: var(--text);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(13, 27, 61, 0.1);
        }
        .form-group input::placeholder {
          color: var(--text-secondary);
        }
        .currency-amount-row {
          display: grid;
          grid-template-columns: 1fr 140px;
          gap: 0.75rem;
        }
        .form-group-full {
          margin-bottom: 1rem;
        }
        .message {
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          line-height: 1.4;
        }
        .message-error {
          background: rgba(231, 76, 60, 0.1);
          color: var(--error-color);
          border: 1px solid rgba(231, 76, 60, 0.2);
        }
        .message-success {
          background: rgba(39, 174, 96, 0.1);
          color: var(--success-color);
          border: 1px solid rgba(39, 174, 96, 0.2);
        }
        .submit-button {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--button-text);
          background: var(--primary);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: all 0.2s ease;
        }
        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13, 27, 61, 0.2);
        }
        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .tag-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .tag-chip {
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
          background: var(--bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          cursor: pointer;
          color: var(--text);
          transition: all 0.2s ease;
        }
        .tag-chip:hover {
          background: var(--primary);
          color: var(--button-text);
          border-color: var(--primary);
          transform: translateY(-1px);
        }
        
        /* Desktop - 1024px and up */
        @media (min-width: 1024px) {
          .admin-send-funds {
            padding: 1rem;
          }
          .admin-send-funds-container {
            max-width: 420px;
          }
          .admin-send-funds-header {
            padding: 0.875rem 1rem;
          }
          .admin-send-funds-header h2 {
            font-size: 1.125rem;
          }
          .admin-send-funds-form {
            padding: 1.5rem;
          }
          .form-row {
            gap: 0.875rem;
            margin-bottom: 0.875rem;
          }
          .form-group-full {
            margin-bottom: 0.875rem;
          }
          .form-group label {
            font-size: 0.8125rem;
            margin-bottom: 0.4375rem;
          }
          .form-group input,
          .form-group select {
            padding: 0.6875rem 0.875rem;
            font-size: 0.875rem;
          }
          .message {
            padding: 0.75rem 0.875rem;
            font-size: 0.8125rem;
            margin-bottom: 0.875rem;
          }
          .submit-button {
            padding: 0.8125rem;
            font-size: 0.9375rem;
          }
        }
        
        /* Tablet - 768px to 1023px */
        @media (min-width: 768px) and (max-width: 1023px) {
          .admin-send-funds-container {
            max-width: 480px;
          }
          .admin-send-funds-form {
            padding: 1.5rem;
          }
        }
        
        /* Mobile - 767px and below */
        @media (max-width: 767px) {
          .admin-send-funds {
            padding: 0.75rem;
          }
          .admin-send-funds-header {
            padding: 0.75rem 0.875rem;
            margin-bottom: 0.75rem;
          }
          .admin-send-funds-header h2 {
            font-size: 1rem;
          }
          .admin-send-funds-container {
            border-radius: 10px;
          }
          .admin-send-funds-form {
            padding: 1.25rem;
          }
          .form-row {
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .form-row.two-columns {
            grid-template-columns: 1fr 1fr;
          }
          .form-group label {
            font-size: 0.8125rem;
            margin-bottom: 0.375rem;
          }
          .form-group input,
          .form-group select {
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
          }
          .currency-amount-row {
            grid-template-columns: 1fr 120px;
            gap: 0.625rem;
          }
          .form-group-full {
            margin-bottom: 0.75rem;
          }
          .message {
            padding: 0.75rem;
            font-size: 0.8125rem;
            margin-bottom: 0.75rem;
          }
          .submit-button {
            padding: 0.8125rem;
            font-size: 0.9375rem;
          }
          .tag-chip {
            padding: 0.4375rem 0.75rem;
            font-size: 0.75rem;
          }
        }
        
        /* Small Mobile - 480px and below */
        @media (max-width: 480px) {
          .admin-send-funds {
            padding: 0.5rem;
          }
          .admin-send-funds-header {
            padding: 0.625rem 0.75rem;
            margin-bottom: 0.625rem;
            border-radius: 10px;
          }
          .admin-send-funds-header h2 {
            font-size: 0.9375rem;
          }
          .admin-send-funds-container {
            border-radius: 8px;
          }
          .admin-send-funds-form {
            padding: 1rem;
          }
          .form-row {
            gap: 0.625rem;
            margin-bottom: 0.625rem;
          }
          .form-row.two-columns {
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          .form-group label {
            font-size: 0.75rem;
            margin-bottom: 0.3125rem;
          }
          .form-group input,
          .form-group select {
            padding: 0.5625rem 0.625rem;
            font-size: 0.8125rem;
          }
          .currency-amount-row {
            grid-template-columns: 1fr 100px;
            gap: 0.5rem;
          }
          .form-group-full {
            margin-bottom: 0.625rem;
          }
          .message {
            padding: 0.625rem 0.75rem;
            font-size: 0.75rem;
            margin-bottom: 0.625rem;
          }
          .submit-button {
            padding: 0.75rem;
            font-size: 0.875rem;
          }
          .tag-chip {
            padding: 0.375rem 0.625rem;
            font-size: 0.6875rem;
          }
        }
        
        /* Extra Small Mobile - 360px and below */
        @media (max-width: 360px) {
          .admin-send-funds-form {
            padding: 0.875rem;
          }
          .form-row.two-columns {
            gap: 0.4375rem;
          }
          .currency-amount-row {
            grid-template-columns: 1fr 90px;
            gap: 0.4375rem;
          }
          .form-group input,
          .form-group select {
            padding: 0.5rem 0.5625rem;
            font-size: 0.75rem;
          }
          .form-group label {
            font-size: 0.6875rem;
          }
        }
      `}</style>
      <div className="admin-send-funds">
        <div className="admin-send-funds-header">
          <h2>💰 Send Funds</h2>
        </div>
        <div className="admin-send-funds-container">
          <form className="admin-send-funds-form" onSubmit={handleSubmit}>
            <div className="form-group-full">
              <label htmlFor="email">Recipient Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value.trim())}
                placeholder="user@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-row two-columns">
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  min={0.01}
                  step={0.01}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  disabled={loading}
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
            </div>

            <div className="form-group-full">
              <label htmlFor="tag">Transaction Tag</label>
              <input
                id="tag"
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                placeholder="e.g., bonus, refund, adjustment"
                required
                disabled={loading}
              />
              <div className="tag-suggestions">
                {['bonus', 'refund', 'adjustment', 'reward', 'compensation'].map((suggestion) => (
                  <span
                    key={suggestion}
                    className="tag-chip"
                    onClick={() => !loading && setTag(suggestion)}
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div className="message message-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="message message-success">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? '⏳ Sending...' : '🚀 Send Funds'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminSendFunds;