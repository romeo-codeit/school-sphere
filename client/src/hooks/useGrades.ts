import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;

// Removed server API usage; use Appwrite directly

export function useGrades(studentId: string) {
  const { data: grades, isLoading, error } = useQuery({
    queryKey: ['grades', studentId],
    queryFn: async () => {
      if (!studentId) return [];
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
    },
    enabled: !!studentId,
  });

  return {
    grades,
    isLoading,
    error,
  };
}
