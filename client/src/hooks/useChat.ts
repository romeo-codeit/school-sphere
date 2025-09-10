import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FORUM_THREADS_COLLECTION_ID = 'forum_threads';
const FORUM_REPLIES_COLLECTION_ID = 'forum_replies';
const CHAT_MESSAGES_COLLECTION_ID = 'chat_messages';

// Forum Hooks
export function useForum() {
  const queryClient = useQueryClient();

  const { data: threads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['forum_threads'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, FORUM_THREADS_COLLECTION_ID);
      return response.documents;
    },
  });

  const useReplies = (threadId: string) => {
    return useQuery({
      queryKey: ['forum_replies', threadId],
      queryFn: async () => {
        if (!threadId) return [];
        const response = await databases.listDocuments(
          DATABASE_ID,
          FORUM_REPLIES_COLLECTION_ID,
          [Query.equal('parentThreadId', threadId)]
        );
        return response.documents;
      },
      enabled: !!threadId,
    });
  };

  const createThreadMutation = useMutation({
    mutationFn: async (threadData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        FORUM_THREADS_COLLECTION_ID,
        ID.unique(),
        threadData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum_threads'] });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (replyData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        FORUM_REPLIES_COLLECTION_ID,
        ID.unique(),
        replyData
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum_replies', variables.parentThreadId] });
    },
  });

  return {
    threads,
    isLoadingThreads,
    createThread: createThreadMutation.mutateAsync,
    useReplies,
    createReply: createReplyMutation.mutateAsync,
  };
}

// Chat Hooks
export function useChat(conversationId: string) {
  const queryClient = useQueryClient();

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat_messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        [Query.equal('conversationId', conversationId)]
      );
      return response.documents;
    },
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages', conversationId] });
    },
  });

  return {
    messages,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutateAsync,
  };
}