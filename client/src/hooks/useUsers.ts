import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useUsers() {
  const queryClient = useQueryClient();
  const { getJWT } = useAuth();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const jwt = await getJWT();
      const headers = new Headers();
      if (jwt) {
        headers.append('Authorization', `Bearer ${jwt}`);
      }
      const [studentsResponse, teachersResponse] = await Promise.all([
        fetch('/api/students', { headers }),
        fetch('/api/teachers', { headers }),
      ]);

      if (!studentsResponse.ok || !teachersResponse.ok) {
        throw new Error('Failed to fetch users');
      }

      const studentsData = await studentsResponse.json();
      const teachersData = await teachersResponse.json();

      const allUsers = [...studentsData.documents, ...teachersData.documents];
      return allUsers;
    },
  });

  const useUser = (userId: string) => {
    // This is not efficient, but it will work for now.
    // A better solution would be to have a dedicated /api/users/:id endpoint.
    const { data: user, isLoading, error } = useQuery({
      queryKey: ['users', userId],
      queryFn: async () => {
        if (!userId) return null;
        const allUsers: any[] | undefined = await queryClient.fetchQuery({ queryKey: ['users'] });
        return allUsers?.find((u: any) => u.$id === userId) || null;
      },
      enabled: !!userId,
    });

    return { user, isLoading, error };
  };

  return {
    users,
    isLoading,
    error,
    useUser,
  };
}
