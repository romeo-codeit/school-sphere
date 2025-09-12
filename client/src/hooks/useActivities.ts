import { useQuery } from '@tanstack/react-query';
import { 
  UserPlus,
  CreditCard,
  FileText,
  TriangleAlert,
} from "lucide-react";

// Mock data for recent activities
const mockActivities = [
  {
    icon: UserPlus,
    description: "New student registration completed",
    timestamp: "2 minutes ago",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: CreditCard,
    description: "Payment received from student",
    timestamp: "15 minutes ago",
    color: "bg-secondary/10 text-secondary"
  },
  {
    icon: FileText,
    description: "New JAMB questions uploaded",
    timestamp: "1 hour ago",
    color: "bg-accent/10 text-accent"
  },
  {
    icon: TriangleAlert,
    description: "Payment overdue alert for 3 students",
    timestamp: "2 hours ago",
    color: "bg-destructive/10 text-destructive"
  }
];

export function useActivities() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return new Promise(resolve => setTimeout(() => resolve(mockActivities), 1000));
    },
  });

  return { activities, isLoading, error };
}
