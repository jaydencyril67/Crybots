import React from 'react';
import AppHeader from './AppHeader';
import NowBar from './NowBar';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    paddingBottom: '132px',
  },
  shell: {
    width: '100%',
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px) 40px',
    boxSizing: 'border-box' as const,
  },
  content: {
    paddingTop: '8px',
  },
  buttonList: {
    display: 'grid',
    gap: '12px',
    marginTop: '18px',
  },
  pageButton: {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: 700,
    textAlign: 'left' as const,
    cursor: 'pointer',
  },
};

const pageButtons = ['Details', 'Statistics', 'Security', 'Danger'];

const PortfolioPage = () => {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.content}>
          <div style={styles.buttonList}>
            {pageButtons.map((label) => (
              <button key={label} type="button" style={styles.pageButton}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <NowBar />
    </div>
  );
};

export default PortfolioPage;
