import { useQuery } from '@tanstack/react-query';

const API_URL = '/api/school';

export function useSchoolData() {
  const { data: schoolData, isLoading, error } = useQuery({
    queryKey: ['schoolData'],
    queryFn: async () => {
      const response = await fetch(API_URL);
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
