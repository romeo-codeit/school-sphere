/* Temporary debug utilities for APK troubleshooting.
 * Enable by setting VITE_DEBUG_OVERLAY=true at build time.
 */

type DebugEntry = {
  ts: string;
  type: 'request' | 'response' | 'error' | 'info';
  msg: string;
  data?: any;
};

declare global {
  interface Window {
    __DEBUG_LOGS?: DebugEntry[];
    __DEBUG_STATE?: any;
  }
}

function pushLog(entry: DebugEntry) {
  const arr = (window.__DEBUG_LOGS = window.__DEBUG_LOGS || []);
  arr.push(entry);
  if (arr.length > 200) arr.shift();
  // Notify overlay
  try {
    window.dispatchEvent(new CustomEvent('debug:log', { detail: entry }));
  } catch {}
}

export function installDebugOverlay() {
  // Only install once
  if ((window as any).__DEBUG_FETCH_INSTALLED) return;
  (window as any).__DEBUG_FETCH_INSTALLED = true;

  const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
  const MODE = (import.meta as any)?.env?.MODE || (import.meta as any)?.env?.NODE_ENV || '';

  window.__DEBUG_STATE = {
    apiBase: API_BASE,
    mode: MODE,
    origin: typeof location !== 'undefined' ? location.origin : 'n/a',
    isCapacitor: !!(window as any).Capacitor,
    platform: (window as any).Capacitor?.getPlatform?.() || 'webview',
  };

  pushLog({ ts: new Date().toISOString(), type: 'info', msg: 'Debug overlay installed', data: window.__DEBUG_STATE });

  // Monkey-patch fetch to capture errors and responses
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as any)?.url || String(input);
    const start = Date.now();
    try {
      pushLog({ ts: new Date().toISOString(), type: 'request', msg: url, data: { method: init?.method || 'GET', credentials: init?.credentials, headers: Object.fromEntries(Object.entries((init?.headers as any) || {})) } });
      const res = await origFetch(input, init);
      const dur = Date.now() - start;
      if (!res.ok) {
        let text = '';
        try { text = await res.clone().text(); } catch {}
        const snippet = text.slice(0, 400);
        pushLog({ ts: new Date().toISOString(), type: 'error', msg: `HTTP ${res.status} ${res.statusText} for ${url} in ${dur}ms`, data: { url, status: res.status, statusText: res.statusText, body: snippet } });
      } else {
        pushLog({ ts: new Date().toISOString(), type: 'response', msg: `OK ${res.status} for ${url} in ${dur}ms` });
      }
      return res;
    } catch (e: any) {
      const dur = Date.now() - start;
      pushLog({ ts: new Date().toISOString(), type: 'error', msg: `Fetch failed for ${url} in ${dur}ms`, data: { error: String(e?.message || e) } });
      throw e;
    }
  };

  // Capture console logs and errors
  try {
    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    const origInfo = console.info.bind(console);

    console.log = (...args: any[]) => {
      try { pushLog({ ts: new Date().toISOString(), type: 'info', msg: '[console.log]', data: args }); } catch {}
      origLog(...args);
    };
    console.info = (...args: any[]) => {
      try { pushLog({ ts: new Date().toISOString(), type: 'info', msg: '[console.info]', data: args }); } catch {}
      origInfo(...args);
    };
    console.warn = (...args: any[]) => {
      try { pushLog({ ts: new Date().toISOString(), type: 'error', msg: '[console.warn]', data: args }); } catch {}
      origWarn(...args);
    };
    console.error = (...args: any[]) => {
      try { pushLog({ ts: new Date().toISOString(), type: 'error', msg: '[console.error]', data: args }); } catch {}
      origError(...args);
    };
  } catch {}

  // Capture global errors and unhandled promise rejections
  try {
    window.addEventListener('error', (ev: ErrorEvent) => {
      pushLog({ ts: new Date().toISOString(), type: 'error', msg: '[window.onerror]', data: { message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno } });
    });
    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      pushLog({ ts: new Date().toISOString(), type: 'error', msg: '[unhandledrejection]', data: { reason: String((ev as any)?.reason) } });
    });
  } catch {}
}

export function getDebugLogs(): DebugEntry[] {
  return window.__DEBUG_LOGS || [];
}
