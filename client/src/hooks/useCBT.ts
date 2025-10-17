import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { isOnline, queueRequest } from '@/lib/offline';
// Note: avoid calling account.createJWT() in hooks to prevent CORS issues when not authenticated

const API_BASE = '/api/cbt';

// Assigned exams feature removed

export function useAvailableExams() {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-exams-available'],
    queryFn: async () => {
      const cacheKey = 'cache:cbt:exams:available';
      try {
        let jwt = await getJWT();
        let res = await fetch(`${API_BASE}/exams/available`, {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
          credentials: 'include',
        });
        if (res.status === 401) {
          try {
            const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('appwrite_jwt') : null;
            if (token) {
              await fetch('/api/auth/jwt-cookie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: token }),
                credentials: 'include',
              });
              res = await fetch(`${API_BASE}/exams/available`, {
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
                credentials: 'include',
              });
            }
          } catch {}
        }
        if (!res.ok) throw new Error('Failed to fetch available exams');
        const data = (await res.json()) as { exams: any[]; total: number; message?: string };
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        return data;
      } catch (e) {
        try {
          const raw = localStorage.getItem(cacheKey);
          if (raw) return JSON.parse(raw);
        } catch {}
        throw e;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: () => {
      try {
        const raw = localStorage.getItem('cache:cbt:exams:available');
        return raw ? JSON.parse(raw) : undefined;
      } catch { return undefined; }
    },
  });
}

export function useAvailableSubjects(type?: string, enabled = true) {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-subjects-available', type],
    enabled: !!type && enabled,
    queryFn: async () => {
      let jwt = await getJWT();
      let res = await fetch(`${API_BASE}/subjects/available?type=${encodeURIComponent(String(type))}` , {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        credentials: 'include',
      });
      if (res.status === 401) {
        try {
          const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('appwrite_jwt') : null;
          if (token) {
            await fetch('/api/auth/jwt-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jwt: token }),
              credentials: 'include',
            });
            res = await fetch(`${API_BASE}/subjects/available?type=${encodeURIComponent(String(type))}` , {
              headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
              credentials: 'include',
            });
          }
        } catch {}
      }
      if (!res.ok) throw new Error('Failed to fetch available subjects');
      return (await res.json()) as { subjects: string[] };
    },
  });
}

export function useAvailableYears(type?: string, subjectsCsv?: string, enabled = true) {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-years-available', type, subjectsCsv],
    enabled: !!type && enabled,
    queryFn: async () => {
      let jwt = await getJWT();
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      let res = await fetch(`${API_BASE}/years/available?${params.toString()}` , {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        credentials: 'include',
      });
      if (res.status === 401) {
        try {
          const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('appwrite_jwt') : null;
          if (token) {
            await fetch('/api/auth/jwt-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jwt: token }),
              credentials: 'include',
            });
            res = await fetch(`${API_BASE}/years/available?${params.toString()}` , {
              headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
              credentials: 'include',
            });
          }
        } catch {}
      }
      if (!res.ok) throw new Error('Failed to fetch available years');
      return (await res.json()) as { years: string[] };
    },
  });
}

export function useYearAvailability(type?: string, subjectsCsv?: string, enabled = true) {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-years-availability', type, subjectsCsv],
    enabled: !!type && !!subjectsCsv && enabled,
    queryFn: async () => {
      let jwt = await getJWT();
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      let res = await fetch(`${API_BASE}/years/availability?${params.toString()}` , {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        credentials: 'include',
      });
      if (res.status === 401) {
        try {
          const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('appwrite_jwt') : null;
          if (token) {
            await fetch('/api/auth/jwt-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jwt: token }),
              credentials: 'include',
            });
            res = await fetch(`${API_BASE}/years/availability?${params.toString()}` , {
              headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
              credentials: 'include',
            });
          }
        } catch {}
      }
      if (!res.ok) throw new Error('Failed to fetch year availability');
      return (await res.json()) as { 
        availability: Array<{
          year: string;
          subjects: string[];
          availableCount: number;
          totalCount: number;
        }>
      };
    },
  });
}

export function useValidateSubjects() {
  const { getJWT } = useAuth();
  return useMutation({
    mutationFn: async (payload: { type: string; selectedSubjects: string[]; year?: string }) => {
      const jwt = await getJWT();
      const csrf = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const res = await fetch(`${API_BASE}/exams/validate-subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Subject validation failed');
      return data as { 
        ok: true; 
        availability: Record<string, number>;
        available: number;
        total: number;
        insufficient?: string[];
        message?: string;
      };
    },
  });
}

export function useStartAttempt() {
  const { getJWT } = useAuth();
  return useMutation({
    mutationFn: async (payload: { examId: string; subjects?: string[] }) => {
      const jwt = await getJWT();
      const csrf2 = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const res = await fetch(`${API_BASE}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(csrf2 ? { 'X-CSRF-Token': csrf2 } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to start attempt');
      return data;
    },
  });
}

export function useAutosaveAttempt() {
  const { getJWT } = useAuth();
  return useMutation({
    mutationFn: async (payload: { attemptId: string; answers?: Record<string, any>; timeSpent?: number }) => {
      if (!isOnline()) {
        await queueRequest({
          url: `${API_BASE}/attempts/autosave`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return { ok: true, attempt: null } as any;
      }
      const jwt = await getJWT();
      const csrf3 = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const res = await fetch(`${API_BASE}/attempts/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(csrf3 ? { 'X-CSRF-Token': csrf3 } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to autosave');
      return data as { ok: true; attempt: any };
    },
  });
}

export function useAttemptResults(attemptId?: string) {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-attempt-results', attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      const jwt = await getJWT();
      const res = await fetch(`${API_BASE}/attempts/${attemptId}/results`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch results');
      return data as { summary: { total: number; correct: number; score: number; percent: number }; perQuestion: any[] };
    },
  });
}
