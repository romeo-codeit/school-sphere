import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

// TODO: Replace with your Appwrite database and collection IDs
const DATABASE_ID = 'YOUR_DATABASE_ID';
const MESSAGES_COLLECTION_ID = 'messages';

export function useMessages() {
  const queryClient = useQueryClient();

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID);
      return response.documents;
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    createMessage: createMessageMutation.mutateAsync,
  };
}
