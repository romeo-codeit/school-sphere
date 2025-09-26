import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = '/api/examAttempts';

export function useExamAttempts(studentId?: string) {
  const queryClient = useQueryClient();

  const { data: examAttempts, isLoading, error } = useQuery({
    queryKey: ['examAttempts', studentId],
    queryFn: async () => {
      let url = API_URL;
      if (studentId) {
        url += `?studentId=${studentId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch exam attempts');
      }
      const data = await response.json();
      return data.documents.map((doc: any) => ({
        id: doc.$id,
        examId: doc.examId as string,
        score: doc.score as number,
        totalQuestions: doc.totalQuestions as number,
        correctAnswers: doc.correctAnswers as number,
      }));
    },
    enabled: !!studentId,
  });

  const createExamAttemptMutation = useMutation({
    mutationFn: async (examAttemptData: any) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examAttemptData),
      });
      if (!response.ok) {
        throw new Error('Failed to create exam attempt');
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
    createExamAttempt: createExamAttemptMutation.mutateAsync,
  };
}