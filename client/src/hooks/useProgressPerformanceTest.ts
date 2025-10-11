import { useQueryClient } from '@tanstack/react-query';

// Performance test hook for progress page
export function useProgressPerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    // Test grades loading
    const gradesStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['grades'],
      queryFn: async () => {
        // This simulates the grades query
        const response = await queryClient.getQueryData(['grades']);
        return response || [];
      },
    });
    const gradesEnd = performance.now();

    // Test attendance loading
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

    // Test exam attempts loading
    const examAttemptsStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['examAttempts'],
      queryFn: async () => {
        // This simulates the exam attempts query
        const response = await queryClient.getQueryData(['examAttempts']);
        return response || [];
      },
    });
    const examAttemptsEnd = performance.now();

    // Test exams loading
    const examsStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['exams'],
      queryFn: async () => {
        // This simulates the exams query
        const response = await queryClient.getQueryData(['exams']);
        return response || [];
      },
    });
    const examsEnd = performance.now();

    const endTime = performance.now();

    return {
      totalTime: endTime - startTime,
      gradesLoadTime: gradesEnd - gradesStart,
      attendanceLoadTime: attendanceEnd - attendanceStart,
      examAttemptsLoadTime: examAttemptsEnd - examAttemptsStart,
      examsLoadTime: examsEnd - examsStart,
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

// Performance monitoring utility for progress page
export function logProgressPerformanceMetrics(metrics: any) {
  console.group('📊 Progress Page Performance Test');
  console.log('Total Load Time:', `${metrics.totalTime.toFixed(2)}ms`);
  console.log('Grades Load Time:', `${metrics.gradesLoadTime.toFixed(2)}ms`);
  console.log('Attendance Load Time:', `${metrics.attendanceLoadTime.toFixed(2)}ms`);
  console.log('Exam Attempts Load Time:', `${metrics.examAttemptsLoadTime.toFixed(2)}ms`);
  console.log('Exams Load Time:', `${metrics.examsLoadTime.toFixed(2)}ms`);
  console.log('Timestamp:', metrics.timestamp);

  // Performance thresholds
  const thresholds = {
    acceptable: 1200,  // 1.2 seconds
    good: 600,         // 0.6 seconds
    excellent: 300,    // 0.3 seconds
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