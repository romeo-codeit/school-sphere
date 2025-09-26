import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { DB } from '@/lib/db';
import { Query } from 'appwrite';

interface TeacherFilters {
    page?: number;
    limit?: number;
    search?: string;
}

export function useTeachers(filters: TeacherFilters = {}) {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '' } = filters;

  const queryKey = ['teachers', { page, limit, search }];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const queries = [
          Query.limit(limit),
          Query.offset((page - 1) * limit),
          Query.orderDesc('$createdAt'),
      ];
      if (search) {
          // Assuming 'name' and 'employeeId' are indexed for search
          queries.push(Query.search('search', search));
      }

      const response = await databases.listDocuments(DB.id, 'teachers', queries);
      return response; // Return the whole response for total count
    },
  });

  const useTeacher = (teacherId: string) => {
    return useQuery({
      queryKey: ['teachers', teacherId],
      queryFn: async () => {
        if (!teacherId) return null;
        return await databases.getDocument(DB.id, 'teachers', teacherId);
      },
      enabled: !!teacherId,
    });
  };

  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: any) => {
      return await databases.createDocument(DB.id, 'teachers', ID.unique(), teacherData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ teacherId, teacherData }: { teacherId: string, teacherData: any }) => {
      return await databases.updateDocument(DB.id, 'teachers', teacherId, teacherData);
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', teacherId] });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return await databases.deleteDocument(DB.id, 'teachers', teacherId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  return {
    teachers: data?.documents,
    total: data?.total,
    isLoading,
    error,
    useTeacher,
    createTeacher: createTeacherMutation.mutateAsync,
    updateTeacher: updateTeacherMutation.mutateAsync,
    deleteTeacher: deleteTeacherMutation.mutateAsync,
  };
}