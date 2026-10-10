import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, Plus, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/axios';
import { navigate } from '../utils/navigate';
import { isAdminToken } from '../utils/adminAuth';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import NotificationBanner from './NotificationBanner';
import { uploadChatImage } from '../utils/chatImageUpload';
import LoadingDots from './LoadingDots';
import ImagePickerButton from './ImagePickerButton';
import ProfileImageCropModal from './ProfileImageCropModal';
import ImagePreviewModal from './ImagePreviewModal';

type ChatMessage = {
  id: string;
  userId: string;
  senderRole: 'user' | 'admin';
  senderName?: string;
  message: string;
  type?: 'text' | 'image';
  imageUrl?: string;
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
  const [uploading, setUploading] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState('');
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [viewingImageUrl, setViewingImageUrl] = useState('');
  const [error, setError] = useState('');
  const chatListRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
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
    const list = chatListRef.current;
    if (!list) return;
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight;
    });
  }, [messages]);

  useEffect(() => {
    const input = messageInputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
  }, [draft]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (pendingImageFile) {
      void sendImage(pendingImageFile, draft.trim());
      return;
    }
    const message = draft.trim();
    if (!message || !socketRef.current || !connected || !targetUserId) return;
    setSending(true);
    socketRef.current.emit('chat:send', { userId: targetUserId, message }, (response: { ok: boolean; error?: string }) => {
      setSending(false);
      if (!response?.ok) setError(response?.error || 'Unable to send the message.');
      else setDraft('');
    });
  };

  const handleImageSelected = (file: File) => {
    setEditingImageUrl(URL.createObjectURL(file));
  };

  const sendImage = async (file: File, caption = '') => {
    if (!socketRef.current || !connected || !targetUserId) return;
    setUploading(true);
    setSending(true);
    setError('');
    try {
      const imageUrl = await uploadChatImage(file);
      if (!socketRef.current || !connected) throw new Error('Chat connection was lost. Please try again.');
      const response = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
        socketRef.current?.emit('chat:send', { userId: targetUserId, imageUrl, message: caption }, resolve);
      });
      if (!response?.ok) throw new Error(response?.error || 'Unable to send the image.');
      setDraft('');
      setPendingImageFile(null);
      if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
      setPendingImagePreview('');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload image.');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return <HybridTheme mode={themeMode}><div style={{ height: '100%', minHeight: 0, marginBottom: 0, background: theme.background, color: theme.text, overflow: 'hidden' }}>
    <main style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 12px 0' }}>
        <button type="button" onClick={() => navigate('/admin/chat')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, borderBottom: `1px solid ${theme.borderGlass}`, borderRadius: 0, padding: '12px 4px', background: 'transparent', color: theme.text, cursor: 'pointer', margin: 0 }}><ArrowLeft size={16} /> Back to chats</button>
        <div style={{ flexShrink: 0, alignSelf: 'center', transform: 'translateY(-3px)', color: connected ? theme.success : theme.textMuted, fontSize: '.78rem', textAlign: 'right', whiteSpace: 'nowrap' }}>{connected ? '● Live connection' : '○ Connecting…'}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div ref={chatListRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: 16, boxSizing: 'border-box' }}>
          {error && <NotificationBanner tone="error" title="Chat error" message={error} />}
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><LoadingDots /></div> : messages.length === 0 ? <p style={{ color: theme.textMuted, textAlign: 'center', padding: 40 }}>No messages yet.</p> : messages.map((message) => <div key={message.id} style={{ display: 'flex', justifyContent: message.senderRole === 'admin' ? 'flex-end' : 'flex-start', marginBottom: 12 }}><div style={{ maxWidth: '78%', width: message.imageUrl ? 224 : undefined, boxSizing: 'border-box', padding: message.imageUrl ? 2 : '10px 13px', borderRadius: message.imageUrl ? 9 : 14, background: message.senderRole === 'admin' ? theme.primary : theme.surfaceMuted, color: message.senderRole === 'admin' ? theme.textInverse : theme.text, overflowWrap: 'anywhere' }}><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{(message.type === 'image' || message.imageUrl) && message.imageUrl ? <><button type="button" onClick={() => setViewingImageUrl(message.imageUrl || '')} aria-label="Preview chat image" style={{ display: 'block', padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in', width: 220, height: 240, minHeight: 240, maxHeight: 240, maxWidth: '100%', flexShrink: 0, overflow: 'hidden', borderRadius: 5 }}><img src={message.imageUrl} alt="Chat attachment — tap to preview" style={{ display: 'block', width: '100%', height: '100%', borderRadius: 5, objectFit: 'cover' }} /></button>{message.message && <div style={{ marginTop: 7, whiteSpace: 'pre-wrap' }}>{message.message}</div>}</> : message.message}</div><small style={{ display: 'block', marginTop: 5, opacity: .65 }}>{new Date(message.createdAt).toLocaleString()}</small></div></div>)}</div>
        {pendingImagePreview && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 0', borderTop: `1px solid ${theme.borderGlass}` }}><img src={pendingImagePreview} alt="Image ready to send" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 8, objectFit: 'contain' }} /><span style={{ flex: 1, color: theme.textMuted, fontSize: '.82rem' }}>Add a caption or send the photo</span><button type="button" onClick={() => { setPendingImageFile(null); URL.revokeObjectURL(pendingImagePreview); setPendingImagePreview(''); }} disabled={sending || uploading} aria-label="Remove selected image" title="Remove image" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}><X size={17} /></button></div>}<form onSubmit={sendMessage} style={{ display: 'flex', flexShrink: 0, alignItems: 'flex-end', gap: 8, margin: '8px 12px max(4px, env(safe-area-inset-bottom))', padding: '8px 8px 8px 12px', border: `1px solid ${theme.borderGlass}`, borderRadius: 28, background: theme.surfaceMuted, boxShadow: themeMode === 'dark' ? '0 2px 12px rgba(0,0,0,0.18)' : '0 2px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}><ImagePickerButton accept="image/*" onImageSelected={handleImageSelected} disabled={!connected || sending || uploading} style={{ flex: '0 0 38px', width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: '50%', padding: 0, color: theme.text, background: 'transparent', cursor: connected && !uploading ? 'pointer' : 'not-allowed', opacity: connected && !uploading ? 1 : .5 }} title="Attach image" aria-label="Attach image">{uploading ? <LoadingDots /> : <Plus size={22} />}</ImagePickerButton><textarea ref={messageInputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message…" rows={1} disabled={!connected || sending || uploading} style={{ flex: 1, minWidth: 0, minHeight: 38, maxHeight: 144, resize: 'none', overflowY: 'auto', border: 0, outline: 'none', borderRadius: 0, padding: '9px 0', background: 'transparent', color: theme.text, font: 'inherit', lineHeight: 1.4, boxSizing: 'border-box' }} /><button type="submit" disabled={!connected || sending || uploading || (!draft.trim() && !pendingImageFile)} aria-label="Send reply" title="Send reply" style={{ flex: '0 0 38px', width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: '50%', padding: 0, background: theme.primary, color: theme.textInverse, cursor: 'pointer', opacity: !connected || sending || uploading || (!draft.trim() && !pendingImageFile) ? .45 : 1, transition: 'opacity 120ms ease' }}>{sending ? <LoadingDots /> : <ArrowUp size={21} strokeWidth={2.5} />}</button></form>
      </div>
    </main>
    {editingImageUrl && <ProfileImageCropModal preserveAspectRatio imageUrl={editingImageUrl} onCancel={() => { URL.revokeObjectURL(editingImageUrl); setEditingImageUrl(''); }} onDone={(file) => { URL.revokeObjectURL(editingImageUrl); setEditingImageUrl(''); if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview); setPendingImageFile(file); setPendingImagePreview(URL.createObjectURL(file)); }} />}
    {viewingImageUrl && <ImagePreviewModal imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl('')} />}
  </div></HybridTheme>;
};

export default AdminChatUserPage;
