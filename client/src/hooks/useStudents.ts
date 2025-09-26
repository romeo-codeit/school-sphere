import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InsertStudent, Student } from './shared/schema';

const API_URL = '/api/students';

export function useStudents() {
  const queryClient = useQueryClient();

  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      return data.documents;
    },
  });

  const useStudent = (studentId: string) => {
    return useQuery<Student>({
      queryKey: ['students', studentId],
      queryFn: async () => {
        if (!studentId) return null;
        const response = await fetch(`${API_URL}/${studentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch student');
        }
        return await response.json();
      },
      enabled: !!studentId,
    });
  };

  const createStudentMutation = useMutation({
    mutationFn: async (studentData: InsertStudent) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      if (!response.ok) {
        throw new Error('Failed to create student');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ studentId, studentData }: { studentId: string, studentData: Partial<InsertStudent> }) => {
      const response = await fetch(`${API_URL}/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      if (!response.ok) {
        throw new Error('Failed to update student');
      }
      return await response.json();
    },
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', studentId] });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`${API_URL}/${studentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
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