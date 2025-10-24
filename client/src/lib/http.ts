// Small helper to ensure API requests use the configured external base URL
// in production (web + mobile) instead of the current origin.
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || '';

export function withBase(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (API_BASE && url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
}

export { API_BASE };
