import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const API_URL = '/api/cbt/attempts';

export function useExamAttempts(studentId?: string) {
  const { getJWT } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all attempts for the current user (or specified student for admin/teacher)
  const { data: examAttempts, isLoading, error } = useQuery({
    queryKey: ['examAttempts', studentId],
    queryFn: async () => {
      let url = API_URL;
      if (studentId) {
        url += `?studentId=${studentId}`;
      }
      const jwt = await getJWT();
      const response = await fetch(url, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exam attempts');
      }
      return await response.json();
    },
  });

  // Start a new exam attempt
  const startAttemptMutation = useMutation({
    mutationFn: async (examId: string) => {
      const jwt = await getJWT();
      const csrf = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        },
        body: JSON.stringify({ examId }),
      });
      if (!response.ok) {
        throw new Error('Failed to start exam attempt');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examAttempts'] });
    },
  });

  // Submit an exam attempt
  const submitAttemptMutation = useMutation({
    mutationFn: async ({ attemptId, answers }: { attemptId: string; answers: any }) => {
      const jwt = await getJWT();
      const csrf2 = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const response = await fetch(`${API_URL}/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(csrf2 ? { 'X-CSRF-Token': csrf2 } : {}),
        },
        body: JSON.stringify({ answers }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit exam attempt');
      }
      return await response.json();
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