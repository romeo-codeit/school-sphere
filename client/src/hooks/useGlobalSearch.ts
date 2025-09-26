import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { DB } from '@/lib/db';
import { Query } from 'appwrite';

export function useGlobalSearch(query: string) {
  const queryKey = ['globalSearch', query];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!query || query.trim().length < 3) {
        return { students: [], teachers: [], exams: [] };
      }

      const searchQuery = [Query.search('search', query)];

      const studentQuery = databases.listDocuments(DB.id, 'students', searchQuery);
      const teacherQuery = databases.listDocuments(DB.id, 'teachers', searchQuery);
      const examQuery = databases.listDocuments(DB.id, 'exams', searchQuery);

      const [studentResults, teacherResults, examResults] = await Promise.all([
        studentQuery,
        teacherQuery,
        examQuery,
      ]);

      return {
        students: studentResults.documents,
        teachers: teacherResults.documents,
        exams: examResults.documents,
      };
    },
    enabled: query.trim().length >= 3, // Only run the query if it's long enough
    staleTime: 1000 * 60, // Cache results for 1 minute
  });

  return {
    results: data,
    isLoading,
    error,
  };
}