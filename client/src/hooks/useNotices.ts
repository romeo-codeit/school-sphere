import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const NOTICES_COLLECTION_ID = 'notices';

export function useNotices(limit?: number) {
  const { data: notices, isLoading, error } = useQuery({
    queryKey: ['notices', limit],
    queryFn: async () => {
      const queries = [Query.orderDesc('$createdAt')];
      if (limit) {
        queries.push(Query.limit(limit));
      }
      const response = await databases.listDocuments(DATABASE_ID, NOTICES_COLLECTION_ID, queries);
      return response.documents;
    },
  });

  return { notices, isLoading, error };
}