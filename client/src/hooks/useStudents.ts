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
      const baseQueries = [
        Query.limit(limit),
        Query.offset((page - 1) * limit),
        Query.orderDesc('$createdAt'),
      ];
      if (search) {
        baseQueries.push(Query.search('search', search));
      }

      // If classId is specified, fetch by both 'classId' (new schema) and legacy 'class', then merge
      if (classId) {
        const q1 = [...baseQueries, Query.equal('classId', classId)];
        const q2 = [...baseQueries, Query.equal('class', classId)];

        const [res1, res2] = await Promise.all([
          databases.listDocuments(DATABASE_ID, 'students', q1).catch(() => ({ documents: [], total: 0 } as any)),
          databases.listDocuments(DATABASE_ID, 'students', q2).catch(() => ({ documents: [], total: 0 } as any)),
        ]);

        // Merge by $id to avoid duplicates when both fields exist
        const map = new Map<string, any>();
        for (const d of [...res1.documents, ...res2.documents]) {
          map.set(String((d as any).$id), d);
        }
        const merged = Array.from(map.values());
        // Emulate pagination after merge
        const start = (page - 1) * limit;
        const paged = merged.slice(start, start + limit);
        return { documents: paged, total: merged.length } as any;
      }

      // No class filter: single query
      const response = await databases.listDocuments(DATABASE_ID, 'students', baseQueries);
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