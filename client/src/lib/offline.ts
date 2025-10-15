// Lightweight offline support: network status + queued HTTP requests

export type QueuedRequest = {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  createdAt: number;
  attempts: number;
};

const STORAGE_KEY = 'offline:queue:v1';
const APPWRITE_STORAGE_KEY = 'offline:appwriteQueue:v1';

// Appwrite operation queue (runs via SDK when back online)
export type AppwriteOp = {
  id: string;
  op: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: any;
  createdAt: number;
  attempts: number;
};

function loadQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
  } catch {}
}

function loadAppwriteQueue(): AppwriteOp[] {
  try {
    const raw = localStorage.getItem(APPWRITE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppwriteOp[]) : [];
  } catch {
    return [];
  }
}

function saveAppwriteQueue(q: AppwriteOp[]) {
  try {
    localStorage.setItem(APPWRITE_STORAGE_KEY, JSON.stringify(q));
  } catch {}
}

export function getQueueLength() {
  return loadQueue().length + loadAppwriteQueue().length;
}

export async function queueRequest(req: Omit<QueuedRequest, 'id' | 'createdAt' | 'attempts'>) {
  const queue = loadQueue();
  const item: QueuedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    attempts: 0,
    ...req,
  };
  queue.push(item);
  saveQueue(queue);
  return item.id;
}

// Exponential backoff helper
function backoffDelay(attempt: number) {
  const base = 1000; // 1s
  const max = 15000; // 15s
  return Math.min(max, base * Math.pow(2, attempt));
}

let processing = false;
let authHeaderProvider: (() => Promise<Record<string, string>>) | null = null;

export function configureAuthHeaderProvider(provider: () => Promise<Record<string, string>>) {
  authHeaderProvider = provider;
}

export async function processQueueOnce() {
  if (processing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  processing = true;
  try {
    let queue = loadQueue();
    const next: QueuedRequest[] = [];
    for (const item of queue) {
      try {
        const extraHeaders = authHeaderProvider ? await authHeaderProvider() : {};
        const res = await fetch(item.url, {
          method: item.method,
          headers: { ...(item.headers || {}), ...(extraHeaders || {}) },
          body: item.body,
        });
        if (!res.ok) {
          // Keep if server rejected with 5xx or network-like errors; drop on 4xx
          if (res.status >= 500) {
            item.attempts += 1;
            next.push(item);
          }
          // else drop 4xx to avoid stuck queue
        }
        // success: do nothing (removed)
      } catch {
        // Network error, keep and increase attempts
        item.attempts += 1;
        next.push(item);
      }
    }
    saveQueue(next);
    // If still items and online, schedule a retry with backoff (based on max attempts)
    if (next.length && (typeof navigator === 'undefined' || navigator.onLine)) {
      const maxAttempts = Math.max(0, ...next.map(i => i.attempts));
      const delay = backoffDelay(maxAttempts);
      setTimeout(() => {
        processQueueOnce().catch(() => {});
      }, delay);
    }
  } finally {
    processing = false;
  }
}

// Appwrite queue helpers
import { databases, ID } from '@/lib/appwrite';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;

export async function queueAppwriteOperation(op: Omit<AppwriteOp, 'id' | 'createdAt' | 'attempts'>) {
  const queue = loadAppwriteQueue();
  const item: AppwriteOp = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    attempts: 0,
    ...op,
  };
  queue.push(item);
  saveAppwriteQueue(queue);
  return item.id;
}

let processingAppwrite = false;
export async function processAppwriteQueueOnce() {
  if (processingAppwrite) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  processingAppwrite = true;
  try {
    let queue = loadAppwriteQueue();
    const next: AppwriteOp[] = [];
    for (const item of queue) {
      try {
        if (item.op === 'create') {
          await databases.createDocument(DATABASE_ID, item.collection, ID.unique(), item.data);
        } else if (item.op === 'update' && item.docId) {
          await databases.updateDocument(DATABASE_ID, item.collection, item.docId, item.data);
        } else if (item.op === 'delete' && item.docId) {
          await databases.deleteDocument(DATABASE_ID, item.collection, item.docId);
        }
        // success: drop
      } catch (e: any) {
        // Keep only on retryable errors (naively retry all for now)
        item.attempts += 1;
        next.push(item);
      }
    }
    saveAppwriteQueue(next);
    if (next.length && (typeof navigator === 'undefined' || navigator.onLine)) {
      const maxAttempts = Math.max(0, ...next.map(i => i.attempts));
      const delay = backoffDelay(maxAttempts);
      setTimeout(() => { processAppwriteQueueOnce().catch(() => {}); }, delay);
    }
  } finally {
    processingAppwrite = false;
  }
}

// Hook-like utilities
export function onNetworkChange(cb: (online: boolean) => void) {
  const handler = () => cb(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
