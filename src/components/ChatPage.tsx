import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Send, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/axios';
import { navigate } from '../utils/navigate';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';
import { uploadChatImage } from '../utils/chatImageUpload';
import LoadingDots from './LoadingDots';
import ImagePickerButton from './ImagePickerButton';
import ProfileImageCropModal from './ProfileImageCropModal';
import ImagePreviewModal from './ImagePreviewModal';

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
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState('');
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [viewingImageUrl, setViewingImageUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const chatListRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const list = chatListRef.current;
    if (!list) return;
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight;
    });
  }, [messages]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (pendingImageFile) {
      void sendImage(pendingImageFile, draft.trim());
      return;
    }
    const content = draft.trim();
    if (!content || !socketRef.current || !connected) return;
    setSending(true);
    socketRef.current.emit('chat:send', { message: content }, (response: { ok: boolean; error?: string }) => {
      setSending(false);
      if (!response?.ok) setError(response?.error || 'Unable to send your message.');
      else setDraft('');
    });
  };

  const handleImageSelected = (file: File) => {
    setEditingImageUrl(URL.createObjectURL(file));
  };

  const sendImage = async (file: File, caption = '') => {
    if (!socketRef.current || !connected) return;
    setUploading(true);
    setSending(true);
    setError('');
    try {
      const imageUrl = await uploadChatImage(file);
      if (!socketRef.current || !connected) throw new Error('Chat connection was lost. Please try again.');
      const response = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
        socketRef.current?.emit('chat:send', { imageUrl, message: caption }, resolve);
      });
      if (!response?.ok) throw new Error(response?.error || 'Unable to send your image.');
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

  return <HybridTheme mode={themeMode}><div style={{ height: 'calc(100dvh - 80px)', minHeight: 0, marginBottom: 0, background: theme.background, color: theme.text, overflow: 'hidden' }}>
    <main style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
      <button type="button" onClick={() => navigate('/help')} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '.84rem', marginBottom: 12 }}><ArrowLeft size={17} /> Help</button>
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.borderGlass}`, color: connected ? theme.success : theme.textMuted, fontSize: '.82rem' }}>{connected ? '● Live connection' : '○ Connecting…'}</div>
        <div ref={chatListRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: 16, boxSizing: 'border-box' }}>
          {error && <p style={{ margin: '0 0 10px', color: theme.danger, fontSize: '.84rem' }}>{error}</p>}
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><LoadingDots /></div> : messages.length === 0 ? <p style={{ color: theme.textMuted, textAlign: 'center', padding: 40 }}>Start a conversation with support.</p> : messages.map((message) => <div key={message.id} style={{ display: 'flex', justifyContent: message.senderRole === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}><div style={{ maxWidth: '78%', width: message.imageUrl ? 224 : undefined, boxSizing: 'border-box', padding: message.imageUrl ? 2 : '10px 13px', borderRadius: message.imageUrl ? 9 : 14, background: message.senderRole === 'user' ? theme.primary : theme.surfaceMuted, color: message.senderRole === 'user' ? theme.textInverse : theme.text, overflowWrap: 'anywhere' }}><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{(message.type === 'image' || message.imageUrl) && message.imageUrl ? <><button type="button" onClick={() => setViewingImageUrl(message.imageUrl || '')} aria-label="Preview chat image" style={{ display: 'block', padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in', width: 220, height: 240, maxWidth: '100%', overflow: 'hidden', borderRadius: 5 }}><img src={message.imageUrl} alt="Chat attachment — tap to preview" style={{ display: 'block', width: '100%', height: '100%', borderRadius: 5, objectFit: 'cover' }} /></button>{message.message && <div style={{ marginTop: 7, whiteSpace: 'pre-wrap' }}>{message.message}</div>}</> : message.message}</div><small style={{ display: 'block', marginTop: 5, opacity: .65 }}>{new Date(message.createdAt).toLocaleString()}</small></div></div>)}</div>
        {pendingImagePreview && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 0', borderTop: `1px solid ${theme.borderGlass}` }}><img src={pendingImagePreview} alt="Image ready to send" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 8, objectFit: 'contain' }} /><span style={{ flex: 1, color: theme.textMuted, fontSize: '.82rem' }}>Add a caption or send the photo</span><button type="button" onClick={() => { setPendingImageFile(null); URL.revokeObjectURL(pendingImagePreview); setPendingImagePreview(''); }} disabled={sending || uploading} aria-label="Remove selected image" title="Remove image" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, color: theme.text, cursor: 'pointer' }}><X size={17} /></button></div>}<form onSubmit={sendMessage} style={{ display: 'flex', flexShrink: 0, gap: 8, padding: '12px 12px calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.borderGlass}` }}><ImagePickerButton accept="image/*" onImageSelected={handleImageSelected} disabled={!connected || sending || uploading} style={{ alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '0 12px', color: theme.text, background: 'transparent', cursor: connected && !uploading ? 'pointer' : 'not-allowed', opacity: connected && !uploading ? 1 : .5 }} title="Send image" aria-label="Send image">{uploading ? <LoadingDots /> : <ImagePlus size={18} />}</ImagePickerButton><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" rows={2} disabled={!connected || sending || uploading} style={{ flex: 1, resize: 'none', border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: 10, background: theme.surfaceMuted, color: theme.text, font: 'inherit' }} /><button type="submit" disabled={!connected || sending || uploading || (!draft.trim() && !pendingImageFile)} style={{ alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.primary}`, borderRadius: 10, padding: '0 15px', background: theme.primary, color: theme.textInverse, cursor: 'pointer', fontWeight: 800 }}>{sending ? <LoadingDots /> : <><Send size={16} /> Send</>}</button></form>
      </div>
    </main>
    {editingImageUrl && <ProfileImageCropModal preserveAspectRatio imageUrl={editingImageUrl} onCancel={() => { URL.revokeObjectURL(editingImageUrl); setEditingImageUrl(''); }} onDone={(file) => { URL.revokeObjectURL(editingImageUrl); setEditingImageUrl(''); if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview); setPendingImageFile(file); setPendingImagePreview(URL.createObjectURL(file)); }} />}
    {viewingImageUrl && <ImagePreviewModal imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl('')} />}
  </div></HybridTheme>;
};

export default ChatPage;
