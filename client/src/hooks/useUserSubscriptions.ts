import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function useUserSubscriptions() {
  return useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: async () => {
      try {
        const result = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userSubscriptions',
          [Query.limit(100)]
        );
        return result.documents;
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        // If collection doesn't exist, return empty array
        return [];
      }
    },
  });
}

export function useUserSubscription(userId: string) {
  return useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      try {
        const result = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userSubscriptions',
          [Query.equal('userId', userId), Query.limit(1)]
        );
        return result.documents[0] || null;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // If collection doesn't exist, return null
        return null;
      }
    },
    enabled: !!userId,
  });
}