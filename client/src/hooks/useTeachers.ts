import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InsertTeacher, Teacher } from '../../shared/schema';

const API_URL = '/api/teachers';

export function useTeachers() {
  const queryClient = useQueryClient();

  const { data: teachers, isLoading, error } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      const data = await response.json();
      return data.documents;
    },
  });

  const useTeacher = (teacherId: string) => {
    return useQuery<Teacher>({
      queryKey: ['teachers', teacherId],
      queryFn: async () => {
        if (!teacherId) return null;
        const response = await fetch(`${API_URL}/${teacherId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch teacher');
        }
        return await response.json();
      },
      enabled: !!teacherId,
    });
  };

  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: InsertTeacher) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacherData),
      });
      if (!response.ok) {
        throw new Error('Failed to create teacher');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ teacherId, teacherData }: { teacherId: string, teacherData: Partial<InsertTeacher> }) => {
      const response = await fetch(`${API_URL}/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacherData),
      });
      if (!response.ok) {
        throw new Error('Failed to update teacher');
      }
      return await response.json();
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', teacherId] });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const response = await fetch(`${API_URL}/${teacherId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  return {
    teachers,
    isLoading,
    error,
    useTeacher,
    createTeacher: createTeacherMutation.mutateAsync,
    updateTeacher: updateTeacherMutation.mutateAsync,
    deleteTeacher: deleteTeacherMutation.mutateAsync,
  };
}