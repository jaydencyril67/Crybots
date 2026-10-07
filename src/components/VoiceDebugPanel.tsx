import React, { useEffect, useMemo, useState } from 'react';
import { Bug, ChevronDown, ChevronUp, Copy, Trash2, X } from 'lucide-react';
import { getVoiceModeEnabled, VOICE_DEBUG_EVENT, VOICE_MODE_CHANGED_EVENT } from '../utils/voiceNavigation';

export type VoiceDebugLog = {
  time: string;
  stage: string;
  message: string;
  detail?: string;
  level?: 'info' | 'success' | 'warn' | 'error';
};

type VoiceDebugDetail = VoiceDebugLog & {
  snapshot?: Record<string, unknown>;
};

const formatDetail = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const VoiceDebugPanel = () => {
  const [enabled, setEnabled] = useState(getVoiceModeEnabled);
  const [logs, setLogs] = useState<VoiceDebugLog[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const handleModeChange = () => {
      const next = getVoiceModeEnabled();
      setEnabled(next);
      if (next) setClosed(false);
    };

    const handleDebug = (event: Event) => {
      const detail = (event as CustomEvent<VoiceDebugDetail>).detail;
      if (!detail) return;
      const nextLog: VoiceDebugLog = {
        time: detail.time || new Date().toLocaleTimeString(),
        stage: detail.stage || 'VOICE',
        message: detail.message || '',
        detail: detail.detail,
        level: detail.level || 'info',
      };
      setLogs((current) => [...current, nextLog].slice(-80));
      if (detail.level === 'error') {
        setClosed(false);
        setCollapsed(false);
      }
    };

    window.addEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
    window.addEventListener(VOICE_DEBUG_EVENT, handleDebug);
    return () => {
      window.removeEventListener(VOICE_MODE_CHANGED_EVENT, handleModeChange);
      window.removeEventListener(VOICE_DEBUG_EVENT, handleDebug);
    };
  }, []);

  const copyText = useMemo(
    () => logs.map((log) => `[${log.time}] [${log.stage}] ${log.message}${log.detail ? ` — ${log.detail}` : ''}`).join('\n'),
    [logs],
  );

  if (!enabled || closed) return null;

  return (
    <section
      aria-label="Temporary voice debug panel"
      style={{
        position: 'fixed',
        left: '12px',
        right: '12px',
        bottom: '88px',
        zIndex: 1000,
        maxWidth: '720px',
        margin: '0 auto',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: '18px',
        background: 'rgba(8,14,26,0.97)',
        boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        color: '#f8fafc',
        overflow: 'hidden',
        fontFamily: '"STIX Two Text" !important',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderBottom: collapsed ? '0' : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Bug size={16} />
        <strong style={{ flex: 1, fontSize: '0.82rem', letterSpacing: '0.03em' }}>VOICE DEBUG</strong>
        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>{logs.length} events</span>
        <button type="button" onClick={() => setCollapsed((value) => !value)} title={collapsed ? 'Expand' : 'Collapse'} style={buttonStyle}>
          {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button type="button" onClick={() => setLogs([])} title="Clear logs" style={buttonStyle}>
          <Trash2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(copyText)}
          title="Copy logs"
          style={buttonStyle}
          disabled={!logs.length}
        >
          <Copy size={15} />
        </button>
        <button type="button" onClick={() => setClosed(true)} title="Close debug panel" style={buttonStyle}>
          <X size={15} />
        </button>
      </header>

      {!collapsed && (
        <div
          style={{
            maxHeight: 'min(42vh, 360px)',
            overflowY: 'auto',
            padding: '8px 10px 10px',
            fontSize: '0.68rem',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ padding: '16px 8px', opacity: 0.6 }}>
              Waiting for the voice service to start…
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={`${log.time}-${index}`}
                style={{
                  padding: '7px 8px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  lineHeight: 1.35,
                }}
              >
                <div style={{ display: 'flex', gap: '7px', alignItems: 'baseline' }}>
                  <span style={{ opacity: 0.45, flexShrink: 0 }}>{log.time}</span>
                  <strong style={{ opacity: 0.9 }}>{log.stage}</strong>
                  <span style={{ color: log.level === 'error' ? '#f87171' : log.level === 'warn' ? '#fbbf24' : log.level === 'success' ? '#86efac' : '#e2e8f0' }}>
                    {log.message}
                  </span>
                </div>
                {log.detail && (
                  <div style={{ marginTop: '3px', opacity: 0.58, overflowWrap: 'anywhere' }}>
                    {log.detail}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

const buttonStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
};

export default VoiceDebugPanel;
