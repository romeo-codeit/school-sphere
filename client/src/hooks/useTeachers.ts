import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TEACHERS_COLLECTION_ID = 'teachers';

export function useTeachers() {
  const queryClient = useQueryClient();

  const { data: teachers, isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, TEACHERS_COLLECTION_ID);
      return response.documents;
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        TEACHERS_COLLECTION_ID,
        ID.unique(),
        teacherData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ teacherId, teacherData }: { teacherId: string, teacherData: any }) => {
      return await databases.updateDocument(
        DATABASE_ID,
        TEACHERS_COLLECTION_ID,
        teacherId,
        teacherData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return await databases.deleteDocument(
        DATABASE_ID,
        TEACHERS_COLLECTION_ID,
        teacherId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  return {
    teachers,
    isLoading,
    error,
    createTeacher: createTeacherMutation.mutateAsync,
    updateTeacher: updateTeacherMutation.mutateAsync,
    deleteTeacher: deleteTeacherMutation.mutateAsync,
  };
}
