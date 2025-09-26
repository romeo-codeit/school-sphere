import { useQuery } from '@tanstack/react-query';
import { 
  UserPlus,
  CreditCard,
  FileText,
  TriangleAlert,
} from "lucide-react";

const API_URL = '/api/activities';

const iconMap = {
  new_student: UserPlus,
  payment_received: CreditCard,
  exam_uploaded: FileText,
  payment_overdue: TriangleAlert,
};

const colorMap = {
  new_student: "bg-primary/10 text-primary",
  payment_received: "bg-secondary/10 text-secondary",
  exam_uploaded: "bg-accent/10 text-accent",
  payment_overdue: "bg-destructive/10 text-destructive",
};

export function useActivities() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data = await response.json();
      return data.documents.map(activity => ({
        ...activity,
        icon: iconMap[activity.type] || TriangleAlert,
        color: colorMap[activity.type] || "bg-gray-500/10 text-gray-500",
      }));
    },
  });

  return { activities, isLoading, error };
}
