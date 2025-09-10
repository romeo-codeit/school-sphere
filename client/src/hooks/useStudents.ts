import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const STUDENTS_COLLECTION_ID = 'students';

export function useStudents() {
  const queryClient = useQueryClient();

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, STUDENTS_COLLECTION_ID);
      return response.documents;
    },
  });

  const useStudent = (studentId: string) => {
    return useQuery({
      queryKey: ['students', studentId],
      queryFn: async () => {
        if (!studentId) return null;
        return await databases.getDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, studentId);
      },
      enabled: !!studentId,
    });
  };

  const createStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        STUDENTS_COLLECTION_ID,
        ID.unique(),
        studentData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ studentId, studentData }: { studentId: string, studentData: any }) => {
      return await databases.updateDocument(
        DATABASE_ID,
        STUDENTS_COLLECTION_ID,
        studentId,
        studentData
      );
    },
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', studentId] });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await databases.deleteDocument(
        DATABASE_ID,
        STUDENTS_COLLECTION_ID,
        studentId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    students,
    isLoading,
    error,
    useStudent,
    createStudent: createStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    deleteStudent: deleteStudentMutation.mutateAsync,
  };
}