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
    activeTeachers: teachers?.filter((t: any) => t.status === 'active').length || 0,
    pendingPayments: payments?.filter((p: any) => p.status === 'pending').length || 0,
    averageAttendance: 0,
  };

  if (attendance && attendance.length > 0) {
    const attendanceByDate: { [key: string]: { present: number, total: number } } = {};

    attendance.forEach((record: any) => {
      const date = new Date(record.date).toISOString().split('T')[0];
      if (!attendanceByDate[date]) {
        attendanceByDate[date] = { present: 0, total: 0 };
      }

      try {
        const studentStatuses = JSON.parse(record.studentAttendances);
        studentStatuses.forEach((student: any) => {
          attendanceByDate[date].total++;
          if (student.status === 'present') {
            attendanceByDate[date].present++;
          }
        });
      } catch (e) {
        console.error("Failed to parse studentAttendances", e);
      }
    });

    const dailyPercentages = Object.values(attendanceByDate)
      .map(day => (day.present / day.total) * 100)
      .filter(p => !isNaN(p));

    if (dailyPercentages.length > 0) {
      const sumOfPercentages = dailyPercentages.reduce((sum, p) => sum + p, 0);
      stats.averageAttendance = sumOfPercentages / dailyPercentages.length;
    }
  }

  return {
    stats,
    isLoading,
    error: null, // Handle errors from individual hooks if needed
  };
}
