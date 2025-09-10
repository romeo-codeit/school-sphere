import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const EXAM_ATTEMPTS_COLLECTION_ID = 'exam_attempts';

export function useExamAttempts(studentId?: string) {
  const queryClient = useQueryClient();

  const { data: examAttempts, isLoading, error } = useQuery({
    queryKey: ['examAttempts', studentId],
    queryFn: async () => {
      const queries = [];
      if (studentId) {
        queries.push(Query.equal('studentId', studentId));
      }
      const response = await databases.listDocuments(
        DATABASE_ID,
        EXAM_ATTEMPTS_COLLECTION_ID,
        queries
      );
      return response.documents;
    },
    enabled: !!studentId,
  });

  const createExamAttemptMutation = useMutation({
    mutationFn: async (examAttemptData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        EXAM_ATTEMPTS_COLLECTION_ID,
        ID.unique(),
        examAttemptData
      );
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