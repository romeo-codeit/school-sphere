import { useTeacherStudentsPaginated } from '@/hooks/useTeacherStudentsPaginated';
import { useClasses } from '@/hooks/useClasses';
import { useQueryClient } from '@tanstack/react-query';

// Performance test hook for teacher profile
export function useTeacherProfilePerformanceTest(teacherId?: string) {
  const queryClient = useQueryClient();

  const testPerformance = async () => {
    if (!teacherId) return null;

    const startTime = performance.now();

    // Test classes loading
    const classesStart = performance.now();
    const { classes, isLoading: classesLoading } = useClasses(teacherId);
    const classesEnd = performance.now();

    // Test students loading (first page)
    const studentsStart = performance.now();
    const { students, total: totalStudents, isLoading: studentsLoading } = useTeacherStudentsPaginated({
      limit: 20,
      offset: 0,
      enabled: true,
    });
    const studentsEnd = performance.now();

    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 100));

    const endTime = performance.now();

    return {
      totalTime: endTime - startTime,
      classesLoadTime: classesEnd - classesStart,
      studentsLoadTime: studentsEnd - studentsStart,
      classesCount: classes?.length || 0,
      studentsCount: totalStudents || 0,
      studentsPerPage: students?.length || 0,
      timestamp: new Date().toISOString(),
    };
  };

  const clearCache = () => {
    queryClient.clear();
  };

  return {
    testPerformance,
    clearCache,
  };
}

// Performance monitoring utility
export function logPerformanceMetrics(metrics: any) {
  console.group('🚀 Teacher Profile Performance Test');
  console.log('Total Load Time:', `${metrics.totalTime.toFixed(2)}ms`);
  console.log('Classes Load Time:', `${metrics.classesLoadTime.toFixed(2)}ms`);
  console.log('Students Load Time:', `${metrics.studentsLoadTime.toFixed(2)}ms`);
  console.log('Classes Count:', metrics.classesCount);
  console.log('Total Students:', metrics.studentsCount);
  console.log('Students Per Page:', metrics.studentsPerPage);
  console.log('Timestamp:', metrics.timestamp);

  // Performance thresholds
  const thresholds = {
    acceptable: 1000, // 1 second
    good: 500,        // 0.5 seconds
    excellent: 200,   // 0.2 seconds
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