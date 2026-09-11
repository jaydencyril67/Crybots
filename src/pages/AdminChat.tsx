import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { FaTimes, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { formatTradeSpotTime } from '../utils/tradeSpotTime';
import './AdminChat.css';

// --- FIXED SOCKET_URL: Use a safe fallback and correct protocol ---
const API = process.env.REACT_APP_API_BASE_URL || 'https://api-tradespot.onrender.com';
let SOCKET_URL = '';
if (API.startsWith('https://')) {
  SOCKET_URL = API.replace('https://', 'wss://');
} else if (API.startsWith('http://')) {
  SOCKET_URL = API.replace('http://', 'ws://');
} else {
  SOCKET_URL = 'wss://api-tradespot.onrender.com';
}

const AdminChat: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [usersWithMessages, setUsersWithMessages] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = windowWidth <= 768;

  // Track window width for responsiveness
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch users who have messaged (function extracted for reuse)
  const fetchUsers = useCallback(async (showLoading: boolean = false) => {
    if (showLoading) setLoadingUsers(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Fetch both users who have messaged and all users for search
      const [messagedUsersRes, allUsersRes] = await Promise.all([
        axios.get(`${API}/api/messages/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      const messagedUsers = messagedUsersRes.data.users || [];
      const allUsers = allUsersRes.data.users || [];
      
      // Track which users have messages
      const usersWithMessagesSet = new Set<string>(
        messagedUsers.map((user: any) => String(user._id))
      );
      setUsersWithMessages(usersWithMessagesSet);
      
      // Combine and deduplicate users
      const usersMap = new Map();
      messagedUsers.forEach((user: any) => usersMap.set(user._id, user));
      allUsers.forEach((user: any) => {
        if (!usersMap.has(user._id)) {
          usersMap.set(user._id, user);
        }
      });
      
      setUsers(Array.from(usersMap.values()));
    } catch (e) {
      setError('Failed to load users');
    } finally {
      if (showLoading) setLoadingUsers(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMessages(true);
    setMessages([]);
    setError('');
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/api/messages/admin/history/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.history || []);
        
        // Refresh user list to update unread counts after viewing messages
        fetchUsers();
      } catch (e) {
        setError('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedUser, fetchUsers]);

  // Socket.io setup
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: localStorage.getItem('adminToken') },
      });
      socketRef.current.emit('join', 'admin');
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload && payload.userId) {
            socketRef.current.emit('join', payload.userId);
          }
        } catch (e) { /* ignore */ }
      }
    }
    
    const socket = socketRef.current;
    const handleNewMessage = (msg: any) => {
      if (selectedUser && (msg.sender === selectedUser._id || msg.recipient === selectedUser._id)) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => m._id === msg._id || (m._optimistic && m.content === msg.content && new Date(m.createdAt || m.timestamp).getTime() === new Date(msg.createdAt || msg.timestamp).getTime()));
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    };
    
    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [selectedUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedUser) return;
    const token = localStorage.getItem('adminToken');
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMsg = {
      from: 'admin',
      fromAdmin: true,
      to: selectedUser._id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      _optimistic: true,
      _optimisticId: optimisticId,
      _failed: false
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    try {
      const res = await axios.post(`${API}/api/messages/admin/send/${selectedUser._id}`, {
        content: optimisticMsg.content,
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Replace optimistic message with real one from server
      setMessages((prev) => prev.map(m => m._optimisticId === optimisticId ? res.data.msg : m));
    } catch (e) {
      setError('Failed to send message');
      setMessages((prev) => prev.map(m => m._optimisticId === optimisticId ? { ...m, _failed: true } : m));
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setSearchQuery('');
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const username = user.username?.toLowerCase() || '';
    const fullName = user.fullName?.toLowerCase() || '';
    return email.includes(query) || username.includes(query) || fullName.includes(query);
  });

  return (
    <div className="admin-chat-wrapper">
      {/* Header */}
      <div className="admin-chat-page-header">
        <span className="admin-chat-page-title">ADMIN CHAT</span>
      </div>

      {/* Main Container */}
      <div className="admin-chat-container">
        {/* User List Sidebar */}
        {(!selectedUser || !isMobile) && (
          <div className={`admin-chat-sidebar ${selectedUser && !isMobile ? 'sidebar-collapsed' : ''}`}>
            <div className="admin-chat-sidebar-header">
              <h2>Conversations</h2>
              <div className="admin-chat-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="admin-chat-user-list">
              {loadingUsers ? (
                <div className="loading-state">
                  <span className="loading-dots">Loading...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state">
                  {searchQuery ? 'No users found' : 'No conversations yet'}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const hasMessages = usersWithMessages.has(user._id);
                  return (
                    <div
                      key={user._id}
                      className={`admin-chat-user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="user-item-content">
                        {user.isPublicUser ? (
                          <>
                            <div className="user-badge public-badge">📧 Public</div>
                            <div className="user-email">{user.email}</div>
                          </>
                        ) : (
                          <>
                            <div className="user-identifier">
                              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                {user.email || user.username || user._id}
                                {user.unreadCount > 0 && (
                                  <span 
                                    className="unread-dot"
                                    style={{
                                      position: 'absolute',
                                      top: '-6px',
                                      right: '-12px',
                                      width: '8px',
                                      height: '8px',
                                      background: '#e74c3c',
                                      borderRadius: '50%',
                                      border: '2px solid #fff',
                                      boxShadow: '0 0 0 1px #e74c3c'
                                    }}
                                  />
                                )}
                              </span>
                              {user.fullName && (
                                <span className="user-fullname-badge">{user.fullName}</span>
                              )}
                            </div>
                            {!hasMessages && (
                              <div className="new-conversation-badge">New conversation</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        {selectedUser ? (
          <div className="admin-chat-main">
            {/* Chat Header */}
            <div className="admin-chat-header">
              {isMobile && (
                <button className="back-button" onClick={handleBackToUsers}>
                  <FaArrowLeft />
                </button>
              )}
              <div className="chat-header-info">
                <div className="chat-user-name">
                  {selectedUser.isPublicUser ? (
                    <>
                      <span className="public-indicator">📧 Public User</span>
                      <span className="user-email-small">{selectedUser.email}</span>
                    </>
                  ) : (
                    selectedUser.email || selectedUser.username || selectedUser._id
                  )}
                </div>
              </div>
            </div>

            {/* Public User Notice */}
            {selectedUser.isPublicUser && (
              <div className="public-user-notice">
                <div className="notice-icon">📧</div>
                <div className="notice-text">
                  <strong>Public User Reply</strong>
                  <span>Messages will be sent via email to: {selectedUser.email}</span>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="admin-chat-messages" ref={messagesContainerRef}>
              {loadingMessages ? (
                <div className="loading-state">
                  <span className="loading-dots">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-state">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg, idx) => {
                  const isAdmin = msg.from === 'admin' || msg.fromAdmin === true;
                  const dateVal = msg.createdAt || msg.timestamp;
                  const timestamp = dateVal ? formatTradeSpotTime(new Date(dateVal)) : '';

                  return (
                    <div
                      key={idx}
                      className={`message-wrapper ${isAdmin ? 'message-admin' : 'message-user'}`}
                    >
                      <div className={`message-bubble ${isAdmin ? 'bubble-admin' : 'bubble-user'}`}>
                        <div className="message-content">{msg.content}</div>
                        {msg._failed && (
                          <div className="message-error">Failed to send</div>
                        )}
                      </div>
                      <div className="message-time">{timestamp}</div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="chat-error-message">{error}</div>
            )}

            {/* Input Area */}
            <div className="admin-chat-input-area">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                  placeholder={selectedUser.isPublicUser ? "Type a message (via email)..." : "Type a message..."}
                  className="chat-input"
                />
                <button
                  type="submit"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="send-button"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-chat-empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-text">Select a conversation to start chatting</div>
          </div>
        )}
      </div>

      {/* Loading dots animation */}
      <style>{`
        @keyframes loading-dots {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
        .loading-dots {
          animation: loading-dots 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminChat;
