import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
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

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, ...resourceData }: { id: string; [key: string]: any }) => {
      return await databases.updateDocument(
        DATABASE_ID,
        RESOURCES_COLLECTION_ID,
        id,
        resourceData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await databases.deleteDocument(
        DATABASE_ID,
        RESOURCES_COLLECTION_ID,
        id
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
    updateResource: updateResourceMutation.mutateAsync,
    deleteResource: deleteResourceMutation.mutateAsync,
  };
}
}