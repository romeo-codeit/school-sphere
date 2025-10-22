import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ID } from 'appwrite';
import { isOnline, queueRequest } from '@/lib/offline';
import { apiRequest } from '@/lib/queryClient';

const PAGE_SIZE = 50;

export function usePayments(studentId?: string) {
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments', studentId],
    queryFn: async () => {
      const url = new URL('/api/payments', window.location.origin);
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (studentId) url.searchParams.set('studentId', studentId);
      const res = await apiRequest('GET', url.pathname + url.search);
      const data = await res.json();
      return data?.documents || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      if (!isOnline()) {
        await queueRequest({
          url: `${import.meta.env.BASE_URL || ''}api/payments`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });
        return { offline: true, local: true, paymentData };
      }
      const res = await apiRequest('POST', '/api/payments', paymentData);
      return await res.json();
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
        await queueRequest({
          url: `${import.meta.env.BASE_URL || ''}api/payments/${encodeURIComponent(paymentId)}`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });
        return { offline: true, local: true, paymentId, paymentData };
      }
      const res = await apiRequest('PUT', `/api/payments/${encodeURIComponent(paymentId)}`, paymentData);
      return await res.json();
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
        await queueRequest({
          url: `${import.meta.env.BASE_URL || ''}api/payments/${encodeURIComponent(paymentId)}`,
          method: 'DELETE',
        });
        return { offline: true, local: true, paymentId };
      }
      const res = await apiRequest('DELETE', `/api/payments/${encodeURIComponent(paymentId)}`);
      return await res.json();
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