import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ATTENDANCE_COLLECTION_ID = 'attendance';

export function useAttendance(studentId?: string, limit?: number, offset?: number) {
  const queryClient = useQueryClient();

  const { data: attendance, isLoading, error } = useQuery({
    queryKey: ['attendance', studentId, limit, offset],
    queryFn: async () => {
      const queries = [
        Query.orderDesc('date')
      ];
      if (studentId) {
        queries.push(Query.equal('studentId', studentId));
      }
      if (limit) {
        queries.push(Query.limit(limit));
      }
      if (offset) {
        queries.push(Query.offset(offset));
      }

      const response = await databases.listDocuments(DATABASE_ID, ATTENDANCE_COLLECTION_ID, queries);
      return response.documents;
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: any) => {
      return await databases.createDocument(DATABASE_ID, ATTENDANCE_COLLECTION_ID, ID.unique(), attendanceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, ...attendanceData }: { id: string; [key: string]: any }) => {
      return await databases.updateDocument(DATABASE_ID, ATTENDANCE_COLLECTION_ID, id, attendanceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await databases.deleteDocument(DATABASE_ID, ATTENDANCE_COLLECTION_ID, id);
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