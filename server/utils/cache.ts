import { logInfo } from '../logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new SimpleCache();

// Cache key generators
export const cacheKeys = {
  exams: (filters?: any) => `exams:${JSON.stringify(filters || {})}`,
  // bump subjects cache key version to invalidate old shape
  subjects: (type: string) => `subjects:v2:${type}`,
  years: (type: string, subjects: string[]) => `years:${type}:${subjects.sort().join(',')}`,
  analytics: (classId: string) => `analytics:${classId}`,
  userProfile: (userId: string) => `user:${userId}`,
  examDetail: (examId: string) => `examDetail:${examId}`,
  questionsByExam: (examId: string) => `questionsByExam:${examId}`,
  availableExams: () => `availableExams`,
  practiceQuestions: (type: string, subjects: string[], year?: string, paperType?: string) =>
    `practiceQuestions:${type}:${(paperType||'any')}:${(year||'any')}:${[...subjects].sort().join(',')}`,
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  EXAMS: 10 * 60 * 1000, // 10 minutes
  SUBJECTS: 30 * 60 * 1000, // 30 minutes
  YEARS: 30 * 60 * 1000, // 30 minutes
  ANALYTICS: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE: 2 * 60 * 1000, // 2 minutes
  EXAM_DETAIL: 5 * 60 * 1000, // 5 minutes
  QUESTIONS: 5 * 60 * 1000, // 5 minutes
  AVAILABLE_EXAMS: 10 * 60 * 1000, // 10 minutes
  PRACTICE_QUESTIONS: 2 * 60 * 1000, // 2 minutes
} as const;