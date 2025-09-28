import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USER_SETTINGS_COLLECTION = 'userSettings';
const USER_PROFILES_COLLECTION = 'userProfiles';

export function useUserSettings(userId) {
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['userSettings', userId],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, USER_SETTINGS_COLLECTION, [
        Query.equal('userId', userId)
      ]);
      return res.documents[0];
    },
    enabled: !!userId,
  });

  // Upsert user settings
  const upsertMutation = useMutation({
    mutationFn: async (data) => {
      if (settings && settings.$id) {
        return await databases.updateDocument(DATABASE_ID, USER_SETTINGS_COLLECTION, settings.$id, data);
      } else {
        return await databases.createDocument(DATABASE_ID, USER_SETTINGS_COLLECTION, ID.unique(), { ...data, userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings', userId] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    upsertUserSettings: upsertMutation.mutateAsync,
  };
}

export function useUserProfile(userId) {
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, USER_PROFILES_COLLECTION, [
        Query.equal('userId', userId)
      ]);
      return res.documents[0];
    },
    enabled: !!userId,
  });

  // Upsert user profile
  const upsertMutation = useMutation({
    mutationFn: async (data) => {
      if (profile && profile.$id) {
        return await databases.updateDocument(DATABASE_ID, USER_PROFILES_COLLECTION, profile.$id, data);
      } else {
        return await databases.createDocument(DATABASE_ID, USER_PROFILES_COLLECTION, ID.unique(), { ...data, userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    upsertUserProfile: upsertMutation.mutateAsync,
  };
}
