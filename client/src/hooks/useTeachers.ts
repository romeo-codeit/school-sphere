import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

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
          queries.push(Query.search('search', search));
      }

      const response = await databases.listDocuments(DATABASE_ID, 'teachers', queries);
      return response;
    },
  });

  const useTeacher = (teacherId: string) => {
    return useQuery({
      queryKey: ['teachers', teacherId],
      queryFn: async () => {
        if (!teacherId) return null;
        return await databases.getDocument(DATABASE_ID, 'teachers', teacherId);
      },
      enabled: !!teacherId,
    });
  };

  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: any) => {
      return await databases.createDocument(DATABASE_ID, 'teachers', ID.unique(), teacherData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ teacherId, teacherData }: { teacherId: string, teacherData: any }) => {
      return await databases.updateDocument(DATABASE_ID, 'teachers', teacherId, teacherData);
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', teacherId] });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return await databases.deleteDocument(DATABASE_ID, 'teachers', teacherId);
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