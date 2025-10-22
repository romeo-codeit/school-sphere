import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;

const API_URL = '/api/grades';

export function useGrades(studentId: string) {
  const { data: grades, isLoading, error } = useQuery({
    queryKey: ['grades', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      try {
        const res = await apiRequest('GET', `${API_URL}?studentId=${encodeURIComponent(studentId)}`);
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const preview = (await res.text()).slice(0, 80);
          throw new Error(`Unexpected response (not JSON): ${preview}`);
        }
        const data = await res.json();
        return data.documents.map((grade: any) => ({
          ...grade,
          score: grade.score ? parseFloat(grade.score) : 0,
          totalMarks: grade.totalMarks ? parseFloat(grade.totalMarks) : 0,
        }));
      } catch (e) {
        // Fallback to direct Appwrite query in dev/offline when API server isn't running
        const page = await databases.listDocuments(DATABASE_ID, 'grades', [
          Query.equal('studentId', studentId),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]);
        return page.documents.map((grade: any) => ({
          ...grade,
          score: grade.score ? parseFloat(grade.score) : 0,
          totalMarks: grade.totalMarks ? parseFloat(grade.totalMarks) : 0,
        }));
      }
    },
    enabled: !!studentId,
  });

  return {
    grades,
    isLoading,
    error,
  };
}
