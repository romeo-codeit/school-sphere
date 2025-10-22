import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { isOnline, queueRequest } from '@/lib/offline';
import { getDB } from '@/lib/idbCache';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ATTENDANCE_COLLECTION_ID = 'attendanceRecords';

export function useAttendance(studentId?: string, limit?: number, offset?: number) {
  const queryClient = useQueryClient();

  const { data: attendance, isLoading, error } = useQuery({
    queryKey: ['attendanceRecords', studentId, limit, offset],
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
      try {
        const response = await databases.listDocuments(DATABASE_ID, ATTENDANCE_COLLECTION_ID, queries);
        // Cache latest result for offline read-only
        try {
          const db = await getDB();
          await db.put('meta' as any, response.documents, `attendance:${studentId || 'all'}:${limit || 'default'}:${offset || 0}`);
        } catch {}
        return response.documents;
      } catch (e) {
        // Offline fallback to cached meta
        try {
          const db = await getDB();
          const cached = await db.get('meta' as any, `attendance:${studentId || 'all'}:${limit || 'default'}:${offset || 0}`);
          return cached || [];
        } catch {
          return [];
        }
      }
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: any) => {
      if (!isOnline()) {
        // Optimistically update cache
        const tempId = `temp-${Date.now()}`;
        queryClient.setQueryData<any[]>(['attendanceRecords', studentId, limit, offset], (old) => {
          const arr = Array.isArray(old) ? old.slice() : [];
          arr.unshift({ ...attendanceData, $id: tempId, __optimistic: true });
          return arr;
        });
        await queueRequest({
          url: `${import.meta.env.BASE_URL || ''}api/attendance`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attendanceData),
        });
        return { $id: tempId, ...attendanceData };
      }
      return await databases.createDocument(DATABASE_ID, ATTENDANCE_COLLECTION_ID, ID.unique(), attendanceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, ...attendanceData }: { id: string; [key: string]: any }) => {
      if (!isOnline()) {
        // Optimistic update
        queryClient.setQueryData<any[]>(['attendanceRecords', studentId, limit, offset], (old) => {
          const arr = Array.isArray(old) ? old.map((r) => (r.$id === id ? { ...r, ...attendanceData } : r)) : old;
          return arr as any[];
        });
        await queueRequest({
          url: `${import.meta.env.BASE_URL || ''}api/attendance/${encodeURIComponent(id)}`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attendanceData),
        });
        return { $id: id, ...attendanceData };
      }
      return await databases.updateDocument(DATABASE_ID, ATTENDANCE_COLLECTION_ID, id, attendanceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline()) {
        // Optimistic remove
        queryClient.setQueryData<any[]>(['attendanceRecords', studentId, limit, offset], (old) => {
          const arr = Array.isArray(old) ? old.filter((r) => r.$id !== id) : old;
          return arr as any[];
        });
        await queueRequest({
          url: `${import.meta.env.BASE_URL || ''}api/attendance/${encodeURIComponent(id)}`,
          method: 'DELETE',
        });
        return { ok: true } as any;
      }
      return await databases.deleteDocument(DATABASE_ID, ATTENDANCE_COLLECTION_ID, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
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