import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

// TODO: Replace with your Appwrite database and collection IDs
const DATABASE_ID = 'YOUR_DATABASE_ID';
const RESOURCES_COLLECTION_ID = 'resources';

export function useResources() {
  const queryClient = useQueryClient();

  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID);
      return response.documents;
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        RESOURCES_COLLECTION_ID,
        ID.unique(),
        resourceData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  return {
    resources,
    isLoading,
    error,
    createResource: createResourceMutation.mutateAsync,
  };
}
