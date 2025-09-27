import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { DB } from '@/lib/db';
import { Query } from 'appwrite';

export function useSubjects() {
  const queryClient = useQueryClient();

  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await databases.listDocuments(DB.id, 'subjects', [
        Query.orderDesc('$createdAt'),
      ]);
      return response.documents;
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (subjectData: { name: string, description?: string }) => {
      return await databases.createDocument(DB.id, 'subjects', ID.unique(), subjectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ subjectId, subjectData }: { subjectId: string, subjectData: { name: string, description?: string } }) => {
      return await databases.updateDocument(DB.id, 'subjects', subjectId, subjectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      return await databases.deleteDocument(DB.id, 'subjects', subjectId);
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