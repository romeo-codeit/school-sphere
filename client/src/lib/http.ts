// Small helper to ensure API requests use the configured external base URL
// in production (web + mobile) instead of the current origin.
// Fallback: if no env is injected at build time (e.g., a misbuilt APK),
// use the known Render API base to avoid blank base URLs in native.
const DEFAULT_PROD_API = 'https://ohmanfoundations.onrender.com';
const ENV_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
const MODE = (import.meta as any)?.env?.MODE || (import.meta as any)?.env?.NODE_ENV || '';
const isProdLike = String(MODE).toLowerCase() === 'production';
const API_BASE = ENV_BASE || (isProdLike ? DEFAULT_PROD_API : '');

export function withBase(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (API_BASE && url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
}

export { API_BASE };
