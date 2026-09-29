import React, { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import { useAppTheme } from './AppTheme';

const AdminHomePage = () => {
  const { themeMode } = useAppTheme();

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) {
      navigate('/signin');
    }
  }, []);

  if (!isAdminToken(localStorage.getItem('token'))) return null;

  const isDark = themeMode === 'dark';
  const background = isDark ? '#10131a' : '#f4f7fb';
  const surface = isDark ? '#191f2b' : '#ffffff';
  const text = isDark ? '#f5f7fb' : '#172033';
  const muted = isDark ? '#aab4c5' : '#62708a';

  return (
    <main style={{ minHeight: '100vh', background, color: text, padding: 'clamp(24px, 5vw, 64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: '#2563eb', color: '#fff' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#2563eb', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>KingsHall Admin</p>
            <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Admin-Home</h1>
          </div>
        </header>
        <section style={{ padding: 28, borderRadius: 24, background: surface, boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)' }}>
          <h2 style={{ marginTop: 0 }}>Welcome to the admin system</h2>
          <p style={{ marginBottom: 0, color: muted, lineHeight: 1.7 }}>Your administrator sign-in is active. This dashboard is ready for the next admin features.</p>
        </section>
      </div>
    </main>
  );
};

export default AdminHomePage;
