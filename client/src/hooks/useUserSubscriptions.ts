import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';

export function useUserSubscriptions() {
  return useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: async () => {
      const result = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userSubscriptions',
        []
      );
      return result.documents;
    },
  });
}

export function useUserSubscription(userId: string) {
  return useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      const result = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userSubscriptions',
        [`userId=${userId}`]
      );
      return result.documents[0] || null;
    },
    enabled: !!userId,
  });
}