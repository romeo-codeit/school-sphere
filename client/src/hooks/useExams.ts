import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const API_URL = '/api/cbt/exams';

export function useExams(type?: string) {
  const { getJWT } = useAuth();
  const queryClient = useQueryClient();

  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['cbt-exams', type],
    queryFn: async () => {
      let url = API_URL;
      if (type) {
        url += `?type=${type}`;
      }
      const jwt = await getJWT();
      const response = await fetch(url, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
      return await response.json();
    },
  });

  const useExam = (examId: string) => {
    return useQuery({
      queryKey: ['cbt-exams', examId],
      queryFn: async () => {
        if (!examId) return null;
        const jwt = await getJWT();
        const response = await fetch(`${API_URL}/${examId}`, {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to fetch exam');
        }
        return await response.json();
      },
      enabled: !!examId,
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
    exams,
    isLoading,
    error,
    useExam,
    createExam: createExamMutation.mutateAsync,
    updateExam: updateExamMutation.mutateAsync,
    deleteExam: deleteExamMutation.mutateAsync,
  };
}