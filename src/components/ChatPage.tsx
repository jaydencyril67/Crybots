import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Send } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { uploadChatImage } from '../utils/chatImageUpload';
import LoadingDots from './LoadingDots';

type ChatMessage = {
  id: string;
  userId: string;
  senderRole: 'user' | 'admin';
  message: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  createdAt: string;
};

const ChatPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    const socket = io(API_BASE_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => { setConnected(true); setError(''); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (socketError) => setError(socketError.message || 'Unable to connect to live chat.'));
    socket.on('chat:history', (history: ChatMessage[]) => { setMessages(history || []); setLoading(false); });
    socket.on('chat:message', (message: ChatMessage) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    });
    socket.on('chat:error', (message: string) => { setError(message); setSending(false); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !socketRef.current || !connected) return;
    setSending(true);
    socketRef.current.emit('chat:send', { message: content }, (response: { ok: boolean; error?: string }) => {
      setSending(false);
      if (!response?.ok) setError(response?.error || 'Unable to send your message.');
      else setDraft('');
    });
  };

  const sendImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !socketRef.current || !connected) return;
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploading(true);
    setSending(true);
    setError('');
    try {
      const imageUrl = await uploadChatImage(file);
      if (!socketRef.current || !connected) throw new Error('Chat connection was lost. Please try again.');
      await new Promise<void>((resolve) => {
        socketRef.current?.emit('chat:send', { imageUrl }, (response: { ok: boolean; error?: string }) => {
          if (!response?.ok) setError(response?.error || 'Unable to send your image.');
          resolve();
        });
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload image.');
    } finally {
      setSending(false);
      URL.revokeObjectURL(previewUrl);
      setImagePreview('');
      setUploading(false);
    }
  };

  return <HybridTheme mode={themeMode}><div style={{ height: 'calc(100dvh - 150px)', minHeight: 0, marginBottom: 0, background: theme.background, color: theme.text, overflow: 'hidden' }}>
    <main style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
      <button type="button" onClick={() => navigate('/help')} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '.84rem', marginBottom: 12 }}><ArrowLeft size={17} /> Help</button>
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.borderGlass}`, color: connected ? theme.success : theme.textMuted, fontSize: '.82rem' }}>{connected ? '● Live connection' : '○ Connecting…'}</div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
          {error && <p style={{ margin: '0 0 10px', color: theme.danger, fontSize: '.84rem' }}>{error}</p>}
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><LoadingDots /></div> : messages.length === 0 ? <p style={{ color: theme.textMuted, textAlign: 'center', padding: 40 }}>Start a conversation with support.</p> : messages.map((message) => <div key={message.id} style={{ display: 'flex', justifyContent: message.senderRole === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}><div style={{ maxWidth: '78%', padding: '10px 13px', borderRadius: 14, background: message.senderRole === 'user' ? theme.primary : theme.surfaceMuted, color: message.senderRole === 'user' ? theme.textInverse : theme.text, overflowWrap: 'anywhere' }}><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{(message.type === 'image' || message.imageUrl) && message.imageUrl ? <img src={message.imageUrl} alt="Chat attachment" style={{ display: 'block', maxWidth: '100%', maxHeight: 320, borderRadius: 10, objectFit: 'contain' }} /> : message.message}</div><small style={{ display: 'block', marginTop: 5, opacity: .65 }}>{new Date(message.createdAt).toLocaleString()}</small></div></div>)}<div ref={endRef} /></div>
        {imagePreview && <div style={{ padding: '8px 12px 0', borderTop: `1px solid ${theme.borderGlass}` }}><img src={imagePreview} alt="Selected attachment preview" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 8 }} /></div>}<form onSubmit={sendMessage} style={{ display: 'flex', flexShrink: 0, gap: 8, padding: '12px 12px calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.borderGlass}` }}><label title="Send image" style={{ alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '0 12px', color: theme.text, cursor: connected && !uploading ? 'pointer' : 'not-allowed', opacity: connected && !uploading ? 1 : .5 }}><ImagePlus size={18} /><input type="file" accept="image/*" onChange={sendImage} disabled={!connected || sending || uploading} style={{ display: 'none' }} /></label><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" rows={2} disabled={!connected || sending || uploading} style={{ flex: 1, resize: 'none', border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: 10, background: theme.surfaceMuted, color: theme.text, font: 'inherit' }} /><button type="submit" disabled={!connected || sending || uploading || !draft.trim()} style={{ alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.primary}`, borderRadius: 10, padding: '0 15px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 800 }}><Send size={16} /> Send</button></form>
      </div>
    </main>
  </div></HybridTheme>;
};

export default ChatPage;
