import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useTeachers } from './useTeachers';

export function useTeachersPerformanceTest() {
  const queryClient = useQueryClient();
  const { getJWT } = useAuth();

  const testPerformance = async () => {
    const startTime = performance.now();

    try {
      // Test teachers query performance
      const teachersQueryStart = performance.now();
      const jwt = await getJWT();
      await queryClient.prefetchQuery({
        queryKey: ['teachers', { page: 1, limit: 10 }],
        queryFn: async () => {
          const res = await fetch('/api/teachers?page=1&limit=10', { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
        staleTime: 0,
      });
      const teachersQueryTime = performance.now() - teachersQueryStart;

      // Test search performance
      const searchQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['teachers', { page: 1, limit: 10, search: 'test' }],
        queryFn: async () => {
          const res = await fetch('/api/teachers?page=1&limit=10&search=test', { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
        staleTime: 0,
      });
      const searchQueryTime = performance.now() - searchQueryStart;

      const totalTime = performance.now() - startTime;

      const metrics = {
        totalTime,
        teachersQueryTime,
        searchQueryTime,
        timestamp: new Date().toISOString(),
      };

      console.log('📊 Teachers Performance Test Results:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Teachers Performance Test Failed:', error);
      return null;
    }
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['teachers'] });
    console.log('🧹 Teachers cache cleared');
  };

  return { testPerformance, clearCache };
}

export function logTeachersPerformanceMetrics(action: string, duration: number, metadata?: any) {
  console.log(`📈 Teachers ${action}: ${duration.toFixed(2)}ms`, metadata || '');
}