import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const API_URL = '/api/cbt/exams';


export function useExams(params?: { type?: string; limit?: number | string; offset?: number; withQuestions?: boolean }) {
  const { getJWT } = useAuth();
  const queryClient = useQueryClient();

  const { type, limit, offset, withQuestions = true } = params || {};

  const { data, isLoading, error } = useQuery({
    queryKey: ['cbt-exams', type, limit, offset, withQuestions],
    queryFn: async () => {
      let url = API_URL;
      const query: string[] = [];
      if (type) query.push(`type=${encodeURIComponent(type)}`);
      if (limit !== undefined && limit !== null) query.push(`limit=${limit}`);
      if (typeof offset === 'number') query.push(`offset=${offset}`);
      if (!withQuestions) query.push(`withQuestions=false`);
      if (query.length > 0) url += `?${query.join('&')}`;
      const jwt = await getJWT();
      const response = await fetch(url, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
      return await response.json(); // { exams, total }
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
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...examData, search }),
        credentials: 'include',
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
      const response = await fetch(`${API_URL}/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...examData, search }),
        credentials: 'include',
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
      const response = await fetch(`${API_URL}/${examId}`, {
        method: 'DELETE',
        credentials: 'include',
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