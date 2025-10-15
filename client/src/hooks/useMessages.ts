import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { isOnline, queueAppwriteOperation } from '@/lib/offline';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
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
      if (!isOnline()) {
        // Optimistic update
        queryClient.setQueryData<any[]>(['messages'], (old) => {
          const arr = Array.isArray(old) ? old.slice() : [];
          arr.unshift({ ...messageData, $id: `temp-${Date.now()}`, __optimistic: true });
          return arr;
        });
        await queueAppwriteOperation({ op: 'create', collection: MESSAGES_COLLECTION_ID, data: messageData });
        return { ok: true } as any;
      }
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

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, ...messageData }: { id: string; [key: string]: any }) => {
      if (!isOnline()) {
        queryClient.setQueryData<any[]>(['messages'], (old) => {
          const arr = Array.isArray(old) ? old.map((m) => (m.$id === id ? { ...m, ...messageData } : m)) : old;
          return arr as any[];
        });
        await queueAppwriteOperation({ op: 'update', collection: MESSAGES_COLLECTION_ID, docId: id, data: messageData });
        return { ok: true } as any;
      }
      return await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        id,
        messageData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline()) {
        queryClient.setQueryData<any[]>(['messages'], (old) => {
          const arr = Array.isArray(old) ? old.filter((m) => m.$id !== id) : old;
          return arr as any[];
        });
        await queueAppwriteOperation({ op: 'delete', collection: MESSAGES_COLLECTION_ID, docId: id });
        return { ok: true } as any;
      }
      return await databases.deleteDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        id
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
    updateMessage: updateMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
  };
}