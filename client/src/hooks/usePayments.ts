import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PAYMENTS_COLLECTION_ID = 'payments';

export function usePayments(studentId?: string) {
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments', studentId],
    queryFn: async () => {
      const queries = [
        Query.orderDesc('$createdAt')
      ];
      if (studentId) {
        queries.push(Query.equal('studentId', studentId));
      }
      const response = await databases.listDocuments(DATABASE_ID, PAYMENTS_COLLECTION_ID, queries);
      return response.documents;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await databases.createDocument(DATABASE_ID, PAYMENTS_COLLECTION_ID, ID.unique(), paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, paymentData }: { paymentId: string, paymentData: any }) => {
      return await databases.updateDocument(DATABASE_ID, PAYMENTS_COLLECTION_ID, paymentId, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await databases.deleteDocument(DATABASE_ID, PAYMENTS_COLLECTION_ID, paymentId);
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