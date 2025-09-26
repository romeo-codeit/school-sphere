import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, client } from '../lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { useEffect } from 'react';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MEETINGS_COLLECTION_ID = 'videoMeetings';

export function useVideoConferencing() {
  const queryClient = useQueryClient();

  const { data: meetings, isLoading, error } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION_ID, [Query.orderDesc('$createdAt')]);
      return response.documents;
    },
  });

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${MEETINGS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<any>) => {
        queryClient.setQueryData(['meetings'], (oldData: any[] | undefined) => {
          if (!oldData) {
            // If there's no old data, just return the new payload in an array
            return [response.payload];
          }

          const eventType = response.events[0].split('.').pop();

          if (eventType === 'create') {
            // Add the new meeting to the top of the list if it doesn't exist
            return oldData.some(doc => doc.$id === response.payload.$id)
              ? oldData
              : [response.payload, ...oldData];
          }

          if (eventType === 'update') {
            // Replace the updated meeting in the list
            return oldData.map(doc =>
              doc.$id === response.payload.$id ? response.payload : doc
            );
          }

          if (eventType === 'delete') {
            // Remove the deleted meeting from the list
            return oldData.filter(doc => doc.$id !== response.payload.$id);
          }

          return oldData;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [DATABASE_ID, queryClient]);

  const createMeetingMutation = useMutation({
    mutationFn: (meetingData: any) =>
      databases.createDocument(DATABASE_ID, MEETINGS_COLLECTION_ID, ID.unique(), meetingData),
    // No onSuccess invalidation needed due to real-time updates
  });

  const updateMeetingMutation = useMutation({
    mutationFn: ({ id, ...meetingData }: { id: string; [key: string]: any }) =>
      databases.updateDocument(DATABASE_ID, MEETINGS_COLLECTION_ID, id, meetingData),
    // No onSuccess invalidation needed
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (meetingId: string) =>
      databases.deleteDocument(DATABASE_ID, MEETINGS_COLLECTION_ID, meetingId),
    // No onSuccess invalidation needed
  });

  return {
    meetings,
    isLoading,
    error,
    createMeeting: createMeetingMutation.mutateAsync,
    updateMeeting: updateMeetingMutation.mutateAsync,
    deleteMeeting: deleteMeetingMutation.mutateAsync,
  };
}