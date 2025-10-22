import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CLASSES_COLLECTION_ID = 'classes';

export function useClasses(teacherId?: string) {
  const { user, role } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['classes', role, teacherId],
    queryFn: async () => {
      if (!user) return [];

      const queries = [];
      // If teacherId is provided, get classes for that specific teacher
      // Otherwise, filter based on current user's role
      if (teacherId) {
        queries.push(Query.equal('teacherId', teacherId));
      } else if (role === 'teacher') {
        queries.push(Query.equal('teacherId', user.$id));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        queries
      );
      return response.documents;
    },
    enabled: !!user,
  });

  return {
    classes: data,
    isLoading,
    error,
  };
}
