import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { isOnline, queueRequest } from '@/lib/offline';
import { apiRequest } from '@/lib/queryClient';
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
        const res = await apiRequest('GET', `${API_BASE}/exams/available`);
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
      const url = `${API_BASE}/subjects/available?type=${encodeURIComponent(String(type))}${pt ? `&paperType=${encodeURIComponent(pt)}` : ''}`;
      
      try {
        const res = await apiRequest('GET', url);
        return (await res.json()) as { subjects: string[] };
      } catch (error) {
        console.warn('Error fetching subjects, returning empty result', error);
        return { subjects: [] };
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAvailableYears(type?: string, subjectsCsv?: string, enabled = true, paperType?: 'objective' | 'theory' | 'obj') {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-years-available', type, subjectsCsv, paperType],
    enabled: !!type && enabled,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      if (paperType) params.set('paperType', paperType === 'objective' ? 'obj' : paperType);
      
      try {
        const res = await apiRequest('GET', `${API_BASE}/years/available?${params.toString()}`);
        return (await res.json()) as { years: string[] };
      } catch (error) {
        console.warn('Error fetching years, returning empty result', error);
        return { years: [] };
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useYearAvailability(type?: string, subjectsCsv?: string, enabled = true, paperType?: 'objective' | 'theory' | 'obj') {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-years-availability', type, subjectsCsv, paperType],
    enabled: !!type && !!subjectsCsv && enabled,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      if (paperType) params.set('paperType', paperType === 'objective' ? 'obj' : paperType);
      
      try {
        const res = await apiRequest('GET', `${API_BASE}/years/availability?${params.toString()}`);
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
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useValidateSubjects() {
  const { getJWT } = useAuth();
  return useMutation({
    mutationFn: async (payload: { type: string; selectedSubjects: string[]; year?: string }) => {
      const res = await apiRequest('POST', `${API_BASE}/exams/validate-subjects`, payload);
      const data = await res.json();
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
      try {
        const res = await apiRequest('POST', `${API_BASE}/attempts`, payload);
        const data = await res.json();
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
      const res = await apiRequest('POST', `${API_BASE}/attempts/autosave`, payload);
      const data = await res.json();
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
      const res = await apiRequest('GET', `${API_BASE}/attempts/${attemptId}/results`);
      const data = await res.json();
      return data as { summary: { total: number; correct: number; score: number; percent: number }; perQuestion: any[] };
    },
  });
}
