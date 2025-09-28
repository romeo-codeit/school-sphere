import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export function useClasses() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['classes', user?.$id],
    queryFn: async () => {
      if (!user) return [];
      // Fetch classes where the teacherId matches the logged-in user
      const response = await databases.listDocuments(
        DATABASE_ID,
        'classes',
        [
          // For teachers, filter by teacherId
          // For admins, return all classes
        ]
      );
      // If user is admin, return all classes
      if (user.prefs?.role === 'admin') return response.documents;
      // If user is teacher, filter classes by teacherId
      return response.documents.filter((c: any) => c.teacherId === user.$id);
    },
    enabled: !!user,
  });

  return {
    classes: data,
    isLoading,
    error,
  };
}
