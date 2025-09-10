import { useQuery } from '@tanstack/react-query';
import { useStudents } from './useStudents';
import { useTeachers } from './useTeachers';
import { usePayments } from './usePayments';
import { useAttendance } from './useAttendance';

export function useDashboard() {
  const { students, isLoading: isLoadingStudents } = useStudents();
  const { teachers, isLoading: isLoadingTeachers } = useTeachers();
  const { payments, isLoading: isLoadingPayments } = usePayments();
  const { attendance, isLoading: isLoadingAttendance } = useAttendance();

  const isLoading = isLoadingStudents || isLoadingTeachers || isLoadingPayments || isLoadingAttendance;

  const stats = {
    totalStudents: students?.length || 0,
    activeTeachers: teachers?.filter(t => t.status === 'active').length || 0,
    pendingPayments: payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0,
    averageAttendance: 0, // Will calculate below
  };

  // Calculate average attendance
  if (attendance && students && students.length > 0) {
    const totalMarkedRecords = attendance.filter(a => a.status === 'present' || a.status === 'absent').length;
    const presentRecords = attendance.filter(a => a.status === 'present').length;
    stats.averageAttendance = totalMarkedRecords > 0 ? (presentRecords / totalMarkedRecords) * 100 : 0;
  }

  return {
    stats,
    isLoading,
    error: null, // Handle errors from individual hooks if needed
  };
}
