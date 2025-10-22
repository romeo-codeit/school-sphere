import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const API = '/api/cbt/exams';

// Assigned exams feature removed on server; keep a defensive stub that throws with a clear message
export function useExamAssignments(examId?: string) {
  const { getJWT } = useAuth();
  const queryClient = useQueryClient();

  const useExamDoc = (id?: string) => useQuery({
    queryKey: ['exam', id],
    enabled: !!id,
    queryFn: async () => {
      const jwt = await getJWT();
      const res = await fetch(`${API}/${id}`, { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
      if (!res.ok) throw new Error('Failed to fetch exam');
      return await res.json();
    }
  });

  const assign = useMutation({
    mutationFn: async () => {
      throw new Error('Exam assignment feature is disabled.');
    },
  });

  const unassign = useMutation({
    mutationFn: async () => {
      throw new Error('Exam assignment feature is disabled.');
    },
  });

  return { useExamDoc, assign: assign.mutateAsync, unassign: unassign.mutateAsync };
}
