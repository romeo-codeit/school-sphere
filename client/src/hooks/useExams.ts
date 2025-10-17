import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { account } from '@/lib/appwrite';

const API_URL = '/api/cbt/exams';


export function useExams(params?: { type?: string; limit?: number | string; offset?: number; withQuestions?: boolean }) {
  const { getJWT } = useAuth();
  const queryClient = useQueryClient();

  const { type, limit, offset, withQuestions = true } = params || {};

  const { data, isLoading, error } = useQuery({
    queryKey: ['cbt-exams', type, limit, offset, withQuestions],
    // Provide disk cache to avoid "loads afresh" feeling on remounts or reloads
    queryFn: async () => {
      const cacheKey = (() => {
        const t = type ?? 'all';
        const l = String(limit ?? 'default');
        const o = String(typeof offset === 'number' ? offset : 'none');
        const wq = withQuestions ? 'wq1' : 'wq0';
        return `cache:cbt:exams:${t}:${l}:${o}:${wq}`;
      })();
      let url = API_URL;
      const query: string[] = [];
      if (type) query.push(`type=${encodeURIComponent(type)}`);
      if (limit !== undefined && limit !== null) query.push(`limit=${limit}`);
      if (typeof offset === 'number') query.push(`offset=${offset}`);
      if (!withQuestions) query.push(`withQuestions=false`);
      if (query.length > 0) url += `?${query.join('&')}`;
      let jwt = await getJWT();
          let response = await fetch(url, {
            headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
            credentials: 'include',
          });
      // Auto-refresh JWT once on 401
      if (response.status === 401) {
        try {
              const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('appwrite_jwt') : null;
              if (token) {
                await fetch('/api/auth/jwt-cookie', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jwt: token }),
                  credentials: 'include',
                });
                response = await fetch(url, { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}, credentials: 'include' });
              }
        } catch {}
      }
      if (!response.ok) {
        // Fallback to cached data if available
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) return JSON.parse(cached);
        } catch {}
        throw new Error('Failed to fetch exams');
      }
      const json = await response.json(); // { exams, total }
      try { localStorage.setItem(cacheKey, JSON.stringify(json)); } catch {}
      return json;
    },
    // Keep cached for longer to avoid frequent refetches between navigations
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000,    // 60 minutes
    refetchOnWindowFocus: false,
    // Hydrate from cache immediately to reduce jank on remount, but skip for full fetches to ensure fresh data
    initialData: () => {
      if (limit === 'all') return undefined; // Force fresh fetch for full exam lists
      try {
        const t = type ?? 'all';
        const l = String(limit ?? 'default');
        const o = String(typeof offset === 'number' ? offset : 'none');
        const wq = withQuestions ? 'wq1' : 'wq0';
        const cacheKey = `cache:cbt:exams:${t}:${l}:${o}:${wq}`;
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : undefined;
      } catch { return undefined; }
    },
  });

  const useExam = (examId: string) => {
    const isPracticeExam = examId?.startsWith('practice-');
    return useQuery({
      queryKey: ['cbt-exams', examId],
      queryFn: async () => {
        if (!examId) return null;
        const jwt = await getJWT();
        // Handle URLs with query params (for practice sessions)
        const url = examId.includes('?') ? `${API_URL}/${examId}` : `${API_URL}/${examId}`;
        const response = await fetch(url, {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to fetch exam');
        }
        return await response.json();
      },
      enabled: !!examId,
      // Optimize caching for practice exams (generated on server)
      staleTime: isPracticeExam ? 5 * 60 * 1000 : 30 * 1000, // 5 minutes for practice, 30s for regular
      gcTime: isPracticeExam ? 10 * 60 * 1000 : 5 * 60 * 1000, // 10 minutes for practice, 5 minutes for regular
      refetchOnWindowFocus: !isPracticeExam, // Don't refetch practice exams on focus
      retry: (failureCount, error) => {
        // Retry up to 2 times for practice exams, 3 for regular
        const maxRetries = isPracticeExam ? 2 : 3;
        return failureCount < maxRetries;
      },
    });
  };

  const createExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      const search = [examData.title, examData.type, examData.subject, examData.createdBy]
        .filter(Boolean)
        .join(' ');
      const jwt = await getJWT();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ ...examData, search }),
      });
      if (!response.ok) {
        throw new Error('Failed to create exam');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: async ({ examId, examData }: { examId: string, examData: any }) => {
      const search = [examData.title, examData.type, examData.subject, examData.createdBy]
        .filter(Boolean)
        .join(' ');
      const jwt = await getJWT();
      const response = await fetch(`${API_URL}/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ ...examData, search }),
      });
      if (!response.ok) {
        throw new Error('Failed to update exam');
      }
      return await response.json();
    },
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', examId] });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const jwt = await getJWT();
      const response = await fetch(`${API_URL}/${examId}`, {
        method: 'DELETE',
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (!response.ok) {
        throw new Error('Failed to delete exam');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  return {
    exams: data?.exams || [],
    total: data?.total ?? 0,
    isLoading,
    error,
    useExam,
    createExam: createExamMutation.mutateAsync,
    updateExam: updateExamMutation.mutateAsync,
    deleteExam: deleteExamMutation.mutateAsync,
  };
}