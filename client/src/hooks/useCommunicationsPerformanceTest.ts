import { useQueryClient } from '@tanstack/react-query';

export function useCommunicationsPerformanceTest() {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    const startTime = performance.now();

    try {
      // Test forum threads query performance
      const forumQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['forum_threads'],
        queryFn: () => fetch('/api/forum/threads').then(res => res.json()),
        staleTime: 0,
      });
      const forumQueryTime = performance.now() - forumQueryStart;

      // Test conversations query performance
      const conversationsQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['conversations', 'user-id'],
        queryFn: () => fetch('/api/conversations').then(res => res.json()),
        staleTime: 0,
      });
      const conversationsQueryTime = performance.now() - conversationsQueryStart;

      // Test users query performance
      const usersQueryStart = performance.now();
      await queryClient.prefetchQuery({
        queryKey: ['users'],
        queryFn: () => fetch('/api/users').then(res => res.json()),
        staleTime: 0,
      });
      const usersQueryTime = performance.now() - usersQueryStart;

      const totalTime = performance.now() - startTime;

      const metrics = {
        totalTime,
        forumQueryTime,
        conversationsQueryTime,
        usersQueryTime,
        timestamp: new Date().toISOString(),
      };

      console.log('💬 Communications Performance Test Results:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Communications Performance Test Failed:', error);
      return null;
    }
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['forum'] });
    queryClient.removeQueries({ queryKey: ['conversations'] });
    queryClient.removeQueries({ queryKey: ['chat_messages'] });
    queryClient.removeQueries({ queryKey: ['users'] });
    console.log('🧹 Communications cache cleared');
  };

  return { testPerformance, clearCache };
}

export function logCommunicationsPerformanceMetrics(action: string, duration: number, metadata?: any) {
  console.log(`📈 Communications ${action}: ${duration.toFixed(2)}ms`, metadata || '');
}