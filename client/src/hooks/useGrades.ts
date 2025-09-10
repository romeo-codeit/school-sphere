import { useQuery } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const GRADES_COLLECTION_ID = 'grades';

export function useGrades(studentId: string) {
  const { data: grades, isLoading, error } = useQuery({
    queryKey: ['grades', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await databases.listDocuments(
        DATABASE_ID,
        GRADES_COLLECTION_ID,
        [Query.equal('studentId', studentId)]
      );
      return response.documents;
    },
    enabled: !!studentId,
  });

  return {
    grades,
    isLoading,
    error,
  };
}
