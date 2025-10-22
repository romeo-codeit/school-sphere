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

      const searchTerm = query.trim();

      try {
        // Try using search field first, with fallback queries
        const searchQuery = [Query.search('search', searchTerm)];

        const [studentResults, teacherResults, examResults] = await Promise.all([
          databases.listDocuments(DB.id, 'students', searchQuery).catch(() => ({ documents: [] })),
          databases.listDocuments(DB.id, 'teachers', searchQuery).catch(() => ({ documents: [] })),
          databases.listDocuments(DB.id, 'exams', searchQuery).catch(() => ({ documents: [] })),
        ]);

        // If search field doesn't return results, try searching by individual fields
        let finalStudents = studentResults.documents;
        let finalTeachers = teacherResults.documents;
        let finalExams = examResults.documents;

        if (finalStudents.length === 0) {
          try {
            const fallbackQuery = [
              Query.or([
                Query.contains('firstName', searchTerm),
                Query.contains('lastName', searchTerm),
                Query.contains('email', searchTerm),
                Query.contains('studentId', searchTerm),
              ])
            ];
            const fallbackResults = await databases.listDocuments(DB.id, 'students', fallbackQuery);
            finalStudents = fallbackResults.documents;
          } catch (e) {
            // Fallback search also failed, return empty
          }
        }

        if (finalTeachers.length === 0) {
          try {
            const fallbackQuery = [
              Query.or([
                Query.contains('firstName', searchTerm),
                Query.contains('lastName', searchTerm),
                Query.contains('email', searchTerm),
                Query.contains('employeeId', searchTerm),
              ])
            ];
            const fallbackResults = await databases.listDocuments(DB.id, 'teachers', fallbackQuery);
            finalTeachers = fallbackResults.documents;
          } catch (e) {
            // Fallback search also failed, return empty
          }
        }

        if (finalExams.length === 0) {
          try {
            const fallbackQuery = [Query.contains('title', searchTerm)];
            const fallbackResults = await databases.listDocuments(DB.id, 'exams', fallbackQuery);
            finalExams = fallbackResults.documents;
          } catch (e) {
            // Fallback search also failed, return empty
          }
        }

        return {
          students: finalStudents,
          teachers: finalTeachers,
          exams: finalExams,
        };
      } catch (err) {
        console.error('Global search error:', err);
        return { students: [], teachers: [], exams: [] };
      }
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