import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';
import { addToQueue, getAnswers as idbGetAnswers, setAnswers as idbSetAnswers } from '@/lib/idbCache';

const API_URL = '/api/cbt/attempts';

export function useExamAttempts(studentId?: string) {
  const { getJWT, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all attempts for the current user (or specified student for admin/teacher)
  const { data: examAttempts, isLoading, error } = useQuery({
    queryKey: ['examAttempts', studentId],
    queryFn: async () => {
      let url = API_URL;
      if (studentId) {
        url += `?studentId=${studentId}`;
      }
      const res = await apiRequest('GET', url);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const preview = (await res.text()).slice(0, 80);
        throw new Error(`Unexpected response (not JSON): ${preview}`);
      }
      return await res.json();
    },
    enabled: !!isAuthenticated,
  });

  // Start a new exam attempt
  const startAttemptMutation = useMutation({
    mutationFn: async (examId: string) => {
      try {
        const res = await apiRequest('POST', API_URL, { examId });
        return await res.json();
      } catch (e) {
        // Offline: create a synthetic attempt id for local storage
        const attempt = { $id: `offline-${Date.now()}`, examId, status: 'in_progress', answers: '{}' };
        await idbSetAnswers(attempt.$id, {});
        return attempt;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examAttempts'] });
    },
  });

  // Submit an exam attempt
  const submitAttemptMutation = useMutation({
    mutationFn: async ({ attemptId, answers }: { attemptId: string; answers: any }) => {
      try {
        const res = await apiRequest('POST', `${API_URL}/${attemptId}/submit`, { answers });
        await idbSetAnswers(attemptId, null);
        return await res.json();
      } catch (e) {
        // Queue submit for later
        await addToQueue('submit', { attemptId, answers });
        await idbSetAnswers(attemptId, answers);
        return { offline: true, attemptId } as any;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examAttempts'] });
    },
  });

  return {
    examAttempts,
    isLoading,
    error,
    startAttempt: startAttemptMutation.mutateAsync,
    submitAttempt: submitAttemptMutation.mutateAsync,
  };
}