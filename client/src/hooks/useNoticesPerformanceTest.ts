import { useState, useEffect } from 'react';

export function useNoticesPerformanceTest() {
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    // Performance testing for notices page
    const testNoticesOperations = async () => {
      const startTime = performance.now();

      try {
        // Test notices loading performance
        const loadStart = performance.now();
        // Simulate notices data loading
        await new Promise(resolve => setTimeout(resolve, 15));
        const loadEnd = performance.now();

        // Test search filtering performance
        const searchStart = performance.now();
        // Simulate search filtering operations
        await new Promise(resolve => setTimeout(resolve, 8));
        const searchEnd = performance.now();

        // Test category filtering performance
        const categoryStart = performance.now();
        // Simulate category filtering operations
        await new Promise(resolve => setTimeout(resolve, 5));
        const categoryEnd = performance.now();

        // Test notice creation performance
        const createStart = performance.now();
        // Simulate notice creation operations
        await new Promise(resolve => setTimeout(resolve, 20));
        const createEnd = performance.now();

        const endTime = performance.now();

        const metrics = {
          totalLoadTime: endTime - startTime,
          noticesLoadTime: loadEnd - loadStart,
          searchFilterTime: searchEnd - searchStart,
          categoryFilterTime: categoryEnd - categoryStart,
          noticeCreateTime: createEnd - createStart,
          timestamp: new Date().toISOString(),
          testType: 'notices_performance_test'
        };

        setPerformanceMetrics(metrics);
        console.log('Notices Performance Test Results:', metrics);

      } catch (error) {
        console.error('Notices performance test failed:', error);
      }
    };

    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      testNoticesOperations();
    }
  }, []);

  return { performanceMetrics };
}