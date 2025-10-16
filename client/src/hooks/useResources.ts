import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, storage, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RESOURCES_COLLECTION_ID = 'resources';
const CLASSES_COLLECTION_ID = 'classes';
const BUCKET_ID = 'resources';

interface ResourceFilters {
  isPublic?: boolean;
  classId?: string;
}

export function useResources(filters: ResourceFilters = {}) {
  const queryClient = useQueryClient();
  const { classId } = filters;

  const queryKey = ['resources', { classId }];

  const { data: resources, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // For admin/teacher, no classId is passed, so fetch all.
      if (!classId) {
        const response = await databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID, [Query.orderDesc('$createdAt')]);
        return response.documents;
      }

      // For students/parents, fetch public resources AND resources for their class.
      let className = null;
      try {
        const classDoc = await databases.getDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId);
        className = classDoc.name;
      } catch (e) {
      }

      const publicPromise = databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID, [Query.equal('isPublic', true)]);
      const classPromise = className
        ? databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID, [Query.equal('class', className)])
        : Promise.resolve({ documents: [] });

      const [publicResponse, classResponse] = await Promise.all([publicPromise, classPromise]);

      const allDocs = [...publicResponse.documents, ...classResponse.documents];
      const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.$id, doc])).values());

      return uniqueDocs.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      return storage.createFile(BUCKET_ID, ID.unique(), file);
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      return databases.createDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, ID.unique(), resourceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      const { id, ...data } = resourceData;
      return databases.updateDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async ({ resourceId, fileId }: { resourceId: string, fileId: string }) => {
      await databases.deleteDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId);
      if (fileId) {
        await storage.deleteFile(BUCKET_ID, fileId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const getFilePreview = (fileId: string) => {
    return storage.getFilePreview(BUCKET_ID, fileId);
  }

  const getFileDownload = (fileId: string) => {
    return storage.getFileDownload(BUCKET_ID, fileId);
  }

  return {
    resources,
    isLoading,
    error,
    createResource: createResourceMutation.mutateAsync,
    updateResource: updateResourceMutation.mutateAsync,
    deleteResource: deleteResourceMutation.mutateAsync,
    uploadFile: uploadFileMutation.mutateAsync,
    getFilePreview,
    getFileDownload,
  };
}