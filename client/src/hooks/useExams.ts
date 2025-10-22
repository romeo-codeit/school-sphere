import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getExam, setExam, getMeta, setMeta } from '@/lib/idbCache';
import { apiRequest } from '@/lib/queryClient';

const API_URL = '/api/cbt/exams';


export function useExams(params?: { type?: string; limit?: number | string; offset?: number; withQuestions?: boolean }) {
  const queryClient = useQueryClient();

  const { type, limit, offset, withQuestions = true } = params || {};

  const { data, isLoading, error } = useQuery({
    queryKey: ['cbt-exams', type, limit, offset, withQuestions],
    queryFn: async () => {
      const SCHEMA_VERSION = 1;
      const meta = await getMeta('exams_version');
      if (meta !== SCHEMA_VERSION) {
        await setMeta('exams_version', SCHEMA_VERSION);
        // Optionally clear old cache here if needed
      }
      const cacheKey = (() => {
        const t = type ?? 'all';
        const l = String(limit ?? 'default');
        const o = String(typeof offset === 'number' ? offset : 'none');
        const wq = withQuestions ? 'wq1' : 'wq0';
        return `cbt:exams:${t}:${l}:${o}:${wq}`;
      })();
      let url = API_URL;
      const query: string[] = [];
      if (type) query.push(`type=${encodeURIComponent(type)}`);
      if (limit !== undefined && limit !== null) query.push(`limit=${limit}`);
      if (typeof offset === 'number') query.push(`offset=${offset}`);
      if (!withQuestions) query.push(`withQuestions=false`);
      if (query.length > 0) url += `?${query.join('&')}`;
      console.debug('[useExams] fetching', url);
      let response: Response;
      try {
        response = await apiRequest('GET', url);
      } catch (err: any) {
        console.debug('[useExams] response not ok', err?.message);
        // Fallback to cached data if available
        const cached = await getExam(cacheKey);
        if (cached) return cached;
        throw new Error('Failed to fetch exams');
      }
      const json = await response.json();
  console.debug('[useExams] fetched exams json', json);
      await setExam(cacheKey, json);
      return json;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    // No synchronous initialData: we hydrate asynchronously from IndexedDB below
  });

  // Hydrate query cache from IndexedDB asynchronously (initialData can't be async)
  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      if (limit === 'all') return;
      const SCHEMA_VERSION = 1;
      const meta = await getMeta('exams_version');
      if (meta !== SCHEMA_VERSION) return;
      const t = type ?? 'all';
      const l = String(limit ?? 'default');
      const o = String(typeof offset === 'number' ? offset : 'none');
      const wq = withQuestions ? 'wq1' : 'wq0';
      const cacheKey = `cbt:exams:${t}:${l}:${o}:${wq}`;
      const cached = await getExam(cacheKey);
      if (mounted && cached) {
        // Populate React Query cache so consumers see data immediately
        (queryClient as any).setQueryData(['cbt-exams', type, limit, offset, withQuestions], cached);
      }
    };
    hydrate();
    return () => { mounted = false; };
  }, [type, limit, offset, withQuestions]);

  const useExam = (examId: string) => {
    // examId may include query params (e.g. practice-jamb?subjects=...)
    const baseExamId = String(examId || '').split('?')[0] || '';
    const isPracticeExam = baseExamId.startsWith('practice-');

    const storageKey = `cbt:exam:${encodeURIComponent(String(examId || ''))}`;
    const SCHEMA_VERSION = 1;
    const readFromIDB = async () => {
      const meta = await getMeta('exam_version');
      if (meta !== SCHEMA_VERSION) return undefined;
      return await getExam(storageKey);
    };
    const writeToIDB = async (data: any) => {
      await setMeta('exam_version', SCHEMA_VERSION);
      await setExam(storageKey, data);
    };

    return useQuery({
      queryKey: ['cbt-exams', examId],
      queryFn: async () => {
        if (!examId) return null;
        const url = `${API_URL}/${examId}`;
        console.debug('[useExam] fetching', url);
        let response: Response;
        try {
          response = await apiRequest('GET', url);
        } catch (err: any) {
          console.debug('[useExam] response not ok', err?.message);
          const cached = await readFromIDB();
          if (cached) return cached;
          throw new Error('Failed to fetch exam');
        }
        const json = await response.json();
  console.debug('[useExam] fetched exam json', json);
        await writeToIDB(json);
        return json;
      },
      enabled: !!examId,
      // initialData is async and handled by hydration effect below
      staleTime: isPracticeExam ? 5 * 60 * 1000 : 10 * 60 * 1000,
      gcTime: isPracticeExam ? 10 * 60 * 1000 : 30 * 60 * 1000,
      refetchOnWindowFocus: !isPracticeExam,
      retry: (failureCount) => {
        const maxRetries = isPracticeExam ? 2 : 3;
        return failureCount < maxRetries;
      },
    });

    // Hydrate individual exam cache from IndexedDB asynchronously
    useEffect(() => {
      let mounted = true;
      const hydrate = async () => {
        const cached = await readFromIDB();
        if (mounted && cached) {
          (queryClient as any).setQueryData(['cbt-exams', examId], cached);
        }
      };
      hydrate();
      return () => { mounted = false; };
    }, [examId]);
  };

  const createExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      const search = [examData.title, examData.type, examData.subject, examData.createdBy]
        .filter(Boolean)
        .join(' ');
      const response = await apiRequest('POST', API_URL, { ...examData, search });
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
      const response = await apiRequest('PUT', `${API_URL}/${examId}`, { ...examData, search });
      return await response.json();
    },
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', examId] });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest('DELETE', `${API_URL}/${examId}`);
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