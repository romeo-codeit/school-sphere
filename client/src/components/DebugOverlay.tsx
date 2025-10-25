import React, { useEffect, useState } from 'react';
import { getDebugLogs } from '@/lib/debug';
import { API_BASE } from '@/lib/http';

export const DebugOverlay: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [logs, setLogs] = useState(getDebugLogs());

  useEffect(() => {
    const onLog = () => setLogs(getDebugLogs().slice().reverse());
    window.addEventListener('debug:log', onLog);
    const iv = setInterval(onLog, 1500);
    return () => { window.removeEventListener('debug:log', onLog); clearInterval(iv); };
  }, []);

  if (!open) return null;

  const state = (window as any).__DEBUG_STATE || {};
  const cookieSnippet = typeof document !== 'undefined' ? (document.cookie || '').slice(0, 200) : '';

  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 99999, width: '92%', maxWidth: 600 }}>
      <div style={{ background: 'rgba(0,0,0,0.85)', color: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 12, lineHeight: 1.35, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Debug Overlay (temporary)</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setOpen(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '4px 8px', borderRadius: 4 }}>Hide</button>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div>API_BASE: <code>{API_BASE}</code></div>
          <div>Mode: <code>{String(state.mode || '')}</code></div>
          <div>Origin: <code>{String(state.origin || '')}</code></div>
          <div>Capacitor: <code>{String(state.isCapacitor)}</code> Platform: <code>{String(state.platform || '')}</code></div>
          <div>Cookies: <code>{cookieSnippet || '(none or HttpOnly only)'}</code></div>
        </div>
        <div style={{ marginTop: 8, maxHeight: 220, overflow: 'auto', background: '#0f172a', padding: 8, borderRadius: 6 }}>
          {logs.length === 0 ? <div>No logs yet...</div> : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {logs.slice(0, 50).map((l, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <div><strong>{l.type.toUpperCase()}</strong> <span style={{ opacity: 0.7 }}>{l.ts}</span></div>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.msg}</div>
                  {l.data ? <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{JSON.stringify(l.data, null, 2)}</pre> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>Note: remove VITE_DEBUG_OVERLAY=true and rebuild to disable.</div>
      </div>
    </div>
  );
};

export default DebugOverlay;
