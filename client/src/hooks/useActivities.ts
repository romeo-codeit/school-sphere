import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { 
  UserPlus,
  CreditCard,
  FileText,
  TriangleAlert,
} from "lucide-react";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ACTIVITIES_COLLECTION_ID = 'activities';

const iconMap: { [key: string]: React.ElementType } = {
  new_student: UserPlus,
  payment_received: CreditCard,
  exam_uploaded: FileText,
  payment_overdue: TriangleAlert,
};

const colorMap: { [key: string]: string } = {
  new_student: "bg-primary/10 text-primary",
  payment_received: "bg-secondary/10 text-secondary",
  exam_uploaded: "bg-accent/10 text-accent",
  payment_overdue: "bg-destructive/10 text-destructive",
};

export function useActivities() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await databases.listDocuments(DATABASE_ID, ACTIVITIES_COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
        Query.limit(10),
      ]);
      return response.documents.map((activity: any) => ({
        ...activity,
        icon: iconMap[activity.type] || TriangleAlert,
        color: colorMap[activity.type] || "bg-gray-500/10 text-gray-500",
      }));
    },
  });

  return { activities, isLoading, error };
}