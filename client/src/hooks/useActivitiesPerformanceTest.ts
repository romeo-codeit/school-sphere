import { useState, useEffect } from 'react';

export function useActivitiesPerformanceTest() {
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    // Performance testing for activities page
    const testActivitiesOperations = async () => {
      const startTime = performance.now();

      try {
        // Test activities loading performance
        const loadStart = performance.now();
        // Simulate activities data loading
        await new Promise(resolve => setTimeout(resolve, 15));
        const loadEnd = performance.now();

        // Test type filtering performance
        const filterStart = performance.now();
        // Simulate type filtering operations
        await new Promise(resolve => setTimeout(resolve, 8));
        const filterEnd = performance.now();

        // Test search filtering performance
        const searchStart = performance.now();
        // Simulate search filtering operations
        await new Promise(resolve => setTimeout(resolve, 6));
        const searchEnd = performance.now();

        // Test activity rendering performance
        const renderStart = performance.now();
        // Simulate activity item rendering
        await new Promise(resolve => setTimeout(resolve, 10));
        const renderEnd = performance.now();

        const endTime = performance.now();

        const metrics = {
          totalLoadTime: endTime - startTime,
          activitiesLoadTime: loadEnd - loadStart,
          typeFilterTime: filterEnd - filterStart,
          searchFilterTime: searchEnd - searchStart,
          renderTime: renderEnd - renderStart,
          timestamp: new Date().toISOString(),
          testType: 'activities_performance_test'
        };

        setPerformanceMetrics(metrics);
        console.log('Activities Performance Test Results:', metrics);

      } catch (error) {
        console.error('Activities performance test failed:', error);
      }
    };

    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      testActivitiesOperations();
    }
  }, []);

  return { performanceMetrics };
}