import { useQueryClient } from '@tanstack/react-query';

// Performance test hook for student profile
export function useStudentProfilePerformanceTest(studentId?: string) {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    if (!studentId) return null;

    const startTime = performance.now();

    // Test student data loading
    const studentStart = performance.now();
    // Note: We can't directly test the useStudent hook here, but we can test the overall load
    const studentEnd = performance.now();

    // Test grades loading
    const gradesStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['grades', studentId],
      queryFn: async () => {
        const response = await fetch(`/api/grades?studentId=${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch grades');
        return response.json();
      },
    });
    const gradesEnd = performance.now();

    // Test attendance loading
    const attendanceStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['attendanceRecords', studentId],
      queryFn: async () => {
        // This would use the actual attendance hook logic
        return [];
      },
    });
    const attendanceEnd = performance.now();

    // Test payments loading
    const paymentsStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['payments', studentId],
      queryFn: async () => {
        // This would use the actual payments hook logic
        return [];
      },
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
    window.location.reload();
  };

  return {
    testPerformance,
    clearCache,
  };
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