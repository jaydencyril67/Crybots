import React, { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import api from '../api/axios';
import { isAdminToken } from '../utils/adminAuth';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type Conversation = { userId: string; firstName?: string; lastName?: string; email?: string; };

const AdminChatPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    api.get<{ conversations: Conversation[] }>('/api/chat/admin/conversations')
      .then(({ data }) => setConversations(data.conversations || []))
      .catch(() => setError('Unable to load chat conversations. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredConversations = conversations.filter((conversation) => {
    if (!normalizedSearch) return true;
    const name = [conversation.firstName, conversation.lastName].filter(Boolean).join(' ');
    return `${name} ${conversation.email || ''}`.toLowerCase().includes(normalizedSearch);
  });
  return <HybridTheme mode={themeMode}><div style={{ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }}>
    <main style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px)', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 18 }}><h1 style={{ margin: 0, fontSize: '1.45rem' }}>Admin Chat</h1><p style={{ margin: '5px 0 0', color: theme.textMuted }}>Users who contacted support.</p></header>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '9px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass }}><Search size={18} color={theme.textMuted} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users by name or email" aria-label="Search users by name or email" style={{ width: '100%', border: 0, outline: 0, background: 'transparent', color: theme.text, fontSize: '0.92rem' }} /></div>
      {error ? <NotificationBanner tone="error" title="Unable to load chats" message={error} /> : loading ? <NotificationBanner title="Loading chats" message="Loading user conversations…" /> : filteredConversations.length === 0 ? <NotificationBanner title={conversations.length === 0 ? 'No conversations' : 'No matching users'} message={conversations.length === 0 ? 'Users who contact support will appear here.' : 'Try a different name or email.'} /> : <div style={{ display: 'grid', gap: 10, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>{filteredConversations.map((conversation) => { const name = [conversation.firstName, conversation.lastName].filter(Boolean).join(' ') || conversation.email || 'Unknown user'; return <article key={conversation.userId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center', padding: 14, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}><div style={{ minWidth: 0 }}><h2 style={{ margin: 0, fontSize: '.98rem' }}>{name}</h2><p style={{ margin: '5px 0 0', color: theme.textMuted, fontSize: '.82rem' }}>{conversation.email || 'Email unavailable'}</p></div><button type="button" onClick={() => navigate(`/admin/chat/${conversation.userId}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '8px 13px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', fontWeight: 800 }}><Eye size={15} /> View</button></article>; })}</div>}
    </main><NowBar admin />
  </div></HybridTheme>;
};

export default AdminChatPage;
