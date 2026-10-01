import React, { useEffect, useState } from 'react';
import { Eye, MessageCircle } from 'lucide-react';
import api from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NowBar from './NowBar';
import NotificationBanner from './NotificationBanner';

type Conversation = { userId: string; firstName?: string; lastName?: string; email?: string; uid?: string; lastMessageAt: string; messageCount: number };

const AdminChatPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token'))) { navigate('/signin'); return; }
    api.get<{ conversations: Conversation[] }>('/api/chat/admin/conversations')
      .then(({ data }) => setConversations(data.conversations || []))
      .catch(() => setError('Unable to load chat conversations. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (!isAdminToken(localStorage.getItem('token'))) return null;
  return <HybridTheme mode={themeMode}><div style={{ minHeight: '100vh', paddingBottom: 132, background: theme.background, color: theme.text }}>
    <main style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(12px, 2.5vw, 24px)', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}><MessageCircle size={28} /><div><h1 style={{ margin: 0, fontSize: '1.45rem' }}>Admin Chat</h1><p style={{ margin: '5px 0 0', color: theme.textMuted }}>View and respond to live user conversations.</p></div></header>
      {error ? <NotificationBanner tone="error" title="Unable to load chats" message={error} /> : loading ? <NotificationBanner title="Loading chats" message="Loading user conversations…" /> : conversations.length === 0 ? <NotificationBanner title="No conversations" message="Users who contact support will appear here." /> : <div style={{ display: 'grid', gap: 10, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>{conversations.map((conversation) => { const name = [conversation.firstName, conversation.lastName].filter(Boolean).join(' ') || conversation.email || 'Unknown user'; return <article key={conversation.userId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center', padding: 14, borderRadius: 14, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}><div style={{ minWidth: 0 }}><h2 style={{ margin: 0, fontSize: '.98rem' }}>{name}</h2><p style={{ margin: '5px 0 0', color: theme.textMuted, fontSize: '.82rem' }}>{conversation.email || conversation.uid || 'User'} · {conversation.messageCount} messages</p><small style={{ display: 'block', marginTop: 7, color: theme.textMuted }}>{new Date(conversation.lastMessageAt).toLocaleString()}</small></div><button type="button" onClick={() => navigate(`/admin/chat/${conversation.userId}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '8px 13px', background: theme.surfaceMuted, color: theme.text, cursor: 'pointer', fontWeight: 800 }}><Eye size={15} /> View</button></article>; })}</div>}
    </main><NowBar admin />
  </div></HybridTheme>;
};

export default AdminChatPage;
