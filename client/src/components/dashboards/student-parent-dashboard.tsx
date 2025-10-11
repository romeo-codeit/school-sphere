import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, CreditCard, Calendar, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { StudentParentDashboardSkeleton } from "@/components/skeletons/student-parent-dashboard-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStudentParentDashboardPerformanceTest } from "@/hooks/useStudentParentDashboardPerformanceTest";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

function StudentParentDashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const [, setLocation] = useLocation();

  // Performance testing hook
  useStudentParentDashboardPerformanceTest();

  const { data: student, isLoading: isLoadingStudent, error: studentError } = useQuery({
    queryKey: ['studentProfileForDashboard', user?.$id, role],
    queryFn: async () => {
      if (!user) return null;

      let query;
      if (role === 'student') {
        query = Query.equal('userId', user.$id);
      } else if (role === 'parent' && user.email) {
        query = Query.equal('parentEmail', user.email);
      } else {
        return null;
      }

      const response = await databases.listDocuments(DATABASE_ID, 'students', [query, Query.limit(1)]);
      return response.documents[0];
    },
    enabled: !!user && !!role,
  });

  const { data: studentClass, isLoading: isLoadingClass, error: classError } = useQuery({
    queryKey: ['studentClass', student?.$id],
    queryFn: async () => {
        if (!student?.classId) return null;
        return await databases.getDocument(DATABASE_ID, 'classes', student.classId);
    },
    enabled: !!student,
  });

  const { data: teacher, isLoading: isLoadingTeacher, error: teacherError } = useQuery({
    queryKey: ['classTeacher', studentClass?.teacherId],
    queryFn: async () => {
        if (!studentClass?.teacherId) return null;
        const teacherId = Array.isArray(studentClass.teacherId) ? studentClass.teacherId[0] : studentClass.teacherId;
        if (!teacherId) return null;

        return await databases.getDocument(DATABASE_ID, 'teachers', teacherId);
    },
    enabled: !!studentClass
  });

  const isLoading = isLoadingStudent || (!!student && isLoadingClass) || (!!studentClass && isLoadingTeacher);
  const isError = studentError || classError || teacherError;

  if (isLoading) {
    return <StudentParentDashboardSkeleton />;
  }

  if (isError) {
    return (
        <div className="p-6">
            <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    There was a problem loading your dashboard. Please try again later.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2 py-4 sm:px-4 md:px-8 lg:px-16 w-full">
      <TopNav title="Student Dashboard" subtitle={`Welcome, ${user?.name}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
          <CardContent>
            {student ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {student.firstName} {student.lastName}</p>
                <p><strong>Class:</strong> {studentClass?.name || 'Not Assigned'}</p>
                <p><strong>Class Teacher:</strong> {teacher?.name || 'Not Assigned'}</p>
              </div>
            ) : <p>No student profile found. Please contact an administrator.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <Button className="w-full" variant="outline" onClick={() => setLocation('/progress')}><TrendingUp className="mr-2 h-4 w-4" /> View Grades</Button>
            <Button className="w-full" variant="outline" onClick={() => setLocation('/attendance')}><Calendar className="mr-2 h-4 w-4" /> View Attendance</Button>
            <Button className="w-full" variant="outline" onClick={() => setLocation('/resources')}><BookOpen className="mr-2 h-4 w-4" /> Browse Resources</Button>
            <Button className="w-full" variant="outline" onClick={() => setLocation('/payments')}><CreditCard className="mr-2 h-4 w-4" /> View Payments</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StudentParentDashboard;