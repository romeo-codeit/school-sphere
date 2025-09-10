import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const VIDEO_MEETINGS_COLLECTION_ID = 'videoMeetings';

export function useVideoConferencing() {
  const queryClient = useQueryClient();

  const { data: meetings, isLoading, error } = useQuery({
    queryKey: ['videoMeetings'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, VIDEO_MEETINGS_COLLECTION_ID, [Query.orderDesc('$createdAt')]);
      return response.documents;
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: { topic: string; description?: string; roomId: string; createdBy: string; allowedRoles?: string[] }) => {
      return await databases.createDocument(
        DATABASE_ID,
        VIDEO_MEETINGS_COLLECTION_ID,
        ID.unique(),
        meetingData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoMeetings'] });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      return await databases.deleteDocument(
        DATABASE_ID,
        VIDEO_MEETINGS_COLLECTION_ID,
        meetingId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoMeetings'] });
    },
  });

  return {
    meetings,
    isLoading,
    error,
    createMeeting: createMeetingMutation.mutateAsync,
    deleteMeeting: deleteMeetingMutation.mutateAsync,
  };
}
