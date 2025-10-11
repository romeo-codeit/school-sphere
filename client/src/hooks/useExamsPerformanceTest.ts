import { useQueryClient } from '@tanstack/react-query';

export function useExamsPerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    try {
      // Test exams query performance
      const examsQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['cbt-exams-assigned'],
        queryFn: () => fetch('/api/cbt/exams/assigned').then(res => res.json()),
        staleTime: 0,
      });
      const examsQueryTime = performance.now() - examsQueryStart;

      // Test available subjects performance
      const subjectsQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['cbt-subjects-available', 'mock'],
        queryFn: () => fetch('/api/cbt/subjects/available?type=mock').then(res => res.json()),
        staleTime: 0,
      });
      const subjectsQueryTime = performance.now() - subjectsQueryStart;

      const totalTime = performance.now() - startTime;

      const metrics = {
        totalTime,
        examsQueryTime,
        subjectsQueryTime,
        timestamp: new Date().toISOString(),
      };

      console.log('📊 Exams Performance Test Results:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Exams Performance Test Failed:', error);
      return null;
    }
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['cbt'] });
    console.log('🧹 Exams cache cleared');
  };

  return { testPerformance, clearCache };
}

export function logExamsPerformanceMetrics(action: string, duration: number, metadata?: any) {
  console.log(`📈 Exams ${action}: ${duration.toFixed(2)}ms`, metadata || '');
}