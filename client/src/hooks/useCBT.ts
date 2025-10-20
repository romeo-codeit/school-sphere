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

export function useAvailableSubjects(type?: string, paperType?: 'objective' | 'theory' | 'obj', enabled = true) {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-subjects-available', type, paperType],
    enabled: !!type && enabled,
    queryFn: async () => {
      const pt = paperType === 'objective' ? 'obj' : paperType;
      let jwt = await getJWT();
      const url = `${API_BASE}/subjects/available?type=${encodeURIComponent(String(type))}${pt ? `&paperType=${encodeURIComponent(pt)}` : ''}`;
      
      try {
        let res = await fetch(url, {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
          credentials: 'include',
        });
        
        if (res.status === 401) {
          // Try to refresh JWT and retry
          try {
            const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('appwrite_jwt') : null;
            if (token) {
              await fetch('/api/auth/jwt-cookie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: token }),
                credentials: 'include',
              });
              res = await fetch(url, {
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
                credentials: 'include',
              });
            }
          } catch (refreshError) {
            console.warn('Failed to refresh JWT, continuing without auth', refreshError);
          }
        }
        
        if (!res.ok) {
          // Return empty result instead of throwing error
          console.warn(`Failed to fetch subjects: ${res.status} ${res.statusText}`);
          return { subjects: [] };
        }
        
        return (await res.json()) as { subjects: string[] };
      } catch (error) {
        console.warn('Error fetching subjects, returning empty result', error);
        return { subjects: [] };
      }
    },
  });
}

export function useAvailableYears(type?: string, subjectsCsv?: string, enabled = true, paperType?: 'objective' | 'theory' | 'obj') {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-years-available', type, subjectsCsv, paperType],
    enabled: !!type && enabled,
    queryFn: async () => {
      let jwt = await getJWT();
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      if (paperType) params.set('paperType', paperType === 'objective' ? 'obj' : paperType);
      
      try {
        let res = await fetch(`${API_BASE}/years/available?${params.toString()}`, {
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
              res = await fetch(`${API_BASE}/years/available?${params.toString()}`, {
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
                credentials: 'include',
              });
            }
          } catch (refreshError) {
            console.warn('Failed to refresh JWT, continuing without auth', refreshError);
          }
        }
        
        if (!res.ok) {
          console.warn(`Failed to fetch years: ${res.status} ${res.statusText}`);
          return { years: [] };
        }
        
        return (await res.json()) as { years: string[] };
      } catch (error) {
        console.warn('Error fetching years, returning empty result', error);
        return { years: [] };
      }
    },
  });
}

export function useYearAvailability(type?: string, subjectsCsv?: string, enabled = true, paperType?: 'objective' | 'theory' | 'obj') {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-years-availability', type, subjectsCsv, paperType],
    enabled: !!type && !!subjectsCsv && enabled,
    queryFn: async () => {
      let jwt = await getJWT();
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      if (paperType) params.set('paperType', paperType === 'objective' ? 'obj' : paperType);
      
      try {
        let res = await fetch(`${API_BASE}/years/availability?${params.toString()}`, {
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
              res = await fetch(`${API_BASE}/years/availability?${params.toString()}`, {
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
                credentials: 'include',
              });
            }
          } catch (refreshError) {
            console.warn('Failed to refresh JWT, continuing without auth', refreshError);
          }
        }
        
        if (!res.ok) {
          console.warn(`Failed to fetch year availability: ${res.status} ${res.statusText}`);
          return { availability: [] };
        }
        
        return (await res.json()) as { 
          availability: Array<{
            year: string;
            subjects: string[];
            availableCount: number;
            totalCount: number;
          }>
        };
      } catch (error) {
        console.warn('Error fetching year availability, returning empty result', error);
        return { availability: [] };
      }
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
    mutationFn: async (payload: { examId: string; subjects?: string[]; year?: string; paperType?: string }) => {
      const jwt = await getJWT();
      const csrf2 = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      
      try {
        const res = await fetch(`${API_BASE}/attempts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
            ...(csrf2 ? { 'X-CSRF-Token': csrf2 } : {}),
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        
        if (res.status === 401) {
          // Try to refresh JWT and retry
          try {
            const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('appwrite_jwt') : null;
            if (token) {
              await fetch('/api/auth/jwt-cookie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: token }),
                credentials: 'include',
              });
              const retryRes = await fetch(`${API_BASE}/attempts`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
                  ...(csrf2 ? { 'X-CSRF-Token': csrf2 } : {}),
                },
                body: JSON.stringify(payload),
                credentials: 'include',
              });
              const retryData = await retryRes.json();
              if (!retryRes.ok) throw new Error(retryData?.message || 'Failed to start attempt');
              return retryData;
            }
          } catch (refreshError) {
            console.warn('Failed to refresh JWT for attempt start', refreshError);
          }
        }
        
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to start attempt');
        return data;
      } catch (error) {
        console.error('Error starting attempt:', error);
        throw error;
      }
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
