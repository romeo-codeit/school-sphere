import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, CreditCard, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { DB } from "@/lib/db";
import { Query } from "appwrite";

function StudentParentDashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const [, setLocation] = useLocation();

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['studentProfile', user?.$id],
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
      const response = await databases.listDocuments(DB.id, 'students', [query]);
      return response.documents[0];
    },
    enabled: !!user,
  });

  const { data: studentClass, isLoading: isLoadingClass } = useQuery({
    queryKey: ['studentClass', student?.classId],
    queryFn: async () => {
        if (!student?.classId) return null;
        return await databases.getDocument(DB.id, 'classes', student.classId);
    },
    enabled: !!student,
  });

  const { data: teacher, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ['classTeacher', studentClass?.teacherId],
    queryFn: async () => {
        if (!studentClass?.teacherId) return null;
        const response = await databases.listDocuments(DB.id, 'teachers', [
            Query.equal('$id', studentClass.teacherId)
        ]);
        return response.documents[0];
    },
    enabled: !!studentClass
  });

  return (
    <div className="space-y-6">
      <TopNav title="Student Dashboard" subtitle={`Welcome, ${user?.name}`} />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
              <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
              <CardContent>
                  {isLoadingStudent ? <p>Loading...</p> : student ? (
                      <div>
                          <p><strong>Name:</strong> {student.firstName} {student.lastName}</p>
                          <p><strong>Class:</strong> {isLoadingClass ? '...' : studentClass?.name || 'Not Assigned'}</p>
                          <p><strong>Class Teacher:</strong> {isLoadingTeacher ? '...' : teacher?.name || 'Not Assigned'}</p>
                      </div>
                  ) : <p>No student profile found.</p>}
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => setLocation('/progress')}><TrendingUp className="mr-2 h-4 w-4" /> View Grades</Button>
                  <Button variant="outline" onClick={() => setLocation('/attendance')}><Calendar className="mr-2 h-4 w-4" /> View Attendance</Button>
                  <Button variant="outline" onClick={() => setLocation('/resources')}><BookOpen className="mr-2 h-4 w-4" /> Browse Resources</Button>
                  <Button variant="outline" onClick={() => setLocation('/payments')}><CreditCard className="mr-2 h-4 w-4" /> View Payments</Button>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}

export default StudentParentDashboard;