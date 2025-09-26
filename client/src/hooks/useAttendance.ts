import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = '/api/attendance';

export function useAttendance(studentId?: string, limit?: number, offset?: number) {
  const queryClient = useQueryClient();

  const { data: attendance, isLoading, error } = useQuery({
    queryKey: ['attendance', studentId, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      const data = await response.json();
      return data.documents;
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: any) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });
      if (!response.ok) {
        throw new Error('Failed to create attendance');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, ...attendanceData }: { id: string; [key: string]: any }) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });
      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete attendance');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  return {
    attendance,
    isLoading,
    error,
    createAttendance: createAttendanceMutation.mutateAsync,
    updateAttendance: updateAttendanceMutation.mutateAsync,
    deleteAttendance: deleteAttendanceMutation.mutateAsync,
  };
}
