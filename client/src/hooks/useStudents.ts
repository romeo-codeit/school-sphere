import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

interface StudentFilters {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
    enabled?: boolean;
}

export function useStudents(filters: StudentFilters = {}) {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '', classId, enabled = true } = filters;

  const queryKey = ['students', { page, limit, search, classId }];

  const { data, isLoading, error } = useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      const queries = [
          Query.limit(limit),
          Query.offset((page - 1) * limit),
          Query.orderDesc('$createdAt'),
      ];
      if (search) {
          queries.push(Query.search('search', search));
      }
      if (classId) {
          queries.push(Query.equal('classId', classId));
      }

      const response = await databases.listDocuments(DATABASE_ID, 'students', queries);
      return response;
    },
  });

  const useStudent = (studentId: string) => {
    return useQuery({
      queryKey: ['students', studentId],
      queryFn: async () => {
        if (!studentId) return null;
        return await databases.getDocument(DATABASE_ID, 'students', studentId);
      },
      enabled: !!studentId,
    });
  };

  const createStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const search = [studentData.firstName, studentData.lastName, studentData.email, studentData.studentId, studentData.classId, studentData.parentName, studentData.parentEmail]
        .filter(Boolean)
        .join(' ');
      return await databases.createDocument(
        DATABASE_ID,
        'students',
        ID.unique(),
        { ...studentData, search }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ studentId, studentData }: { studentId: string, studentData: any }) => {
      const search = [studentData.firstName, studentData.lastName, studentData.email, studentData.studentId, studentData.classId, studentData.parentName, studentData.parentEmail]
        .filter(Boolean)
        .join(' ');
      return await databases.updateDocument(
        DATABASE_ID,
        'students',
        studentId,
        { ...studentData, search }
      );
    },
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', studentId] });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await databases.deleteDocument(DATABASE_ID, 'students', studentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    students: data?.documents,
    total: data?.total,
    isLoading,
    error,
    useStudent,
    createStudent: createStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    deleteStudent: deleteStudentMutation.mutateAsync,
  };
}