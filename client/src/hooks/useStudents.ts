import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { DB } from '@/lib/db';
import { Query } from 'appwrite';

interface StudentFilters {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
}

export function useStudents(filters: StudentFilters = {}) {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '', classId } = filters;

  const queryKey = ['students', { page, limit, search, classId }];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const queries = [
          Query.limit(limit),
          Query.offset((page - 1) * limit),
          Query.orderDesc('$createdAt'),
      ];
      if (search) {
          // Appwrite search needs a search index on the attributes.
          // Assuming 'name' and 'studentId' are indexed.
          queries.push(Query.search('search', search));
      }
      if (classId) {
          queries.push(Query.equal('classId', classId));
      }

      const response = await databases.listDocuments(DB.id, 'students', queries);
      return response; // Returning the whole response to get total count for pagination
    },
  });

  const useStudent = (studentId: string) => {
    return useQuery({
      queryKey: ['students', studentId],
      queryFn: async () => {
        if (!studentId) return null;
        return await databases.getDocument(DB.id, 'students', studentId);
      },
      enabled: !!studentId,
    });
  };

  const createStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      return await databases.createDocument(DB.id, 'students', ID.unique(), studentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ studentId, studentData }: { studentId: string, studentData: any }) => {
      return await databases.updateDocument(DB.id, 'students', studentId, studentData);
    },
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', studentId] });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await databases.deleteDocument(DB.id, 'students', studentId);
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