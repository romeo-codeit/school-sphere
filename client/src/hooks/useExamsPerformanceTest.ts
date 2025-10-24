import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { withBase } from '@/lib/http';

export function useExamsPerformanceTest() {
  const queryClient = useQueryClient();
  const { getJWT } = useAuth();

  const testPerformance = async () => {
    const startTime = performance.now();

    try {
      // Test exams query performance
      const examsQueryStart = performance.now();
      const jwt = await getJWT();
      await queryClient.prefetchQuery({
        queryKey: ['cbt-exams', 'all', 'all', 'none', 'wq0'],
        queryFn: async () => {
          const res = await fetch(withBase('/api/cbt/exams?limit=all&withQuestions=false'), { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
        staleTime: 0,
      });
      const examsQueryTime = performance.now() - examsQueryStart;

      // Test available subjects performance
      const subjectsQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['cbt-subjects-available', 'mock'],
        queryFn: async () => {
          const res = await fetch(withBase('/api/cbt/subjects/available?type=mock'), { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
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
    queryClient.removeQueries({ queryKey: ['cbt-exams-assigned'] });
    console.log('🧹 Exams cache cleared');
  };

  return { testPerformance, clearCache };
}

export function logExamsPerformanceMetrics(action: string, duration: number, metadata?: any) {
  console.log(`📈 Exams ${action}: ${duration.toFixed(2)}ms`, metadata || '');
}