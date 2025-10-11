import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const API_BASE = '/api/cbt';

export function useAssignedExams() {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-exams-assigned'],
    queryFn: async () => {
      const jwt = await getJWT();
      const res = await fetch(`${API_BASE}/exams/assigned`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch assigned exams');
      return (await res.json()) as { exams: any[]; total: number };
    },
  });
}

export function useAvailableSubjects(type?: string, enabled = true) {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['cbt-subjects-available', type],
    enabled: !!type && enabled,
    queryFn: async () => {
      const jwt = await getJWT();
      const res = await fetch(`${API_BASE}/subjects/available?type=${encodeURIComponent(String(type))}` , {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
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
      const jwt = await getJWT();
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      const res = await fetch(`${API_BASE}/years/available?${params.toString()}` , {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
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
      const jwt = await getJWT();
      const params = new URLSearchParams();
      if (type) params.set('type', String(type));
      if (subjectsCsv) params.set('subjects', String(subjectsCsv));
      const res = await fetch(`${API_BASE}/years/availability?${params.toString()}` , {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
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
      const res = await fetch(`${API_BASE}/exams/validate-subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
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
      const res = await fetch(`${API_BASE}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
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
      const jwt = await getJWT();
      const res = await fetch(`${API_BASE}/attempts/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
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
