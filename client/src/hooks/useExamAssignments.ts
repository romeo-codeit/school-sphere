import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const API = '/api/cbt/exams';

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
    mutationFn: async (payload: { classIds?: string[]; studentIds?: string[] }) => {
      const jwt = await getJWT();
      const res = await fetch(`${API}/${examId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to assign exam');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['cbt-exams-assigned'] });
    }
  });

  const unassign = useMutation({
    mutationFn: async (payload: { ids: string[] }) => {
      const jwt = await getJWT();
      const res = await fetch(`${API}/${examId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to unassign exam');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['cbt-exams-assigned'] });
    }
  });

  return { useExamDoc, assign: assign.mutateAsync, unassign: unassign.mutateAsync };
}
