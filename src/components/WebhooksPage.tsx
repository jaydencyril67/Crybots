import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, Copy, Globe, KeyRound, Plus, RefreshCw, Send, Webhook as WebhookIcon } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import NotificationBanner from './NotificationBanner';
import NowBar from './NowBar';
import { useAppTheme } from './AppTheme';
import { navigate } from '../utils/navigate';

type Webhook = { id: string; name: string; url: string; events: string[]; enabled: boolean };
type Delivery = { _id: string; eventId: string; eventType: string; status: string; attempts: number; responseStatus?: number; responseTimeMs?: number; lastError?: string };
const eventTypes = ['account.updated', 'transaction.created', 'transfer.completed', 'deposit.created', 'withdrawal.created', 'bot.created', 'bot.updated', 'bot.completed'];

const WebhooksPage = () => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [expandedId, setExpandedId] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['account.updated']);
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [rotateId, setRotateId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editEvents, setEditEvents] = useState<string[]>([]);
  const [testEvent, setTestEvent] = useState('account.updated');
  const [isTestEventMenuOpen, setIsTestEventMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [loadingDeliveryId, setLoadingDeliveryId] = useState('');
  const [copyingSecret, setCopyingSecret] = useState(false);
  const testEventMenuRef = React.useRef<HTMLDivElement | null>(null);

  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', overflowX: 'hidden', background: theme.background, color: theme.text, paddingBottom: '90px' },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' },
    content: { display: 'grid', gap: 14, marginTop: 14 },
    back: { height: 30, display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    outerCard: { padding: 16, borderRadius: 22, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', display: 'grid', gap: 16, boxSizing: 'border-box', minWidth: 0 },
    card: { padding: 16, borderRadius: 22, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', display: 'grid', gap: 16, boxSizing: 'border-box', minWidth: 0 },
    row: { display: 'grid', gap: 10, width: '100%', padding: '12px 0', borderRadius: 0, border: 'none', borderBottom: `1px solid ${theme.borderGlass}`, background: 'transparent', boxSizing: 'border-box', minWidth: 0 },
    label: { margin: 0, color: theme.textMuted, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 7 },
    value: { margin: 0, color: theme.text, fontSize: '0.94rem', fontWeight: 800, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' },
    note: { margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.4 },
    input: { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem', font: 'inherit' },
    button: { border: 'none', borderRadius: 999, padding: '9px 13px', fontWeight: 800, cursor: 'pointer', width: '100%', minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: theme.primary, color: theme.textInverse, font: 'inherit' },
    mutedButton: { border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass, color: theme.text },
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<{ webhooks: Webhook[] }>('/api/developer/webhooks');
      setWebhooks(response.data.webhooks);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load webhooks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (testEventMenuRef.current && !testEventMenuRef.current.contains(event.target as Node)) {
        setIsTestEventMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => { void load(); }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post<{ secret: string }>('/api/developer/webhooks', { name, url, events });
      setSecret(response.data.secret);
      setMessage('Webhook created successfully.');
      setName('');
      setUrl('');
      setEvents(['account.updated']);
      setShowCreate(false);
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to create webhook.');
    } finally {
      setSaving(false);
    }
  };

  const loadDeliveries = async (id: string) => {
    setLoadingDeliveryId(id);
    try {
      const response = await api.get<{ deliveries: Delivery[] }>(`/api/developer/webhooks/${id}/deliveries?limit=50`);
      setDeliveries((current) => ({ ...current, [id]: response.data.deliveries }));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load delivery history.');
    } finally {
      setLoadingDeliveryId('');
    }
  };

  const test = async (id: string) => {
    setActionLoading(`test:${id}`);
    setError('');
    try {
      await api.post(`/api/developer/webhooks/${id}/test`, { eventType: testEvent });
      setMessage('Test delivery sent.');
      await loadDeliveries(id);
      setExpandedId(id);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to send test delivery.');
    } finally {
      setActionLoading('');
    }
  };

  const retry = async (id: string, deliveryId: string) => {
    setActionLoading(`retry:${deliveryId}`);
    setError('');
    try {
      await api.post(`/api/developer/webhooks/${id}/deliveries/${deliveryId}/retry`);
      setMessage('Delivery retry requested.');
      await loadDeliveries(id);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to retry delivery.');
    } finally {
      setActionLoading('');
    }
  };

  const update = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      const response = await api.patch<{ webhook: Webhook }>(`/api/developer/webhooks/${id}`, { name: editName, url: editUrl, events: editEvents });
      setWebhooks((current) => current.map((item) => item.id === id ? response.data.webhook : item));
      setEditingId(null);
      setMessage('Webhook configuration saved.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to save webhook configuration.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (webhook: Webhook) => {
    setActionLoading(`toggle:${webhook.id}`);
    setError('');
    try {
      const response = await api.patch<{ webhook: Webhook }>(`/api/developer/webhooks/${webhook.id}`, { enabled: !webhook.enabled });
      setWebhooks((current) => current.map((item) => item.id === webhook.id ? response.data.webhook : item));
      setMessage(response.data.webhook.enabled ? 'Webhook enabled.' : 'Webhook disabled.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to change webhook status.');
    } finally {
      setActionLoading('');
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/api/developer/webhooks/${id}`);
      setWebhooks((current) => current.filter((item) => item.id !== id));
      setDeliveries((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      if (expandedId === id) setExpandedId('');
      if (deleteId === id) setDeleteId(null);
      setMessage('Webhook deleted.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to delete webhook.');
    } finally {
      setDeletingId(null);
    }
  };

  const beginEdit = (webhook: Webhook) => {
    setEditingId(webhook.id);
    setEditName(webhook.name);
    setEditUrl(webhook.url);
    setEditEvents(webhook.events);
    setError('');
  };

  const rotate = async (id: string) => {
    setRotatingId(id);
    setError('');
    try {
      const response = await api.post<{ secret: string }>(`/api/developer/webhooks/${id}/rotate-secret`);
      setSecret(response.data.secret);
      setMessage('Webhook secret rotated. Update the receiving application now.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to rotate webhook secret.');
    } finally {
      setRotatingId(null);
    }
  };

  return (
    <HybridTheme mode={themeMode}>
      <main style={styles.page}>
        <div style={styles.shell}>
          <button type="button" onClick={() => navigate('/dev')} style={styles.back}>
            <ArrowLeft size={17} /> Dev
          </button>

          <div style={styles.content}>
            {error && <NotificationBanner tone="error" title="Webhook action unavailable" message={error} />}
            {message && <NotificationBanner tone="success" title="Webhook updated" message={message} />}

            <div style={styles.card}>
              <div style={styles.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <WebhookIcon size={20} color={theme.primary} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.value}>Webhooks</p>
                    <p style={styles.note}>Receive CryBots events in your external application.</p>
                  </div>
                  <span style={{ borderRadius: 999, padding: '5px 9px', fontSize: '0.7rem', fontWeight: 850, background: theme.surfaceGlass, color: theme.textMuted }}>
                    {webhooks.filter((webhook) => webhook.enabled).length} enabled
                  </span>
                </div>
              </div>
              <div style={{ ...styles.row, marginTop: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                  <div><p style={styles.label}>Enabled</p><p style={{ ...styles.value, marginTop: 5 }}>{webhooks.filter((webhook) => webhook.enabled).length}</p></div>
                  <div><p style={styles.label}>Disabled</p><p style={{ ...styles.value, marginTop: 5 }}>{webhooks.filter((webhook) => !webhook.enabled).length}</p></div>
                  <div><p style={styles.label}>Total</p><p style={{ ...styles.value, marginTop: 5 }}>{webhooks.length}</p></div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              {!showCreate ? (
                <button type="button" onClick={() => setShowCreate(true)} style={styles.button}>
                  <Plus size={16} /> Add webhook
                </button>
              ) : (
                <form onSubmit={create} style={{ display: 'grid', gap: 10 }}>
                  <div style={styles.row}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Globe size={18} color={theme.primary} />
                      <div><p style={styles.value}>New webhook</p><p style={styles.note}>Choose the events this endpoint should receive.</p></div>
                    </div>
                  </div>
                  <div style={styles.row}>
                    <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>
                      Name
                      <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="My application" style={styles.input} />
                    </label>
                  </div>
                  <div style={styles.row}>
                    <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>
                      HTTPS endpoint
                      <input required type="url" placeholder="https://example.com/events" value={url} onChange={(event) => setUrl(event.target.value)} style={styles.input} />
                    </label>
                  </div>
                  <div style={styles.row}>
                    <p style={styles.label}>Events</p>
                    <p style={styles.note}>Select at least one event.</p>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {eventTypes.map((eventType) => (
                        <label key={eventType} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}` }}>
                          <input type="checkbox" checked={events.includes(eventType)} onChange={() => setEvents((current) => current.includes(eventType) ? current.filter((item) => item !== eventType) : [...current, eventType])} />
                          <span>{eventType}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    <button type="button" onClick={() => setShowCreate(false)} style={{ ...styles.button, ...styles.mutedButton }}>Cancel</button>
                    <button disabled={saving || !events.length} style={{ ...styles.button }}>{saving ? <LoadingDots /> : 'Create webhook'}</button>
                  </div>
                </form>
              )}
            </div>

            {secret && (
              <div style={styles.card}>
                <div style={{ ...styles.row, borderColor: theme.primary }}>
                  <p style={styles.label}><KeyRound size={15} /> Webhook secret</p>
                  <p style={styles.note}>Copy this secret now. It will not be shown again.</p>
                  <code style={{ display: 'block', overflowWrap: 'anywhere', padding: 12, borderRadius: 10, background: theme.surfaceGlass }}>{secret}</code>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    <button type="button" onClick={async () => { setCopyingSecret(true); try { await navigator.clipboard?.writeText(secret); } finally { setCopyingSecret(false); } }} disabled={copyingSecret} style={{ ...styles.button }}>{copyingSecret ? <LoadingDots /> : <><Copy size={15} /> Copy</>}</button>
                    <button type="button" onClick={() => setSecret('')} style={{ ...styles.button, ...styles.mutedButton }}>Dismiss</button>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.card}>
              <div style={styles.row}>
                <p style={styles.value}>Your webhooks</p>
                <p style={styles.note}>Tap View to inspect events, delivery history and secret controls.</p>
              </div>

              {loading ? (
                <div style={{ ...styles.row, marginTop: 10, textAlign: 'center' }}><LoadingDots /></div>
              ) : !webhooks.length ? (
                <div style={{ ...styles.row, marginTop: 10 }}><p style={styles.note}>No webhooks yet. Add one when you are ready to connect an external application.</p></div>
              ) : (
                <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
                  {webhooks.map((webhook) => (
                    <article key={webhook.id} style={styles.row}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <WebhookIcon size={20} color={webhook.enabled ? theme.primary : theme.textMuted} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ ...styles.value, fontSize: '0.95rem' }}>{webhook.name}</p>
                          <p style={{ ...styles.note, marginTop: 3, overflowWrap: 'anywhere' }}>{webhook.url}</p>
                        </div>
                        <button type="button" onClick={() => {
                          const next = expandedId === webhook.id ? '' : webhook.id;
                          setExpandedId(next);
                          if (next && !deliveries[webhook.id]) void loadDeliveries(webhook.id);
                        }} style={{ flexShrink: 0, border: `1px solid ${theme.borderGlass}`, borderRadius: 999, padding: '7px 12px', background: theme.surfaceGlass, color: theme.primary, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
                          {expandedId === webhook.id ? 'Hide' : loadingDeliveryId === webhook.id ? <LoadingDots /> : 'View'}
                        </button>
                      </div>

                      {expandedId === webhook.id && (
                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <p style={styles.note}>Webhook configuration</p>
                            <span style={{ borderRadius: 999, padding: '5px 9px', fontSize: '0.7rem', fontWeight: 850, background: webhook.enabled ? theme.success : theme.surfaceGlass, color: webhook.enabled ? theme.textInverse : theme.textMuted }}>
                              {webhook.enabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                            <div><p style={styles.label}>Endpoint</p><p style={{ ...styles.value, marginTop: 5, fontSize: '0.82rem' }}>{webhook.url}</p></div>
                            <div><p style={styles.label}>Events</p><p style={{ ...styles.value, marginTop: 5, fontSize: '0.82rem' }}>{webhook.events.length}</p></div>
                          </div>

                          <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                            <p style={styles.label}>Subscribed events</p>
                            <p style={{ ...styles.note, marginTop: 6 }}>{webhook.events.join(' · ')}</p>
                          </div>

                          <div style={{ display: 'grid', gap: 8 }}>
                            <div ref={testEventMenuRef} style={{ display: 'grid', gap: 6, position: 'relative', zIndex: isTestEventMenuOpen ? 100 : 1 }}>
                              <span style={{ fontWeight: 700 }}>Test event</span>
                              <button
                                type="button"
                                style={{
                                  border: `1px solid ${theme.border}`,
                                  background: theme.surfaceMuted,
                                  color: theme.text,
                                  borderRadius: 14,
                                  padding: '10px 12px',
                                  fontSize: '0.9rem',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  cursor: 'pointer',
                                }}
                                onClick={() => setIsTestEventMenuOpen((current) => !current)}
                              >
                                <span>{testEvent}</span>
                                <ChevronDown size={17} style={{ transform: isTestEventMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                              </button>
                              {isTestEventMenuOpen ? (
                                <div style={{
                                  position: 'absolute',
                                  zIndex: 1000,
                                  top: 'calc(100% + 6px)',
                                  left: 0,
                                  right: 0,
                                  display: 'grid',
                                  gap: 6,
                                  padding: 8,
                                  borderRadius: 16,
                                  background: theme.mode === 'dark' ? 'rgba(12,12,12,0.96)' : 'rgba(238,237,232,0.97)',
                                  border: `1px solid ${theme.borderStrong}`,
                                  backdropFilter: 'blur(10px)',
                                  WebkitBackdropFilter: 'blur(10px)',
                                  maxHeight: 260,
                                  overflowY: 'auto',
                                  overscrollBehavior: 'contain',
                                  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
                                }}>
                                  {eventTypes.map((eventType) => (
                                    <button
                                      key={eventType}
                                      type="button"
                                      style={{
                                        border: `1px solid ${theme.border}`,
                                        background: testEvent === eventType ? theme.surfaceGlass : theme.surfaceGlass,
                                        color: theme.text,
                                        borderRadius: 12,
                                        padding: '10px 12px',
                                        width: '100%',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                      }}
                                      onClick={() => {
                                        setTestEvent(eventType);
                                        setIsTestEventMenuOpen(false);
                                      }}
                                    >
                                      {eventType}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                              <button type="button" onClick={() => void test(webhook.id)} disabled={actionLoading !== ''} style={{ ...styles.button, ...styles.mutedButton }}>{actionLoading === `test:${webhook.id}` ? <LoadingDots /> : <><Send size={15} /> Test</>}</button>
                              <button type="button" onClick={() => beginEdit(webhook)} style={{ ...styles.button, ...styles.mutedButton }}>Edit</button>
                              <button type="button" onClick={() => setRotateId(rotateId === webhook.id ? null : webhook.id)} disabled={rotatingId !== null} style={{ ...styles.button, ...styles.mutedButton }}><RefreshCw size={15} /> Rotate</button>
                            </div>
                            {deleteId === webhook.id ? (
                              <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, border: `1px solid ${theme.danger}`, background: theme.surfaceGlass }}>
                                <p style={{ ...styles.note, color: theme.text }}>Delete this webhook permanently? Its delivery history will also be removed.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                  <button type="button" onClick={() => setDeleteId(null)} style={{ ...styles.button, ...styles.mutedButton }}>Cancel</button>
                                  <button type="button" onClick={() => void remove(webhook.id)} disabled={deletingId === webhook.id} style={{ ...styles.button, borderRadius: 10, background: theme.danger }}>
                                    {deletingId === webhook.id ? <LoadingDots /> : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                <button type="button" onClick={() => void toggleEnabled(webhook)} disabled={actionLoading !== ''} style={{ ...styles.button, ...styles.mutedButton }}>
                                  {actionLoading === `toggle:${webhook.id}` ? <LoadingDots /> : (webhook.enabled ? 'Disable' : 'Enable')}
                                </button>
                                <button type="button" onClick={() => setDeleteId(webhook.id)} style={{ ...styles.button, ...styles.mutedButton }}>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {editingId === webhook.id && (
                            <div style={{ display: 'grid', gap: 9, padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                              <p style={styles.label}>Edit configuration</p>
                              <input minLength={2} value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Webhook name" style={styles.input} />
                              <input type="url" value={editUrl} onChange={(event) => setEditUrl(event.target.value)} placeholder="https://example.com/events" style={styles.input} />
                              <div style={{ display: 'grid', gap: 6 }}>
                                {eventTypes.map((eventType) => (
                                  <label key={eventType} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}` }}>
                                    <input type="checkbox" checked={editEvents.includes(eventType)} onChange={() => setEditEvents((current) => current.includes(eventType) ? current.filter((item) => item !== eventType) : [...current, eventType])} />
                                    <span>{eventType}</span>
                                  </label>
                                ))}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                <button type="button" onClick={() => setEditingId(null)} style={{ ...styles.button, ...styles.mutedButton }}>Cancel</button>
                                <button type="button" disabled={saving || !editName.trim() || !editUrl.trim() || !editEvents.length} onClick={() => void update(webhook.id)} style={{ ...styles.button }}>{saving ? <LoadingDots /> : 'Save changes'}</button>
                              </div>
                            </div>
                          )}

                          {rotateId === webhook.id && (
                            <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                              <p style={styles.note}>Rotating invalidates the previous secret. Your external application must be updated with the new secret.</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                <button type="button" onClick={() => setRotateId(null)} style={{ ...styles.button, ...styles.mutedButton }}>Cancel</button>
                                <button type="button" onClick={() => { setRotateId(null); void rotate(webhook.id); }} disabled={rotatingId === webhook.id} style={{ ...styles.button }}>
                                  {rotatingId === webhook.id ? <LoadingDots /> : 'Confirm rotate'}
                                </button>
                              </div>
                            </div>
                          )}

                          <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                            <p style={styles.label}>Delivery history</p>
                            {!deliveries[webhook.id] ? <div style={{ textAlign: 'center', padding: 8 }}><LoadingDots /></div> : !deliveries[webhook.id].length ? <p style={{ ...styles.note, marginTop: 6 }}>No deliveries yet.</p> : (
                              <div style={{ display: 'grid', gap: 8, marginTop: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4, overscrollBehavior: 'contain' }}>
                                {deliveries[webhook.id].map((delivery) => (
                                  <div key={delivery._id} style={{ display: 'grid', gap: 5, padding: 10, borderRadius: 10, background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}` }}>
                                    <p style={styles.value}>{delivery.eventType}</p>
                                    <p style={{ ...styles.note, overflowWrap: 'anywhere' }}>{delivery.eventId}</p>
                                    <p style={styles.note}>{delivery.status} · {delivery.attempts} attempts{delivery.responseStatus ? ` · HTTP ${delivery.responseStatus}` : ''}{delivery.responseTimeMs ? ` · ${delivery.responseTimeMs}ms` : ''}</p>
                                    {delivery.lastError && <p style={{ ...styles.note, color: theme.danger }}>{delivery.lastError}</p>}
                                    {delivery.status === 'failed' && <button type="button" onClick={() => void retry(webhook.id, delivery._id)} disabled={actionLoading !== ''} style={{ ...styles.button, ...styles.mutedButton }}>{actionLoading === `retry:${delivery._id}` ? <LoadingDots /> : 'Retry delivery'}</button>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <NowBar />
      </main>
    </HybridTheme>
  );
};

export default WebhooksPage;
