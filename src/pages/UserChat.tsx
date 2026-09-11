import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { formatTradeSpotTime } from '../utils/tradeSpotTime';
import { useTheme } from '../ThemeContext';
import { FaUser, FaHeadset } from 'react-icons/fa';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
let SOCKET_URL = '';
if (API.startsWith('https://')) {
  SOCKET_URL = API.replace('https://', 'wss://');
} else if (API.startsWith('http://')) {
  SOCKET_URL = API.replace('http://', 'ws://');
} else {
  SOCKET_URL = 'wss://api-tradespot.onrender.com';
}

const UserChat: React.FC = () => {
  const { theme } = useTheme();

  // Add CSS for hiding scrollbars
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .chat-messages-container {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      .chat-messages-container::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history and initialize socket (like ChatWidget)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to use live chat');
      setLoading(false);
      return;
    }

    // Load chat history using the same endpoint as ChatWidget
    axios.get(`${API}/api/messages/user/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const history = res.data.history || [];
        setMessages(history);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load chat history');
        setLoading(false);
      });

    // Connect socket like ChatWidget
    const socket = io(SOCKET_URL, { transports: ['websocket'], auth: { token } });
    socketRef.current = socket;

    // Join user room like ChatWidget does
    axios.get(`${API}/api/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        socket.emit('join', res.data.id);
        setIsConnected(true);
      })
      .catch(() => {
        setError('Connection error');
      });

    // Listen for new messages (using same event as ChatWidget)
    socket.on('new_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const messageContent = input.trim(); // Store input before clearing
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMsg = {
      content: messageContent,
      fromAdmin: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      _optimistic: true,
      _optimisticId: optimisticId,
      _failed: false
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInput(''); // Clear input after storing content

    try {
      const res = await axios.post(`${API}/api/messages/user/send`, 
        { content: messageContent }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.map(m => m._optimisticId === optimisticId ? res.data.msg : m));
    } catch {
      setError('Failed to send message');
      setMessages(prev => prev.map(m => m._optimisticId === optimisticId ? { ...m, _failed: true } : m));
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}>
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center'
        }}>
          ...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg)',
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--card-bg)',
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      }}>
        <FaHeadset size={20} style={{ color: 'var(--primary-color)' }} />
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text)',
          margin: 0
        }}>
          Live Support Chat
        </h2>
        <div style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: isConnected ? '#10b981' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#10b981' : '#ef4444'
          }} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          color: '#e74c3c', 
          fontSize: '14px', 
          textAlign: 'center',
          background: 'var(--card-bg)',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0
        }}>
          {error}
        </div>
      )}


      {/* Chat Messages - Scrollable Area */}
      <div 
        className="chat-messages-container"
        style={{
          background: 'var(--card-bg)',
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            color: theme === 'dark' ? '#999' : '#666', 
            fontSize: '14px', 
            textAlign: 'center',
            padding: '20px'
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message._id || message._optimisticId || index}
              style={{
                display: 'flex',
                flexDirection: message.fromAdmin ? 'row' : 'row-reverse',
                alignItems: 'flex-end',
                gap: '8px'
              }}
            >
              <div style={{
                background: message.fromAdmin 
                  ? (theme === 'dark' ? '#2a2a2a' : '#f3f4f6')
                  : (message._failed ? '#ef4444' : '#10c98f'),
                color: message.fromAdmin 
                  ? (theme === 'dark' ? '#fff' : '#25324B')
                  : '#fff',
                borderRadius: '16px',
                padding: '10px 14px',
                maxWidth: '75%',
                fontSize: '14px',
                lineHeight: 1.4,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                opacity: message._optimistic ? 0.7 : 1
              }}>
                <div>{message.content}</div>
                {message._failed && (
                  <div style={{ 
                    marginTop: '6px', 
                    fontSize: '11px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    <span style={{ color: '#e74c3c' }}>Send failed</span>
                    <button
                      onClick={() => {
                        // Implement retry functionality if needed
                      }}
                      style={{
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}
                {message._optimistic && (
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '11px', 
                    opacity: 0.7 
                  }}>
                    Sending...
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '10px',
                color: theme === 'dark' ? '#666' : '#999',
                whiteSpace: 'nowrap'
              }}>
                {formatTradeSpotTime(message.timestamp || message.createdAt)}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input - Fixed at Bottom */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme === 'dark' ? '#333' : '#e5e7eb'}`,
        background: theme === 'dark' ? '#222' : '#f9fafb',
        display: 'flex',
        gap: '12px',
        flexShrink: 0
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          placeholder="Type your message..."
          style={{
            flex: 1,
            border: `1px solid ${theme === 'dark' ? '#333' : '#e5e7eb'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            background: theme === 'dark' ? '#1a1a1a' : '#fff',
            color: theme === 'dark' ? '#fff' : '#25324B',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            background: input.trim() ? '#10c98f' : (theme === 'dark' ? '#333' : '#e5e7eb'),
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            opacity: input.trim() ? 1 : 0.6,
            minWidth: '80px'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default UserChat;
