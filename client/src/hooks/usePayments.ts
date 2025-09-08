import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

// TODO: Replace with your Appwrite database and collection IDs
const DATABASE_ID = 'YOUR_DATABASE_ID';
const PAYMENTS_COLLECTION_ID = 'payments';

export function usePayments() {
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, PAYMENTS_COLLECTION_ID);
      return response.documents;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await databases.createDocument(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        ID.unique(),
        paymentData
      );
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
  };
}
