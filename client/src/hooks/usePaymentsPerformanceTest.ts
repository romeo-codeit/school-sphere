import { useQueryClient } from '@tanstack/react-query';

// Performance test hook for payments page
export function usePaymentsPerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    // Test payments loading
    const paymentsStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['payments'],
      queryFn: async () => {
        // This simulates the payments query
        const response = await queryClient.getQueryData(['payments']);
        return response || [];
      },
    });
    const paymentsEnd = performance.now();

    // Test students loading
    const studentsStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['students'],
      queryFn: async () => {
        // This simulates the students query
        const response = await queryClient.getQueryData(['students']);
        return response || [];
      },
    });
    const studentsEnd = performance.now();

    const endTime = performance.now();

    return {
      totalTime: endTime - startTime,
      paymentsLoadTime: paymentsEnd - paymentsStart,
      studentsLoadTime: studentsEnd - studentsStart,
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

// Performance monitoring utility for payments page
export function logPaymentsPerformanceMetrics(metrics: any) {
  console.group('💰 Payments Page Performance Test');
  console.log('Total Load Time:', `${metrics.totalTime.toFixed(2)}ms`);
  console.log('Payments Load Time:', `${metrics.paymentsLoadTime.toFixed(2)}ms`);
  console.log('Students Load Time:', `${metrics.studentsLoadTime.toFixed(2)}ms`);
  console.log('Timestamp:', metrics.timestamp);

  // Performance thresholds
  const thresholds = {
    acceptable: 1500,  // 1.5 seconds
    good: 750,         // 0.75 seconds
    excellent: 400,    // 0.4 seconds
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