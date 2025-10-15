import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { account } from '../lib/appwrite';
import { ID } from 'appwrite';

export function useAuth() {
  // JWT state (in-memory, not persisted)
  const [jwt, setJwt] = useState<string | null>(() => {
    try { return localStorage.getItem('appwrite_jwt'); } catch { return null; }
  });

  // Fetch JWT from Appwrite
  const getJWT = async () => {
    if (jwt) return jwt;
    try {
      const { jwt: token } = await account.createJWT();
      setJwt(token);
      try { localStorage.setItem('appwrite_jwt', token); } catch {}
      return token;
    } catch (e) {
      return null;
    }
  };
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
    mutationFn: async ({ email, password }: { email: string, password: string }) => {
      await account.createEmailPasswordSession(email, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await account.deleteSession('current');
    },
    onSuccess: () => {
      try { localStorage.removeItem('appwrite_jwt'); } catch {}
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      // If the error is because the user is not authenticated,
      // we can ignore it and still invalidate the user query.
      if (error.message.includes('missing scopes')) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name, role }: { email: string, password: string, name: string, role: string }) => {
      const newUser = await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      await account.updatePrefs({ role });
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const createUserByAdminMutation = useMutation({
    mutationFn: async ({ email, password, name, role }: { email: string, password: string, name: string, role: string }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      return response.json();
    },
    onSuccess: () => {
        // We don't need to invalidate user queries here, as the admin's session is unchanged.
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      return await account.updateName(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ oldPassword, newPassword }: { oldPassword: string, newPassword: string }) => {
      return await account.updatePassword(newPassword, oldPassword);
    }
    // No invalidation needed as session is unaffected
  });

  const userRole = user?.prefs?.role || null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: userRole,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    createUserByAdmin: createUserByAdminMutation.mutateAsync,
    updateName: updateNameMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
    getJWT,
  };
}