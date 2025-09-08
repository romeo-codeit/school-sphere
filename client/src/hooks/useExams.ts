import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const EXAMS_COLLECTION_ID = 'exams';

export function useExams() {
  const queryClient = useQueryClient();

  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, EXAMS_COLLECTION_ID);
      return response.documents;
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        ID.unique(),
        examData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: async ({ examId, examData }: { examId: string, examData: any }) => {
      return await databases.updateDocument(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        examId,
        examData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      return await databases.deleteDocument(
        DATABASE_ID,
        EXAMS_COLLECTION_ID,
        examId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  return {
    exams,
    isLoading,
    error,
    createExam: createExamMutation.mutateAsync,
    updateExam: updateExamMutation.mutateAsync,
    deleteExam: deleteExamMutation.mutateAsync,
  };
}
