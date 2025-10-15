import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const API_URL = '/api/school';

export function useSchoolData() {
  const { getJWT } = useAuth();
  const { data: schoolData, isLoading, error } = useQuery({
    queryKey: ['schoolData'],
    queryFn: async () => {
      const jwt = await getJWT();
      const response = await fetch(API_URL, { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
      if (!response.ok) {
        throw new Error('Failed to fetch school data');
      }
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
