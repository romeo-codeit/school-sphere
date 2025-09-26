import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, client } from '@/lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { DB } from '@/lib/db';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

const NOTIFICATIONS_COLLECTION_ID = 'notifications';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = ['notifications', user?.$id];

  const { data: notifications, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.$id) return [];
      const response = await databases.listDocuments(
        DB.id,
        NOTIFICATIONS_COLLECTION_ID,
        [Query.equal('userId', user.$id), Query.orderDesc('$createdAt'), Query.limit(25)]
      );
      return response.documents;
    },
    enabled: !!user?.$id,
  });

  useEffect(() => {
    if (!user?.$id) return;

    const channel = `databases.${DB.id}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`;
    const unsubscribe = client.subscribe(channel, (response: RealtimeResponseEvent<any>) => {
      // Check if the notification is for the current user
      if (response.payload.userId === user.$id) {
        queryClient.invalidateQueries({ queryKey });
      }
    });

    return () => unsubscribe();
  }, [user?.$id, queryClient, queryKey]);

  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: { userId: string; message: string; link?: string }) => {
      return await databases.createDocument(
        DB.id,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        { ...notificationData, isRead: false }
      );
    },
    // Invalidation is handled by the real-time subscription
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await databases.updateDocument(
        DB.id,
        NOTIFICATIONS_COLLECTION_ID,
        notificationId,
        { isRead: true }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
        if (!notifications) return;
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.$id);
        const promises = unreadIds.map(id =>
            databases.updateDocument(DB.id, NOTIFICATIONS_COLLECTION_ID, id, { isRead: true })
        );
        return Promise.all(promises);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
    }
  });


  return {
    notifications,
    isLoading,
    error,
    createNotification: createNotificationMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
  };
}