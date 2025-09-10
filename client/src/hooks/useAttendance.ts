import { useQuery } from '@tanstack/react-query';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ATTENDANCE_COLLECTION_ID = 'attendance';

export function useAttendance() {
  const { data: attendance, isLoading, error } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, ATTENDANCE_COLLECTION_ID);
      return response.documents;
    },
  });

  return {
    attendance,
    isLoading,
    error,
  };
}
