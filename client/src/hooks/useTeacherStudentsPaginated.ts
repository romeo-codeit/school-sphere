import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { withBase } from '@/lib/http';

interface TeacherStudentsFilters {
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useTeacherStudentsPaginated(filters: TeacherStudentsFilters = {}) {
  const { limit = 50, offset = 0, enabled = true } = filters;
  const { getJWT } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-students-paginated', limit, offset],
    queryFn: async () => {
      const jwt = await getJWT();
      const response = await fetch(withBase(`/api/teacher/students?limit=${limit}&offset=${offset}`), { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
      if (!response.ok) {
        throw new Error('Failed to fetch teacher students');
      }
      return await response.json();
    },
    enabled,
  });

  return {
    students: data?.documents || [],
    total: data?.total || 0,
    limit: data?.limit || limit,
    offset: data?.offset || offset,
    isLoading,
    error,
    refetch,
  };
}