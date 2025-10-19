import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { isOnline, queueAppwriteOperation } from '@/lib/offline';

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
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'create',
          collection: PAYMENTS_COLLECTION_ID,
          data: paymentData,
        });
        return { offline: true, local: true, paymentData };
      }
      return await databases.createDocument(DATABASE_ID, PAYMENTS_COLLECTION_ID, ID.unique(), paymentData);
    },
    onSuccess: (result: any) => {
      // If operation was queued offline and returned local payment data, add placeholder to cache
      if (result && result.local && result.paymentData) {
        const placeholder = {
          $id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ...result.paymentData,
          status: result.paymentData.status || 'pending',
          offline: true,
          $createdAt: new Date().toISOString(),
        };
        const key = ['payments', studentId];
        const prev = queryClient.getQueryData<any[]>(key) || [];
        queryClient.setQueryData(key, [placeholder, ...prev]);
      }
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, paymentData }: { paymentId: string, paymentData: any }) => {
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'update',
          collection: PAYMENTS_COLLECTION_ID,
          docId: paymentId,
          data: paymentData,
        });
        return { offline: true, local: true, paymentId, paymentData };
      }
      return await databases.updateDocument(DATABASE_ID, PAYMENTS_COLLECTION_ID, paymentId, paymentData);
    },
    onSuccess: (result: any) => {
      if (result && result.local && result.paymentId) {
        const key = ['payments', studentId];
        const prev = queryClient.getQueryData<any[]>(key) || [];
        const updated = prev.map(p => p.$id === result.paymentId ? { ...p, ...result.paymentData, offline: true } : p);
        queryClient.setQueryData(key, updated);
      }
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!isOnline()) {
        await queueAppwriteOperation({
          op: 'delete',
          collection: PAYMENTS_COLLECTION_ID,
          docId: paymentId,
        });
        return { offline: true, local: true, paymentId };
      }
      return await databases.deleteDocument(DATABASE_ID, PAYMENTS_COLLECTION_ID, paymentId);
    },
    onSuccess: (result: any) => {
      if (result && result.local && result.paymentId) {
        const key = ['payments', studentId];
        const prev = queryClient.getQueryData<any[]>(key) || [];
        const updated = prev.filter(p => p.$id !== result.paymentId);
        queryClient.setQueryData(key, updated);
      }
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