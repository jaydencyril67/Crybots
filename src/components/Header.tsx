import React from 'react';
import { useTheme } from '../ThemeContext';

const Header: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'var(--card-bg)',
      padding: '8px 0',
      backdropFilter: 'blur(10px)',
      boxShadow: 'var(--card-shadow)',
      width: '100%',
      margin: '0',
      boxSizing: 'border-box',
      zIndex: 1000
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
            background: 'linear-gradient(135deg, #25324B, #2a5298)',
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
      </div>
    </div>
  );
};

export default Header;
