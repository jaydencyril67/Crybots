import React from 'react';
import AppHeader from './AppHeader';
import HybridTheme from './HybridTheme';
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
    display: 'grid',
    gap: '18px',
    marginTop: '18px',
  },
  section: {
    display: 'grid',
    gap: '10px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  sectionText: {
    margin: 0,
    fontSize: '0.92rem',
    color: '#a3a3a3',
    lineHeight: 1.7,
    maxWidth: '62ch',
  },
  buttonList: {
    display: 'grid',
    gap: '10px',
    marginTop: '6px',
  },
  card: {
    display: 'grid',
    gap: '6px',
    width: '100%',
    padding: '16px 18px',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    textAlign: 'left' as const,
    boxSizing: 'border-box' as const,
  },
  cardSubtext: {
    margin: 0,
    fontSize: '0.86rem',
    color: '#b3b3b3',
    lineHeight: 1.6,
  },
};

const getCardStyle = () => styles.card;

const pageButtons = ['Details', 'Statistics', 'Security', 'Danger'];

const PortfolioPage = () => {
  const handleButtonClick = (label: string) => {
    if (label === 'Details') {
      navigate('/profile');
    }
    if (label === 'Security') {
      navigate('/security');
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
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Portfolio</h2>
              <p style={styles.sectionText}>Select a section below. These are page actions for now, not navigation tabs.</p>
            </section>

            <div style={styles.buttonList}>
              {pageButtons.map((label) => (
                <section key={label} style={getCardStyle()}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{label}</h3>
                  {label === 'Danger' ? <p style={styles.cardSubtext}>Account recovery and irreversible actions.</p> : null}
                </section>
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
