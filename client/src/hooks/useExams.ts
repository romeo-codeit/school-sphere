import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = '/api/exams';

export function useExams() {
  const queryClient = useQueryClient();

  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
      const data = await response.json();
      // Ensure questions are parsed from JSON string
      return data.documents.map((exam: any) => {
        try {
          return { ...exam, questions: JSON.parse(exam.questions) };
        } catch (e) {
          console.error(`Failed to parse questions for exam ${exam.$id}:`, e);
          return { ...exam, questions: [] }; // Default to empty array on error
        }
      });
    },
  });

  const useExam = (examId: string) => {
    return useQuery({
      queryKey: ['exams', examId],
      queryFn: async () => {
        if (!examId) return null;
        const response = await fetch(`${API_URL}/${examId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch exam');
        }
        const exam = await response.json();
        // Ensure questions are parsed from JSON string
        try {
          return { ...exam, questions: JSON.parse(exam.questions) };
        } catch (e) {
          console.error(`Failed to parse questions for exam ${exam.$id}:`, e);
          return { ...exam, questions: [] };
        }
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