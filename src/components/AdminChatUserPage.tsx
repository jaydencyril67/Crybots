import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NotificationBanner from './NotificationBanner';

type ChatMessage = {
  id: string;
  userId: string;
  senderRole: 'user' | 'admin';
  senderName?: string;
  message: string;
  createdAt: string;
};

const getTargetUserId = () => {
  const path = window.location.pathname.startsWith('/admin/chat/')
    ? window.location.pathname
    : window.location.hash.replace(/^#/, '');
  return path.split('/').filter(Boolean).pop() || '';
};

const AdminChatUserPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const targetUserId = useMemo(getTargetUserId, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAdminToken(localStorage.getItem('token')) || !targetUserId) {
      navigate('/admin/chat');
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) return undefined;
    const socket = io(API_BASE_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      setError('');
      socket.emit('chat:join', targetUserId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (socketError) => setError(socketError.message || 'Unable to connect to live chat.'));
    socket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history || []);
      setLoading(false);
    });
    socket.on('chat:message', (message: ChatMessage) => {
      if (message.userId !== targetUserId) return;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    });
    socket.on('chat:error', (message: string) => {
      setError(message);
      setSending(false);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [targetUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !socketRef.current || !connected || !targetUserId) return;
    setSending(true);
    socketRef.current.emit('chat:send', { userId: targetUserId, message }, (response: { ok: boolean; error?: string }) => {
      setSending(false);
      if (!response?.ok) setError(response?.error || 'Unable to send the message.');
      else setDraft('');
    });
  };

  if (!isAdminToken(localStorage.getItem('token'))) return null;

  return <HybridTheme mode={themeMode}><div style={{ minHeight: '100vh', background: theme.background, color: theme.text, paddingBottom: 32 }}>
    <main style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: 'clamp(18px, 3vw, 32px) clamp(14px, 3vw, 28px)', boxSizing: 'border-box' }}>
      <button type="button" onClick={() => navigate('/admin/chat')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer' }}><ArrowLeft size={16} /> Back to chats</button>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}><div><h1 style={{ margin: 0, fontSize: 'clamp(1.45rem, 4vw, 2rem)' }}>User chat</h1><p style={{ margin: '8px 0 0', color: theme.textMuted }}>Respond to this user in real time.</p></div><MessageCircle size={30} /></header>
      <div style={{ border: `1px solid ${theme.borderGlass}`, borderRadius: 14, background: theme.surfaceGlass, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.borderGlass}`, color: connected ? theme.success : theme.textMuted, fontSize: '.82rem' }}>{connected ? '● Live connection' : '○ Connecting…'}</div>
        <div style={{ minHeight: 420, maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', padding: 16 }}>
          {error && <NotificationBanner tone="error" title="Chat error" message={error} />}
          {loading ? <p style={{ color: theme.textMuted }}>Loading conversation…</p> : messages.length === 0 ? <p style={{ color: theme.textMuted, textAlign: 'center', padding: 40 }}>No messages yet.</p> : messages.map((message) => <div key={message.id} style={{ display: 'flex', justifyContent: message.senderRole === 'admin' ? 'flex-end' : 'flex-start', marginBottom: 12 }}><div style={{ maxWidth: '78%', padding: '10px 13px', borderRadius: 14, background: message.senderRole === 'admin' ? theme.primary : theme.surfaceMuted, color: message.senderRole === 'admin' ? theme.textInverse : theme.text, overflowWrap: 'anywhere' }}><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{message.message}</div><small style={{ display: 'block', marginTop: 5, opacity: .65 }}>{new Date(message.createdAt).toLocaleString()}</small></div></div>)}<div ref={endRef} /></div>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${theme.borderGlass}` }}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a reply…" rows={2} disabled={!connected || sending} style={{ flex: 1, resize: 'none', border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: 10, background: theme.surfaceMuted, color: theme.text, font: 'inherit' }} /><button type="submit" disabled={!connected || sending || !draft.trim()} style={{ alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.primary}`, borderRadius: 10, padding: '0 15px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 800 }}><Send size={16} /> Send</button></form>
      </div>
    </main>
  </div></HybridTheme>;
};

export default AdminChatUserPage;
