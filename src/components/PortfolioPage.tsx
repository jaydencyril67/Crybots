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
  body: {
    minHeight: '60vh',
  },
};

const PortfolioPage = () => {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <AppHeader />
        <div style={styles.body} />
      </div>
      <NowBar />
    </div>
  );
};

export default PortfolioPage;
