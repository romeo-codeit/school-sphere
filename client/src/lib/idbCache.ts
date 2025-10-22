// IndexedDB cache for exam data, answers, and sync queue
// Uses idb-keyval for simplicity (or fallback to a minimal wrapper if not installed)

import { openDB, DBSchema } from 'idb';

const DB_NAME = 'schoolSphereExamCache';
const DB_VERSION = 1;
const EXAM_STORE = 'exams';
const ANSWER_STORE = 'answers';
const QUEUE_STORE = 'syncQueue';
const META_STORE = 'meta';

interface ExamCacheDB extends DBSchema {
  exams: {
    key: string; // examId or examUrl
    value: any;
  };
  answers: {
    key: string; // attemptId or examId
    value: any;
  };
  syncQueue: {
    key: number;
    value: { id: number; type: 'autosave'|'submit'; payload: any; created: number };
  };
  meta: {
    key: string;
    value: any;
  };
}

export async function getDB() {
  return openDB<ExamCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(EXAM_STORE)) db.createObjectStore(EXAM_STORE);
      if (!db.objectStoreNames.contains(ANSWER_STORE)) db.createObjectStore(ANSWER_STORE);
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
    },
  });
}

export async function getExam(key: string) {
  const db = await getDB();
  return db.get(EXAM_STORE, key);
}
export async function setExam(key: string, value: any) {
  const db = await getDB();
  return db.put(EXAM_STORE, value, key);
}
export async function getAnswers(key: string) {
  const db = await getDB();
  return db.get(ANSWER_STORE, key);
}
export async function setAnswers(key: string, value: any) {
  const db = await getDB();
  if (value === null) {
    return db.delete(ANSWER_STORE, key);
  }
  return db.put(ANSWER_STORE, value, key);
}
export async function addToQueue(type: 'autosave'|'submit', payload: any) {
  const db = await getDB();
  const id = Date.now() + Math.floor(Math.random()*1000);
  await db.add(QUEUE_STORE, { id, type, payload, created: Date.now() });
  return id;
}
export async function getQueue() {
  const db = await getDB();
  return db.getAll(QUEUE_STORE);
}
export async function removeFromQueue(id: number) {
  const db = await getDB();
  return db.delete(QUEUE_STORE, id);
}
export async function clearQueue() {
  const db = await getDB();
  return db.clear(QUEUE_STORE);
}
export async function getMeta(key: string) {
  const db = await getDB();
  return db.get(META_STORE, key);
}
export async function setMeta(key: string, value: any) {
  const db = await getDB();
  return db.put(META_STORE, value, key);
}
