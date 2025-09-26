import { useQuery } from '@tanstack/react-query';

const API_URL = '/api/grades';

export function useGrades(studentId: string) {
  const { data: grades, isLoading, error } = useQuery({
    queryKey: ['grades', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await fetch(`${API_URL}?studentId=${studentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }
      const data = await response.json();
      return data.documents;
    },
    enabled: !!studentId,
  });

  return {
    grades,
    isLoading,
    error,
  };
}
