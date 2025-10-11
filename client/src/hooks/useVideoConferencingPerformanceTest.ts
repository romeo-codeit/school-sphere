import { useQueryClient } from '@tanstack/react-query';

export function useVideoConferencingPerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    try {
      // Test meetings query performance
      const meetingsQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['meetings'],
        queryFn: () => fetch('/api/meetings').then(res => res.json()),
        staleTime: 0,
      });
      const meetingsQueryTime = performance.now() - meetingsQueryStart;

      // Test classes query performance (for meeting creation)
      const classesQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['classes'],
        queryFn: () => fetch('/api/classes').then(res => res.json()),
        staleTime: 0,
      });
      const classesQueryTime = performance.now() - classesQueryStart;

      const totalTime = performance.now() - startTime;

      const metrics = {
        totalTime,
        meetingsQueryTime,
        classesQueryTime,
        timestamp: new Date().toISOString(),
      };

      console.log('📹 Video Conferencing Performance Test Results:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Video Conferencing Performance Test Failed:', error);
      return null;
    }
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['meetings'] });
    queryClient.removeQueries({ queryKey: ['classes'] });
    console.log('🧹 Video Conferencing cache cleared');
  };

  return { testPerformance, clearCache };
}

export function logVideoConferencingPerformanceMetrics(action: string, duration: number, metadata?: any) {
  console.log(`📈 Video Conferencing ${action}: ${duration.toFixed(2)}ms`, metadata || '');
}