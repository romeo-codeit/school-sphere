import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { account } from '../lib/appwrite';
import { ID } from 'appwrite';
import { isOnline, queueAppwriteOperation } from '@/lib/offline';

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
const withBase = (url: string) => (/^https?:\/\//i.test(url) ? url : `${API_BASE}${url}`);

export function useAuth() {
  // JWT state (in-memory, not persisted)
  const [jwt, setJwt] = useState<string | null>(() => {
    try { return localStorage.getItem('appwrite_jwt'); } catch { return null; }
  });

  // Return JWT from local state/storage only; do not call account.createJWT() here to avoid CORS
  const getJWT = async () => {
    if (jwt) return jwt;
    try {
      const token = localStorage.getItem('appwrite_jwt');
      if (token) { setJwt(token); return token; }
    } catch {}
    return null;
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

  // Bootstrap HttpOnly auth cookie on load if we have a JWT in localStorage
  useEffect(() => {
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('appwrite_jwt');
        if (!token) return;
        await fetch(withBase('/api/auth/jwt-cookie'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt: token }),
          credentials: 'include',
        });
      } catch {}
    })();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string, password: string }) => {
      const sess = await account.createEmailPasswordSession(email, password);
      // Switch to HttpOnly cookie auth: set cookies even if JWT creation fails (mobile safe)
      let token: string | null = null;
      try {
        const created = await account.createJWT();
        token = created?.jwt || null;
      } catch {}
      await fetch(withBase('/api/auth/jwt-cookie'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jwt: token || undefined, session: (sess as any)?.$id || '' }),
        credentials: 'include',
      });
      if (token) { try { localStorage.setItem('appwrite_jwt', token); } catch {} }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await account.deleteSession('current');
      await fetch(withBase('/api/auth/logout'), { method: 'POST', credentials: 'include' });
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
      try {
        const { jwt: token } = await account.createJWT();
        await fetch(withBase('/api/auth/jwt-cookie'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt: token }),
          credentials: 'include',
        });
        try { localStorage.setItem('appwrite_jwt', token); } catch {}
      } catch {}
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const createUserByAdminMutation = useMutation({
    mutationFn: async ({ email, password, name, role }: { email: string, password: string, name: string, role: string }) => {
      const base = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
      const response = await fetch(base + '/api/users', {
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
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'update',
          collection: 'users',
          docId: 'me',
          data: { name },
        });
        return { offline: true };
      }
      return await account.updateName(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ oldPassword, newPassword }: { oldPassword: string, newPassword: string }) => {
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'update',
          collection: 'users',
          docId: 'me',
          data: { newPassword, oldPassword },
        });
        return { offline: true };
      }
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