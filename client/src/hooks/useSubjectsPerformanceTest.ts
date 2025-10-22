import { useQueryClient } from '@tanstack/react-query';

// Performance test hook for subjects page
export function useSubjectsPerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    // Test subjects data loading
    const subjectsStart = performance.now();
    await queryClient.prefetchQuery({
      queryKey: ['subjects'],
      queryFn: async () => {
        // This simulates the subjects query
        const response = await queryClient.getQueryData(['subjects']);
        return response || [];
      },
    });
    const subjectsEnd = performance.now();

    const endTime = performance.now();

    return {
      totalTime: endTime - startTime,
      subjectsLoadTime: subjectsEnd - subjectsStart,
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

// Performance monitoring utility for subjects page
export function logSubjectsPerformanceMetrics(metrics: any) {
  console.group('📚 Subjects Page Performance Test');
  console.log('Total Load Time:', `${metrics.totalTime.toFixed(2)}ms`);
  console.log('Subjects Load Time:', `${metrics.subjectsLoadTime.toFixed(2)}ms`);
  console.log('Timestamp:', metrics.timestamp);

  // Performance thresholds
  const thresholds = {
    acceptable: 800,  // 0.8 seconds
    good: 400,        // 0.4 seconds
    excellent: 150,   // 0.15 seconds
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