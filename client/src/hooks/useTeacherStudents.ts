import { useQuery } from '@tanstack/react-query';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export function useTeacherStudents(teacherId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];

      // First get all classes taught by this teacher
      const teacherClassesResponse = await databases.listDocuments(
        DATABASE_ID,
        'teachersToClasses',
        [Query.equal('teacherId', teacherId)]
      );

      if (teacherClassesResponse.documents.length === 0) {
        return [];
      }

      const classIds = teacherClassesResponse.documents.map(doc => doc.classId);

      // Get all students in these classes - make individual queries for reliability
      const studentPromises = classIds.map(classId =>
        databases.listDocuments(DATABASE_ID, 'students', [Query.equal('classId', classId)])
      );

      const studentResponses = await Promise.all(studentPromises);

      // Flatten and deduplicate students (in case a student is in multiple classes)
      const allStudents = studentResponses.flatMap(response => response.documents);
      const uniqueStudents = allStudents.filter((student, index, self) =>
        index === self.findIndex(s => s.$id === student.$id)
      );

      return uniqueStudents;
    },
    enabled: !!teacherId,
  });

  return {
    students: data || [],
    isLoading,
    error,
  };
}