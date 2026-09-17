import React from 'react';
import AppHeader from './AppHeader';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import NowBar from './NowBar';
import { navigate } from '../utils/navigate';

const styles = {
  page: {
    minHeight: '100vh',
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
};

const getButtonStyle = (label: string, mode: 'light' | 'dark') => {
  const theme = HYBRID_THEME_TOKENS[mode];
  const isDanger = label === 'Danger';

  return {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '16px',
    border: `1px solid ${isDanger ? theme.danger : theme.border}`,
    background: isDanger ? theme.primarySoft : theme.surface,
    color: isDanger ? theme.danger : theme.text,
    fontSize: '1rem',
    fontWeight: 700,
    textAlign: 'left' as const,
    cursor: 'pointer',
  };
};

const pageButtons = ['Details', 'Statistics', 'Security', 'Danger'];

const PortfolioPage = () => {
  const handleButtonClick = (label: string) => {
    if (label === 'Details') {
      navigate('/profile');
    }
    if (label === 'Danger') {
      navigate('/danger');
    }
  };

  return (
    <HybridTheme mode="dark">
      <div style={styles.page}>
        <div style={styles.shell}>
          <AppHeader />
          <div style={styles.content}>
            <div style={styles.buttonList}>
              {pageButtons.map((label) => (
                <button key={label} type="button" style={getButtonStyle(label, 'dark')} onClick={() => handleButtonClick(label)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <NowBar />
      </div>
    </HybridTheme>
  );
};

export default PortfolioPage;
