import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, client } from '../lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { useEffect } from 'react';
import { useAuth } from './useAuth';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FORUM_COLLECTION_ID = 'forumThreads';
const CHAT_MESSAGES_COLLECTION_ID = 'chatMessages';
const CONVERSATIONS_COLLECTION_ID = 'conversations';
const USERS_COLLECTION_ID = 'users'; // Assuming user data is queryable

// Forum Hooks
export function useForum() {
    // ... (existing forum code remains the same)
  const queryClient = useQueryClient();

  // Fetch only top-level threads
  const { data: threads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['forum_threads'],
    queryFn: async () => {
      const response = await databases.listDocuments(
          DATABASE_ID,
          FORUM_COLLECTION_ID,
          [Query.isNull('parentThreadId'), Query.orderDesc('$createdAt')]
      );
      return response.documents;
    },
  });

  // Real-time subscription for forum
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${FORUM_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<any>) => {
        const payload = response.payload;

        if (payload.parentThreadId) {
            queryClient.setQueryData(['forum_replies', payload.parentThreadId], (oldData: any[] | undefined) => {
                if (!oldData || oldData.some(reply => reply.$id === payload.$id)) return oldData || [];
                return [...oldData, payload];
            });
        } else {
            queryClient.setQueryData(['forum_threads'], (oldData: any[] | undefined) => {
                if (!oldData || oldData.some(thread => thread.$id === payload.$id)) return oldData || [];
                return [payload, ...oldData];
            });
        }
      }
    );

    return () => unsubscribe();
  }, [queryClient]);

  const useReplies = (threadId: string) => {
    return useQuery({
      queryKey: ['forum_replies', threadId],
      queryFn: async () => {
        if (!threadId) return [];
        const response = await databases.listDocuments(
          DATABASE_ID,
          FORUM_COLLECTION_ID,
          [Query.equal('parentThreadId', threadId), Query.orderAsc('$createdAt')]
        );
        return response.documents;
      },
      enabled: !!threadId,
    });
  };

  const createThreadMutation = useMutation({
    mutationFn: (threadData: any) => databases.createDocument(DATABASE_ID, FORUM_COLLECTION_ID, ID.unique(), threadData),
  });

  const createReplyMutation = useMutation({
    mutationFn: (replyData: any) => databases.createDocument(DATABASE_ID, FORUM_COLLECTION_ID, ID.unique(), replyData),
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, data }: { postId: string, data: { title?: string, content: string } }) =>
        databases.updateDocument(DATABASE_ID, FORUM_COLLECTION_ID, postId, data),
  });

  const deletePostMutation = useMutation({
      mutationFn: (postId: string) => databases.deleteDocument(DATABASE_ID, FORUM_COLLECTION_ID, postId),
  });

  return {
    threads,
    isLoadingThreads,
    createThread: createThreadMutation.mutateAsync,
    useReplies,
    createReply: createReplyMutation.mutateAsync,
    updatePost: updatePostMutation.mutateAsync,
    deletePost: deletePostMutation.mutateAsync,
  };
}

// Chat Hooks
export function useConversations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: conversations, isLoading } = useQuery({
        queryKey: ['conversations', user?.$id],
        queryFn: async () => {
            if (!user?.$id) return [];
      try {
        // Try to sort by lastActivity first (if attribute exists)
        const response = await databases.listDocuments(
          DATABASE_ID,
          CONVERSATIONS_COLLECTION_ID,
          [Query.contains('members', [user.$id]), Query.orderDesc('lastActivity')]
        );
        return response.documents;
      } catch (error: any) {
        // Fallback to $createdAt if lastActivity doesn't exist yet
        if (error?.message?.includes('lastActivity')) {
          console.log('Note: lastActivity attribute not found. Using $createdAt for sorting. See docs/ADD_LASTACTIVITY_ATTRIBUTE.md');
          const response = await databases.listDocuments(
            DATABASE_ID,
            CONVERSATIONS_COLLECTION_ID,
            [Query.contains('members', [user.$id]), Query.orderDesc('$createdAt')]
          );
          return response.documents;
        }
        throw error;
      }
        },
        enabled: !!user?.$id,
    });

    // Real-time subscription for conversations
    useEffect(() => {
        if (!user?.$id) return;
        const channel = `databases.${DATABASE_ID}.collections.${CONVERSATIONS_COLLECTION_ID}.documents`;
        const unsubscribe = client.subscribe(channel, (response: RealtimeResponseEvent<any>) => {
            // If the current user is a member of the conversation, update the list
            if (response.payload.members.includes(user.$id)) {
                 queryClient.invalidateQueries({ queryKey: ['conversations', user.$id] });
            }
        });
        return () => unsubscribe();
    }, [user?.$id, queryClient]);

    return { conversations, isLoading };
}

export function useChat(conversationId: string) {
  const queryClient = useQueryClient();

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat_messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        [Query.equal('conversationId', conversationId), Query.orderAsc('$createdAt')]
      );
      return response.documents;
    },
    enabled: !!conversationId,
  });

  // Real-time subscription for chat messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = `databases.${DATABASE_ID}.collections.${CHAT_MESSAGES_COLLECTION_ID}.documents`;
    const unsubscribe = client.subscribe(channel, (response: RealtimeResponseEvent<any>) => {
      if (response.payload.conversationId === conversationId) {
        queryClient.setQueryData(['chat_messages', conversationId], (oldData: any[] | undefined) => {
          if (!oldData || oldData.some(msg => msg.$id === response.payload.$id)) return oldData || [];
          return [...oldData, response.payload];
        });
      }
    });

    return () => unsubscribe();
  }, [conversationId, queryClient]);


  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
        const message = await databases.createDocument(DATABASE_ID, CHAT_MESSAGES_COLLECTION_ID, ID.unique(), messageData);
        // Update the conversation's last activity and message (if attributes exist)
        try {
          const updateData: any = {};
          
          // Try to update lastActivity if it exists
          updateData.lastActivity = new Date().toISOString();
          
          // Try to update lastMessage if it exists
          updateData.lastMessage = message.content.substring(0, 100); // Limit preview length
          
          await databases.updateDocument(DATABASE_ID, CONVERSATIONS_COLLECTION_ID, message.conversationId, updateData);
        } catch (e: any) {
          // Log but don't fail if attributes don't exist yet
          if (e?.message?.includes('lastActivity') || e?.message?.includes('lastMessage')) {
            console.log('Note: Optional conversation attributes not available. See docs/ADD_LASTACTIVITY_ATTRIBUTE.md');
          }
        }
        return message;
    },
  });

  const createConversationMutation = useMutation({
      mutationFn: async (conversationData: { members: string[], name?: string, isGroup?: boolean }) => {
          // Try to add lastActivity if the attribute exists
          const dataWithActivity: any = { ...conversationData };
          
          try {
            dataWithActivity.lastActivity = new Date().toISOString();
          } catch (e) {
            // Attribute doesn't exist yet, that's okay
          }
          
          return await databases.createDocument(DATABASE_ID, CONVERSATIONS_COLLECTION_ID, ID.unique(), dataWithActivity);
      }
  });

  return {
    messages,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutateAsync,
    createConversation: createConversationMutation.mutateAsync,
  };
}

export function useUsers() {
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            // This is a placeholder. In a real Appwrite app, you'd fetch users
            // via a secure cloud function or have a 'profiles' collection.
            // For now, we'll assume a 'profiles' collection exists.
            try {
                const response = await databases.listDocuments(DATABASE_ID, 'teachers');
                const response2 = await databases.listDocuments(DATABASE_ID, 'students');
                return [...response.documents, ...response2.documents];
            } catch (e) {
                return [];
            }
        },
    });
    return { users, isLoading };
}