import React, { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';

const AdminHomePage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  useEffect(() => { if (!isAdminToken(localStorage.getItem('token'))) navigate('/signin'); }, []);
  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}>
    <div style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 132 }}>
      <div style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px) clamp(10px, 2vw, 18px) 28px', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
          <section style={{ display: 'grid', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900 }}>Admin Home</h2>
            <p style={{ margin: 0, fontSize: '0.92rem', color: theme.textMuted, lineHeight: 1.7 }}>Manage platform users and administrator tools.</p>
          </section>
          <section style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, backdropFilter: 'blur(24px) saturate(1.15)' }}>
            <ShieldCheck size={22} color={theme.primary} />
            <div><strong style={{ fontSize: '0.95rem' }}>Administrator access active</strong><p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.84rem' }}>Use the admin navigation below to manage the platform.</p></div>
          </section>
        </div>
      </div>
      <NowBar admin />
    </div>
  </HybridTheme>;
};

export default AdminHomePage;
