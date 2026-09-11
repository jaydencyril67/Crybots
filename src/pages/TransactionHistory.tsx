import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatTradeSpotTime } from '../utils/tradeSpotTime';
import { useTheme } from '../ThemeContext';

const API = process.env.REACT_APP_API_BASE_URL;

interface Transaction {
  type: string;
  amount: number;
  currency: string;
  date: string;
  note?: string;
}

const TransactionHistory: React.FC = () => {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [amountRange, setAmountRange] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Helper function to determine if a transaction should be positive (credit) or negative (debit)
  const isCreditTransaction = (transaction: Transaction): boolean => {
    const creditTypes = [
      'Deposit', 'Credit', 'Transfer In', 'Withdrawal Refund',
      'Staking Payout', 'Copy Trading Stop', 'Copy Trading Withdraw'
    ];
    
    const debitTypes = [
      'Copy Trading Start', 'Copy Trading Add Funds'
    ];
    
    // Check if the transaction type matches any debit types (negative amounts)
    const isKnownDebit = debitTypes.some(type => transaction.type.includes(type));
    
    // Check if the transaction type matches any credit types
    const isKnownCredit = creditTypes.some(type => transaction.type.includes(type));
    
    // Additional check: if transaction has a note indicating admin sent funds, it's a credit
    const isAdminSent = transaction.note ? transaction.note.includes('Admin sent funds') : false;
    
    // For copy trading transactions, use the amount sign to determine credit/debit
    if (transaction.type.includes('Copy Trading')) {
      return transaction.amount > 0; // Positive amount = credit, negative amount = debit
    }
    
    return isKnownCredit || isAdminSent;
  };

  // Filter transactions based on current filter states
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type.toLowerCase().includes(selectedType.toLowerCase()));
    }

    // Filter by currency
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(t => t.currency === selectedCurrency);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        
        switch (dateRange) {
          case 'today':
            return transactionDay.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDay >= weekAgo;
          case 'month':
            return transactionDate.getMonth() === now.getMonth() && 
                   transactionDate.getFullYear() === now.getFullYear();
          case 'year':
            return transactionDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Filter by amount range
    if (amountRange !== 'all') {
      filtered = filtered.filter(t => {
        const amount = Math.abs(t.amount);
        switch (amountRange) {
          case 'small':
            return amount < 100;
          case 'medium':
            return amount >= 100 && amount < 1000;
          case 'large':
            return amount >= 1000;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedType, selectedCurrency, dateRange, amountRange, searchTerm]);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort transactions by date descending (newest first)
        const sortedTransactions = (res.data.transactions || []).sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sortedTransactions);
      } catch (e: any) {
        setError('Failed to load transactions.');
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        padding: window.innerWidth <= 768 ? '4px' : '20px',
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box'
    }}>

      {/* Error Message */}
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

      {/* Compact Filters Section */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <style>{`
            input::placeholder {
              color: var(--text-muted) !important;
            }
            select {
              color: var(--text) !important;
            }
            select option {
              color: var(--text) !important;
              background: var(--card-bg) !important;
            }
          `}</style>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 10px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              minWidth: '120px',
              flex: '1'
            }}
          />

          {/* Transaction Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '6px 8px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              minWidth: '100px'
            }}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="staking">Staking</option>
            <option value="rebate">Rebate</option>
            <option value="transfer">Transfer</option>
            <option value="copy trading">Copy Trading</option>
          </select>

          {/* Currency Filter */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            style={{
              padding: '6px 8px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              minWidth: '80px'
            }}
          >
            <option value="all">All</option>
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '6px 8px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              minWidth: '90px'
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Amount Range Filter */}
          <select
            value={amountRange}
            onChange={(e) => setAmountRange(e.target.value)}
            style={{
              padding: '6px 8px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              minWidth: '90px'
            }}
          >
            <option value="all">All Amounts</option>
            <option value="small">Under $100</option>
            <option value="medium">$100-$1K</option>
            <option value="large">Over $1K</option>
          </select>

        </div>
      </div>

      {/* Compact Grid Layout */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        
        {/* Transaction Summary Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: 'none',
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
            <span>📈</span>
            Transaction Summary
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Total Transactions
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                {loading ? <span className="loading-dots">...</span> : filteredTransactions.length}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                This Month
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                {loading ? <span className="loading-dots">...</span> : filteredTransactions.filter(t => {
                  const transactionDate = new Date(t.date);
                  const now = new Date();
                  return transactionDate.getMonth() === now.getMonth() && 
                         transactionDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </div>
          </div>
        </div>



      </div>

      {/* All Transactions List */}
      {loading ? (
        <div style={{ 
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '40px 16px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid transparent',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
            <span className="loading-dots">....</span>
          </div>
        </div>
      ) : !loading && filteredTransactions.length === 0 ? (
        <div style={{ 
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '40px 16px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid transparent',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
          <div style={{ 
            fontSize: '1rem', 
            color: 'var(--text)', 
            marginBottom: '8px',
            fontWeight: 600
          }}>
            No Transactions
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)' 
          }}>
            Your transaction history will appear here.
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'var(--card-bg)',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: 'none'
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
            <span>📄</span>
            All Transactions
          </h3>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            maxHeight: '500px',
            overflowY: 'auto',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            border: 'none'
          }}>
            {filteredTransactions.map((transaction, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 12px',
                background: 'var(--bg)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {transaction.type}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {formatTradeSpotTime(transaction.date)}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    color: isCreditTransaction(transaction) ? '#4CAF50' : 
                           transaction.type.includes('Convert') ? 'var(--text)' : '#f44336',
                    fontWeight: 600
                  }}>
                    {isCreditTransaction(transaction) ? '+' : 
                     transaction.type.includes('Convert') ? '' : '-'}
                    {transaction.amount} {transaction.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            
            /* Keep filters on same line on mobile */
            div[style*="display: flex"][style*="flexWrap: wrap"] {
              flex-wrap: nowrap !important;
              overflow-x: auto !important;
            }
            
            /* Filter button mobile styles */
            .filter-btn {
              padding: 6px 12px !important;
              font-size: 0.75rem !important;
              min-width: 60px !important;
              border-radius: 6px !important;
              min-height: 32px !important;
              flex-shrink: 0 !important;
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
            
            /* Filter button small mobile styles */
            .filter-btn {
              padding: 5px 10px !important;
              font-size: 0.7rem !important;
              min-width: 50px !important;
              border-radius: 5px !important;
              min-height: 30px !important;
              flex-shrink: 0 !important;
            }
          }
        `}
      </style>
    </div>
    </>
  );
};

export default TransactionHistory;