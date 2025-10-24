import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

export function useSchoolData() {
  const { getJWT } = useAuth();
  const { data: schoolData, isLoading, error } = useQuery({
    queryKey: ['schoolData'],
    queryFn: async () => {
      const jwt = await getJWT();
      const response = await apiRequest('GET', '/api/school');
      const data = await response.json();
      // Assuming the school data is a single document
      return data.documents[0];
    },
  });

  return {
    schoolData,
    isLoading,
    error,
  };
}
