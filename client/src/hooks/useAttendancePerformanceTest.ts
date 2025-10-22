import { useQueryClient } from '@tanstack/react-query';

// Performance test hook for attendance pages
export function useAttendancePerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    // Test attendance data loading
    const attendanceStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['attendanceRecords'],
      queryFn: async () => {
        // This simulates the attendance query
        const response = await queryClient.getQueryData(['attendanceRecords']);
        return response || [];
      },
    });
    const attendanceEnd = performance.now();

    // Test classes loading
    const classesStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['classes'],
      queryFn: async () => {
        // This simulates the classes query
        const response = await queryClient.getQueryData(['classes']);
        return response || [];
      },
    });
    const classesEnd = performance.now();

    const endTime = performance.now();

    return {
      totalTime: endTime - startTime,
      attendanceLoadTime: attendanceEnd - attendanceStart,
      classesLoadTime: classesEnd - classesStart,
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

// Performance monitoring utility for attendance pages
export function logAttendancePerformanceMetrics(metrics: any) {
  console.group('📊 Attendance Pages Performance Test');
  console.log('Total Load Time:', `${metrics.totalTime.toFixed(2)}ms`);
  console.log('Attendance Load Time:', `${metrics.attendanceLoadTime.toFixed(2)}ms`);
  console.log('Classes Load Time:', `${metrics.classesLoadTime.toFixed(2)}ms`);
  console.log('Timestamp:', metrics.timestamp);

  // Performance thresholds
  const thresholds = {
    acceptable: 1000,  // 1 second
    good: 500,         // 0.5 seconds
    excellent: 200,    // 0.2 seconds
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