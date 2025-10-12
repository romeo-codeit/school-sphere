import { useQuery } from '@tanstack/react-query';
import { databases, Query } from '@/lib/appwrite';

export function useUserProfiles() {
  return useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const result = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userProfiles',
        [Query.limit(1000)] // Get all profiles
      );
      return result.documents;
    },
  });
}