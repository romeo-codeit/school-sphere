import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { withBase } from '@/lib/http';

// Performance test hook for student profile
export function useStudentProfilePerformanceTest(studentId?: string) {
  const queryClient = useQueryClient();
  const { getJWT } = useAuth();

  const testPerformance = async () => {
    if (!studentId) return null;

    const startTime = performance.now();

    // We don't call the full hook chain here; just simulate timings
    const studentStart = performance.now();
    const studentEnd = performance.now();

    // Test grades loading via API
    const gradesStart = performance.now();
    const jwt = await getJWT();
    await queryClient.prefetchQuery({
      queryKey: ['grades', studentId],
      queryFn: async () => {
        const res = await fetch(withBase(`/api/grades?studentId=${encodeURIComponent(studentId)}`), {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch grades');
        return res.json();
      },
      staleTime: 0,
    });
    const gradesEnd = performance.now();

    // Test attendance loading (placeholder)
    const attendanceStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['attendanceRecords', studentId],
      queryFn: async () => [],
      staleTime: 0,
    });
    const attendanceEnd = performance.now();

    // Test payments loading (placeholder)
    const paymentsStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['payments', studentId],
      queryFn: async () => [],
      staleTime: 0,
    });
    const paymentsEnd = performance.now();

    const endTime = performance.now();

    return {
      totalTime: endTime - startTime,
      studentLoadTime: studentEnd - studentStart,
      gradesLoadTime: gradesEnd - gradesStart,
      attendanceLoadTime: attendanceEnd - attendanceStart,
      paymentsLoadTime: paymentsEnd - paymentsStart,
      studentId,
      timestamp: new Date().toISOString(),
    };
  };

  const clearCache = () => {
    queryClient.clear();
  };

  return { testPerformance, clearCache };
}

// Performance monitoring utility for student profile
export function logStudentProfilePerformanceMetrics(metrics: any) {
  console.group('📚 Student Profile Performance Test');
  console.log('Total Load Time:', `${metrics.totalTime.toFixed(2)}ms`);
  console.log('Student Load Time:', `${metrics.studentLoadTime.toFixed(2)}ms`);
  console.log('Grades Load Time:', `${metrics.gradesLoadTime.toFixed(2)}ms`);
  console.log('Attendance Load Time:', `${metrics.attendanceLoadTime.toFixed(2)}ms`);
  console.log('Payments Load Time:', `${metrics.paymentsLoadTime.toFixed(2)}ms`);
  console.log('Student ID:', metrics.studentId);
  console.log('Timestamp:', metrics.timestamp);

  // Performance thresholds
  const thresholds = {
    acceptable: 1000, // 1 second
    good: 500,        // 0.5 seconds
    excellent: 200,   // 0.2 seconds
  };

  if (metrics.totalTime < thresholds.excellent) {
    console.log('✅ Performance: EXCELLENT');
  } else if (metrics.totalTime < thresholds.good) {
    console.log('✅ Performance: GOOD');
  } else if (metrics.totalTime < thresholds.acceptable) {
    console.log('⚠️ Performance: ACCEPTABLE');
  } else {
    console.log('❌ Performance: NEEDS OPTIMIZATION');
  }

  console.groupEnd();
}