// Offline file upload queue using IndexedDB
const FILE_QUEUE_KEY = 'offline:fileQueue:v1';

export type QueuedFileUpload = {
  id: string;
  fileName: string;
  fileType: string;
  fileData: string; // base64 string
  resourceData: any; // metadata for resource
  createdAt: number;
  attempts: number;
};

function loadFileQueue(): QueuedFileUpload[] {
  try {
    const raw = localStorage.getItem(FILE_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedFileUpload[]) : [];
  } catch {
    return [];
  }
}

function saveFileQueue(q: QueuedFileUpload[]) {
  try {
    localStorage.setItem(FILE_QUEUE_KEY, JSON.stringify(q));
  } catch {}
}

export async function queueFileUpload(file: File, resourceData: any) {
  // Convert file to base64
  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const fileData = await toBase64(file);
  const queue = loadFileQueue();
  const item: QueuedFileUpload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fileName: file.name,
    fileType: file.type,
    fileData,
    resourceData,
    createdAt: Date.now(),
    attempts: 0,
  };
  queue.push(item);
  saveFileQueue(queue);
  return item.id;
}

export async function processFileQueueOnce(storage: any, databases: any, bucketId: string, databaseId: string, resourcesCollectionId: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  let queue = loadFileQueue();
  const next: QueuedFileUpload[] = [];
  for (const item of queue) {
    try {
      // Upload file to Appwrite Storage
      const fileBlob = await (async () => {
        // Convert base64 to Blob
        const arr = item.fileData.split(',');
  const m = arr[0].match(/:(.*?);/);
  const mime = m ? m[1] : (item.fileType || 'application/octet-stream');
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
      })();
      const uploadedFile = await storage.createFile(bucketId, item.id, fileBlob);
      // Create resource document with fileId
      const resourceDoc = await databases.createDocument(databaseId, resourcesCollectionId, item.id, {
        ...item.resourceData,
        fileId: uploadedFile.$id,
      });
      // success: do nothing (removed)
    } catch (e) {
      item.attempts += 1;
      next.push(item);
    }
  }
  saveFileQueue(next);
}
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

// Exam autosave/submit queue processor (uses idbCache queue)
import { getQueue as getIDBQueue, removeFromQueue as removeFromIDBQueue } from '@/lib/idbCache';
export async function processExamQueueOnce() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    const q = await getIDBQueue();
    for (const item of q) {
      try {
        if (item.type === 'autosave') {
          const base = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
          await fetch(base + '/api/cbt/attempts/autosave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
            credentials: 'include',
          });
        } else if (item.type === 'submit') {
          const { attemptId, answers } = item.payload || {};
          const base = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
          await fetch(base + `/api/cbt/attempts/${encodeURIComponent(attemptId)}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
            credentials: 'include',
          });
        }
        await removeFromIDBQueue(item.id);
      } catch {
        // keep for next round
      }
    }
  } catch {}
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
