import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useStudents } from './useStudents';
import { withBase } from '@/lib/http';

export function useStudentsPerformanceTest() {
  const queryClient = useQueryClient();
  const { getJWT } = useAuth();

  const testPerformance = async () => {
    const startTime = performance.now();

    try {
      // Test students query performance
      const studentsQueryStart = performance.now();
      const jwt = await getJWT();
      await queryClient.prefetchQuery({
        queryKey: ['students', { page: 1, limit: 10 }],
        queryFn: async () => {
          const res = await fetch(withBase('/api/students?page=1&limit=10'), { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
        staleTime: 0,
      });
      const studentsQueryTime = performance.now() - studentsQueryStart;

      // Test search performance
      const searchQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['students', { page: 1, limit: 10, search: 'test' }],
        queryFn: async () => {
          const res = await fetch(withBase('/api/students?page=1&limit=10&search=test'), { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
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