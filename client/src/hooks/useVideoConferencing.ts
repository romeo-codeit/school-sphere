import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MEETINGS_COLLECTION_ID = 'meetings';

export function useVideoConferencing() {
  const queryClient = useQueryClient();

  const { data: meetings, isLoading, error } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION_ID);
      return response.documents;
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        MEETINGS_COLLECTION_ID,
        ID.unique(),
        meetingData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, ...meetingData }: { id: string; [key: string]: any }) => {
      return await databases.updateDocument(
        DATABASE_ID,
        MEETINGS_COLLECTION_ID,
        id,
        meetingData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      return await databases.deleteDocument(
        DATABASE_ID,
        MEETINGS_COLLECTION_ID,
        meetingId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
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