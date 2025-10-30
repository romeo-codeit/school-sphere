import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, CreditCard, Calendar, TriangleAlert, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { StudentParentDashboardSkeleton } from "@/components/skeletons/student-parent-dashboard-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStudentParentDashboardPerformanceTest } from "@/hooks/useStudentParentDashboardPerformanceTest";
import { ExamSuccessModal } from "@/components/exam-success-modal";
import { useState, useEffect } from "react";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

function StudentParentDashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const [, setLocation] = useLocation();
  const [showExamTips, setShowExamTips] = useState(false);

  // Performance testing hook
  useStudentParentDashboardPerformanceTest();

  // Show exam tips modal on first login per session (students only)
  useEffect(() => {
    const hasSeenTips = sessionStorage.getItem('hasSeenExamTips');
    
    if (!hasSeenTips && user && role === 'student') {
      // Delay slightly to let dashboard load first
      const timer = setTimeout(() => {
        setShowExamTips(true);
        sessionStorage.setItem('hasSeenExamTips', 'true');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, role]);

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
            <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <BookOpen className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Oops! Study Break Time? 📚</AlertTitle>
                <AlertDescription className="text-amber-700">
                    We're having a little technical timeout, but don't worry! Your learning journey is just getting started.
                    <br />
                    <span className="font-medium">Quick tip:</span> While we fix this, why not review some exam strategies or check out our study resources?
                    <div className="mt-3 flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Try Again
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            onClick={() => setLocation('/resources')}
                        >
                            <BookOpen className="mr-2 h-3 w-3" />
                            Browse Resources
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <>
      <ExamSuccessModal 
        open={showExamTips} 
        onOpenChange={setShowExamTips}
      />
      
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
              {role === 'student' && (
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                  onClick={() => setShowExamTips(true)}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Exam Success Tips
                </Button>
              )}
              <Button className="w-full" variant="outline" onClick={() => setLocation('/progress')}><TrendingUp className="mr-2 h-4 w-4" /> View Grades</Button>
              <Button className="w-full" variant="outline" onClick={() => setLocation('/attendance')}><Calendar className="mr-2 h-4 w-4" /> View Attendance</Button>
              <Button className="w-full" variant="outline" onClick={() => setLocation('/resources')}><BookOpen className="mr-2 h-4 w-4" /> Browse Resources</Button>
              <Button className="w-full" variant="outline" onClick={() => setLocation('/payments')}><CreditCard className="mr-2 h-4 w-4" /> View Payments</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default StudentParentDashboard;
