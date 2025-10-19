import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, storage, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { isOnline, queueAppwriteOperation } from '@/lib/offline';

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
      if (!isOnline()) throw new Error('Cannot upload files while offline');
      return storage.createFile(BUCKET_ID, ID.unique(), file);
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'create',
          collection: RESOURCES_COLLECTION_ID,
          data: resourceData,
        });
        return { offline: true, local: true, resourceData };
      }
      return databases.createDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, ID.unique(), resourceData);
    },
    onSuccess: (result: any) => {
      if (result && result.local && result.resourceData) {
        const placeholder = { $id: `offline-${Date.now()}`, ...result.resourceData, offline: true, $createdAt: new Date().toISOString() };
        const key = ['resources', { classId }];
        const prev = queryClient.getQueryData<any[]>(key) || [];
        queryClient.setQueryData(key, [placeholder, ...prev]);
      }
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      const { id, ...data } = resourceData;
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'update',
          collection: RESOURCES_COLLECTION_ID,
          docId: id,
          data,
        });
        return { offline: true, local: true, id, data };
      }
      return databases.updateDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, id, data);
    },
    onSuccess: (result: any) => {
      if (result && result.local && result.id) {
        const key = ['resources', { classId }];
        const prev = queryClient.getQueryData<any[]>(key) || [];
        const updated = prev.map(p => p.$id === result.id ? { ...p, ...result.data, offline: true } : p);
        queryClient.setQueryData(key, updated);
      }
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async ({ resourceId, fileId }: { resourceId: string, fileId: string }) => {
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'delete',
          collection: RESOURCES_COLLECTION_ID,
          docId: resourceId,
        });
        return { offline: true, local: true, resourceId };
      }
      await databases.deleteDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId);
      if (fileId) {
        await storage.deleteFile(BUCKET_ID, fileId);
      }
    },
    onSuccess: (result: any) => {
      if (result && result.local && result.resourceId) {
        const key = ['resources', { classId }];
        const prev = queryClient.getQueryData<any[]>(key) || [];
        const updated = prev.filter(p => p.$id !== result.resourceId);
        queryClient.setQueryData(key, updated);
      }
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