// Helper to build absolute API URLs when a base is explicitly provided via env.
// For unified deployment on Render (frontend + backend under one URL),
// leave API_BASE empty so requests stay same-origin (relative 
// /api/... paths will hit the Express server directly).
const ENV_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
const API_BASE = ENV_BASE; // no hardcoded fallback in production; unified deploy prefers same-origin

export function withBase(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (API_BASE && url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
}

export { API_BASE };
