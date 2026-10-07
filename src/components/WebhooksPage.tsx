import React, { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Globe, KeyRound, Plus, RefreshCw, Send, Webhook as WebhookIcon } from 'lucide-react';
import api from '../api/axios';
import HybridTheme, { HYBRID_THEME_TOKENS } from './HybridTheme';
import LoadingDots from './LoadingDots';
import InlineLoadingDots from './InlineLoadingDots';
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

  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', overflowX: 'hidden', background: theme.background, color: theme.text, paddingBottom: '90px' },
    shell: { width: '100%', maxWidth: '920px', margin: '0 auto', padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px) 28px', boxSizing: 'border-box' },
    content: { display: 'grid', gap: 14, marginTop: 14 },
    back: { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${theme.borderGlass}`, borderRadius: 10, padding: '7px 10px', background: theme.surfaceGlass, color: theme.text, cursor: 'pointer', fontSize: '0.84rem' },
    card: { padding: 10, borderRadius: 16, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass },
    row: { display: 'grid', gap: 10, width: '100%', padding: '13px 14px', borderRadius: 15, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceMuted, boxSizing: 'border-box', minWidth: 0 },
    label: { margin: 0, color: theme.textMuted, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 7 },
    value: { margin: 0, color: theme.text, fontSize: '0.94rem', fontWeight: 800, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' },
    note: { margin: 0, color: theme.textMuted, fontSize: '0.82rem', lineHeight: 1.4 },
    input: { width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, padding: '10px 12px', outline: 'none', fontSize: '0.9rem', font: 'inherit' },
    button: { border: 'none', borderRadius: 999, padding: '11px 16px', fontWeight: 700, cursor: 'pointer', width: '100%', minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: theme.primary, color: theme.textInverse, fontSize: '0.88rem', font: 'inherit' },
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
    try {
      const response = await api.get<{ deliveries: Delivery[] }>(`/api/developer/webhooks/${id}/deliveries?limit=50`);
      setDeliveries((current) => ({ ...current, [id]: response.data.deliveries }));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load delivery history.');
    }
  };

  const test = async (id: string) => {
    setError('');
    try {
      await api.post(`/api/developer/webhooks/${id}/test`, { eventType: 'account.updated' });
      setMessage('Test delivery sent.');
      await loadDeliveries(id);
      setExpandedId(id);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to send test delivery.');
    }
  };

  const retry = async (id: string, deliveryId: string) => {
    setError('');
    try {
      await api.post(`/api/developer/webhooks/${id}/deliveries/${deliveryId}/retry`);
      setMessage('Delivery retry requested.');
      await loadDeliveries(id);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to retry delivery.');
    }
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
                    <p style={styles.note}>Receive KingsHall events in your external application.</p>
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
                    <button type="button" onClick={() => setShowCreate(false)} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Cancel</button>
                    <button disabled={saving || !events.length} style={{ ...styles.button, borderRadius: 10 }}>{saving ? <InlineLoadingDots /> : 'Create webhook'}</button>
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
                    <button type="button" onClick={() => void navigator.clipboard?.writeText(secret)} style={{ ...styles.button, borderRadius: 10 }}><Copy size={15} /> Copy</button>
                    <button type="button" onClick={() => setSecret('')} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Dismiss</button>
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
                          {expandedId === webhook.id ? 'Hide' : 'View'}
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

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                            <button type="button" onClick={() => void test(webhook.id)} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}><Send size={15} /> Send test</button>
                            <button type="button" onClick={() => setRotateId(rotateId === webhook.id ? null : webhook.id)} disabled={rotatingId !== null} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}><RefreshCw size={15} /> Rotate secret</button>
                          </div>

                          {rotateId === webhook.id && (
                            <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                              <p style={styles.note}>Rotating invalidates the previous secret. Your external application must be updated with the new secret.</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                <button type="button" onClick={() => setRotateId(null)} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Cancel</button>
                                <button type="button" onClick={() => { setRotateId(null); void rotate(webhook.id); }} disabled={rotatingId === webhook.id} style={{ ...styles.button, borderRadius: 10 }}>
                                  {rotatingId === webhook.id ? <InlineLoadingDots /> : 'Confirm rotate'}
                                </button>
                              </div>
                            </div>
                          )}

                          <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${theme.borderGlass}`, background: theme.surfaceGlass }}>
                            <p style={styles.label}>Delivery history</p>
                            {!deliveries[webhook.id] ? <div style={{ textAlign: 'center', padding: 8 }}><LoadingDots /></div> : !deliveries[webhook.id].length ? <p style={{ ...styles.note, marginTop: 6 }}>No deliveries yet.</p> : (
                              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                                {deliveries[webhook.id].map((delivery) => (
                                  <div key={delivery._id} style={{ display: 'grid', gap: 5, padding: 10, borderRadius: 10, background: theme.surfaceGlass, border: `1px solid ${theme.borderGlass}` }}>
                                    <p style={styles.value}>{delivery.eventType}</p>
                                    <p style={{ ...styles.note, overflowWrap: 'anywhere' }}>{delivery.eventId}</p>
                                    <p style={styles.note}>{delivery.status} · {delivery.attempts} attempts{delivery.responseStatus ? ` · HTTP ${delivery.responseStatus}` : ''}{delivery.responseTimeMs ? ` · ${delivery.responseTimeMs}ms` : ''}</p>
                                    {delivery.lastError && <p style={{ ...styles.note, color: theme.danger }}>{delivery.lastError}</p>}
                                    {delivery.status === 'failed' && <button type="button" onClick={() => void retry(webhook.id, delivery._id)} style={{ ...styles.button, ...styles.mutedButton, borderRadius: 10 }}>Retry delivery</button>}
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
