import { useQueryClient } from '@tanstack/react-query';
import { useStudents } from './useStudents';

export function useStudentsPerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    try {
      // Test students query performance
      const studentsQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['students', { page: 1, limit: 10 }],
        queryFn: () => fetch('/api/students?page=1&limit=10').then(res => res.json()),
        staleTime: 0,
      });
      const studentsQueryTime = performance.now() - studentsQueryStart;

      // Test search performance
      const searchQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['students', { page: 1, limit: 10, search: 'test' }],
        queryFn: () => fetch('/api/students?page=1&limit=10&search=test').then(res => res.json()),
        staleTime: 0,
      });
      const searchQueryTime = performance.now() - searchQueryStart;

      const totalTime = performance.now() - startTime;

      const metrics = {
        totalTime,
        studentsQueryTime,
        searchQueryTime,
        timestamp: new Date().toISOString(),
      };

      console.log('📊 Students Performance Test Results:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Students Performance Test Failed:', error);
      return null;
    }
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['students'] });
    console.log('🧹 Students cache cleared');
  };

  return { testPerformance, clearCache };
}

export function logStudentsPerformanceMetrics(action: string, duration: number, metadata?: any) {
  console.log(`📈 Students ${action}: ${duration.toFixed(2)}ms`, metadata || '');
}