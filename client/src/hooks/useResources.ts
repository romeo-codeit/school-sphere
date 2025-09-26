import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, storage, client } from '../lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { useEffect } from 'react';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RESOURCES_COLLECTION_ID = 'resources';
const RESOURCES_BUCKET_ID = 'resources';

interface ResourceFilters {
    isPublic?: boolean;
    classId?: string;
}

export function useResources(filters: ResourceFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['resources', filters];

  const { data: resources, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // For students/parents, fetch public resources AND class-specific resources.
      if (filters.isPublic && filters.classId) {
        const publicQuery = databases.listDocuments(
            DATABASE_ID,
            RESOURCES_COLLECTION_ID,
            [Query.equal('isPublic', true), Query.orderDesc('$createdAt')]
        );
        const classQuery = databases.listDocuments(
            DATABASE_ID,
            RESOURCES_COLLECTION_ID,
            [Query.equal('class', filters.classId), Query.orderDesc('$createdAt')]
        );

        const [publicResources, classResources] = await Promise.all([publicQuery, classQuery]);

        // Merge and deduplicate results
        const allResources = [...publicResources.documents, ...classResources.documents];
        const uniqueResources = Array.from(new Map(allResources.map(item => [item.$id, item])).values());

        return uniqueResources;
      }

      // For admins/teachers, fetch everything.
      const response = await databases.listDocuments(
          DATABASE_ID,
          RESOURCES_COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
      );
      return response.documents;
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = `databases.${DATABASE_ID}.collections.${RESOURCES_COLLECTION_ID}.documents`;
    const unsubscribe = client.subscribe(channel, (response: RealtimeResponseEvent<any>) => {
        // A simple invalidation is fine here, as it will trigger the optimized query to re-run.
        queryClient.invalidateQueries({ queryKey: ['resources'] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => storage.createFile(RESOURCES_BUCKET_ID, ID.unique(), file),
  });

  const createResourceMutation = useMutation({
    mutationFn: (resourceData: any) => databases.createDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, ID.unique(), resourceData),
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, ...resourceData }: { id: string; [key: string]: any }) =>
        databases.updateDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, id, resourceData),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async ({ resourceId, fileId }: { resourceId: string, fileId: string }) => {
      await databases.deleteDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId);
      if (fileId) {
        await storage.deleteFile(RESOURCES_BUCKET_ID, fileId);
      }
    },
  });

  const getFilePreview = (fileId: string) => {
      if (!fileId) return null;
      return storage.getFilePreview(RESOURCES_BUCKET_ID, fileId);
  };

  const getFileDownload = (fileId: string) => {
      if (!fileId) return null;
      return storage.getFileDownload(RESOURCES_BUCKET_ID, fileId);
  };

  return {
    resources,
    isLoading,
    error,
    uploadFile: uploadFileMutation.mutateAsync,
    createResource: createResourceMutation.mutateAsync,
    updateResource: updateResourceMutation.mutateAsync,
    deleteResource: deleteResourceMutation.mutateAsync,
    getFilePreview,
    getFileDownload,
  };
}