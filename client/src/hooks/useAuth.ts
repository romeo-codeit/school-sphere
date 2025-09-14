import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { account } from '../lib/appwrite';
import { ID } from 'appwrite';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await account.get();
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      await account.createEmailPasswordSession(email, password);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await account.deleteSession('current');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name, role }) => {
      await account.create(ID.unique(), email, password, name);
      // Log in the user after registration
      await account.createEmailPasswordSession(email, password);
      // After creating the user, we need to update their prefs to store the role.
      await account.updatePrefs({ role });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const createUserByAdminMutation = useMutation({
    mutationFn: async ({ email, password, name, role }) => {
      // This function does NOT log in the new user, so it's safe for an admin to call.
      const newUser = await account.create(ID.unique(), email, password, name);
      await account.updatePrefs(newUser.$id, { role });
    },
    onSuccess: () => {
        // We don't need to invalidate user queries here, as the admin's session is unchanged.
    },
  });

  const userRole = user?.prefs?.role || null;

  const createUserByAdminMutation = useMutation({
    mutationFn: async ({ email, password, name, role }) => {
      // This function does NOT log in the new user, so it's safe for an admin to call.
      const newUser = await account.create(ID.unique(), email, password, name);
      await account.updatePrefs(newUser.$id, { role });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: userRole,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    createUserByAdmin: createUserByAdminMutation.mutateAsync,
  };
}