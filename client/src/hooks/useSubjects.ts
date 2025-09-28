import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SUBJECTS_COLLECTION_ID = 'subjects';

export function useSubjects() {
  const queryClient = useQueryClient();

  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, SUBJECTS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
      ]);
      return response.documents;
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (subjectData: { name: string, description?: string }) => {
      return await databases.createDocument(DATABASE_ID, SUBJECTS_COLLECTION_ID, ID.unique(), subjectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ subjectId, subjectData }: { subjectId: string, subjectData: { name: string, description?: string } }) => {
      return await databases.updateDocument(DATABASE_ID, SUBJECTS_COLLECTION_ID, subjectId, subjectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      return await databases.deleteDocument(DATABASE_ID, SUBJECTS_COLLECTION_ID, subjectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  return {
    subjects,
    isLoading,
    error,
    createSubject: createSubjectMutation.mutateAsync,
    updateSubject: updateSubjectMutation.mutateAsync,
    deleteSubject: deleteSubjectMutation.mutateAsync,
  };
}