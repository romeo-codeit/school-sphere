import { useQuery } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = 'users'; // Assuming a 'users' collection exists

export function useUsers() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.limit(100)] // Limit to 100 users for now, consider pagination for larger sets
      );
      return response.documents;
    },
  });

  const useUser = (userId: string) => {
    return useQuery({
      queryKey: ['users', userId],
      queryFn: async () => {
        if (!userId) return null;
        // Assuming you can get a single user document by its ID
        // Appwrite's listDocuments can be filtered by ID, or if there's a direct getDocument by ID
        const response = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal('$id', userId)]
        );
        return response.documents[0] || null;
      },
      enabled: !!userId,
    });
  };

  return {
    users,
    isLoading,
    error,
    useUser,
  };
}
