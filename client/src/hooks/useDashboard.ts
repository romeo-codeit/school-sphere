import { useQuery } from '@tanstack/react-query';
import { useStudents } from './useStudents';
import { useResources } from './useResources';
import { usePayments } from './usePayments';

export function useDashboard() {
  const { students } = useStudents();
  const { resources } = useResources();
  const { payments } = usePayments();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats', students, resources, payments],
    queryFn: () => {
      // TODO: This is a client-side calculation. For better performance,
      // this should be moved to an Appwrite Function.
      const totalStudents = students?.length || 0;
      const totalResources = resources?.length || 0;
      const totalPayments = payments?.length || 0;
      const pendingPayments = payments?.filter((p: any) => p.status === 'pending').length || 0;

      // These are placeholders as we don't have teacher data yet.
      const activeTeachers = 0;
      const averageAttendance = '0%';

      return {
        totalStudents,
        totalResources,
        totalPayments,
        pendingPayments,
        activeTeachers,
        averageAttendance,
      };
    },
    enabled: !!students && !!resources && !!payments,
  });

  return {
    stats,
    isLoading,
  };
}
