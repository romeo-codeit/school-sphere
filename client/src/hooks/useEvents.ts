import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { ID } from 'appwrite';

const DATABASE_ID = 'db'; // As per assumption
const COLLECTION_ID = 'events'; // As per assumption

export function useEvents() {
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      return response.documents;
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData: any) => {
      return databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: string, eventData: any }) => {
      return databases.updateDocument(DATABASE_ID, COLLECTION_ID, eventId, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => {
      return databases.deleteDocument(DATABASE_ID, COLLECTION_ID, eventId);
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
            return await databases.getDocument(DATABASE_ID, COLLECTION_ID, eventId);
        },
        enabled: !!eventId,
    });

    return { data, isLoading };
}
