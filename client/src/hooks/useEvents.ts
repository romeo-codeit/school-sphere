import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const EVENTS_COLLECTION_ID = 'events';

export function useEvents() {
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, EVENTS_COLLECTION_ID, [
        Query.orderDesc('date'),
      ]);
      return response.documents;
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return await databases.createDocument(DATABASE_ID, EVENTS_COLLECTION_ID, ID.unique(), eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string, eventData: any }) => {
      return await databases.updateDocument(DATABASE_ID, EVENTS_COLLECTION_ID, eventId, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await databases.deleteDocument(DATABASE_ID, EVENTS_COLLECTION_ID, eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    events,
    isLoading,
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
  };
}

export function useEvent(eventId: string) {
    const { data, isLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;
            return await databases.getDocument(DATABASE_ID, EVENTS_COLLECTION_ID, eventId);
        },
        enabled: !!eventId,
    });

    return { data, isLoading };
}