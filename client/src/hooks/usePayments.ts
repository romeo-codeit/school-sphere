import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = '/api/payments';

export function usePayments(studentId?: string) {
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments', studentId],
    queryFn: async () => {
      let url = API_URL;
      if (studentId) {
        url += `?studentId=${studentId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      return data.documents.map((doc: any) => ({
        $id: doc.$id,
        purpose: doc.purpose as string,
        amount: doc.amount as number,
        status: doc.status as 'paid' | 'pending' | 'overdue',
        paidDate: doc.paidDate as string | undefined,
        dueDate: doc.dueDate as string,
      }));
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) {
        throw new Error('Failed to create payment');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, paymentData }: { paymentId: string, paymentData: any }) => {
      const response = await fetch(`${API_URL}/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) {
        throw new Error('Failed to update payment');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`${API_URL}/${paymentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  return {
    payments,
    isLoading,
    error,
    createPayment: createPaymentMutation.mutateAsync,
    updatePayment: updatePaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync,
  };
}