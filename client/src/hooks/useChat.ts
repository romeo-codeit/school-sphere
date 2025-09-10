import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client, { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { useEffect } from 'react';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FORUM_THREADS_COLLECTION_ID = 'forumThreads';
const CHAT_MESSAGES_COLLECTION_ID = 'chatMessages';

export function useForum() {
  const queryClient = useQueryClient();

  const { data: threads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['forumThreads'],
    queryFn: async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FORUM_THREADS_COLLECTION_ID,
        [Query.isNull('parentThreadId'), Query.orderDesc('$createdAt')]
      );
      return response.documents;
    },
  });

  const useReplies = (threadId: string) => {
    return useQuery({
      queryKey: ['forumReplies', threadId],
      queryFn: async () => {
        const response = await databases.listDocuments(
          DATABASE_ID,
          FORUM_THREADS_COLLECTION_ID,
          [Query.equal('parentThreadId', threadId), Query.orderAsc('$createdAt')]
        );
        return response.documents;
      },
      enabled: !!threadId,
    });
  };

  const createThreadMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; createdBy: string }) => {
      return databases.createDocument(DATABASE_ID, FORUM_THREADS_COLLECTION_ID, ID.unique(), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (data: { content: string; createdBy: string; parentThreadId: string }) => {
      return databases.createDocument(DATABASE_ID, FORUM_THREADS_COLLECTION_ID, ID.unique(), data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', variables.parentThreadId] });
    },
  });

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${FORUM_THREADS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const payload: any = response.payload;
          if (payload.parentThreadId) {
            queryClient.invalidateQueries({ queryKey: ['forumReplies', payload.parentThreadId] });
          } else {
            queryClient.invalidateQueries({ queryKey: ['forumThreads'] });
          }
        }
      }
    );
    return () => unsubscribe();
  }, [queryClient]);

  return {
    threads,
    isLoadingThreads,
    createThread: createThreadMutation.mutateAsync,
    useReplies,
    createReply: createReplyMutation.mutateAsync,
  };
}

export function useChat(conversationId: string) {
    const queryClient = useQueryClient();

    const { data: messages, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['chatMessages', conversationId],
        queryFn: async () => {
            const response = await databases.listDocuments(
                DATABASE_ID,
                CHAT_MESSAGES_COLLECTION_ID,
                [Query.equal('conversationId', conversationId), Query.orderDesc('$createdAt'), Query.limit(50)]
            );
            return response.documents.reverse();
        },
        enabled: !!conversationId,
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (data: { content: string; senderId: string; conversationId: string }) => {
            return databases.createDocument(DATABASE_ID, CHAT_MESSAGES_COLLECTION_ID, ID.unique(), data);
        },
    });

    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = client.subscribe(
            `databases.${DATABASE_ID}.collections.${CHAT_MESSAGES_COLLECTION_ID}.documents`,
            (response) => {
                if (response.events.some(event => event.endsWith('.create'))) {
                    const newMessage: any = response.payload;
                    if (newMessage.conversationId === conversationId) {
                        queryClient.setQueryData(['chatMessages', conversationId], (oldData: any) => {
                            return oldData ? [...oldData, newMessage] : [newMessage];
                        });
                    }
                }
            }
        );

        return () => unsubscribe();
    }, [conversationId, queryClient]);

    return {
        messages,
        isLoadingMessages,
        sendMessage: sendMessageMutation.mutateAsync,
    };
}
