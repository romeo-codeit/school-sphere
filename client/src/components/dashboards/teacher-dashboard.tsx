import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { TeacherDashboardSkeleton } from "@/components/skeletons/teacher-dashboard-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

function TeacherDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: teacherDetails, isLoading: isLoadingTeacher, error: teacherError } = useQuery({
    queryKey: ['teacherDetails', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return null;
      const response = await databases.listDocuments(DATABASE_ID, 'teachers', [
        Query.equal('userId', user.$id),
        Query.limit(1)
      ]);
      return response.documents[0];
    },
    enabled: !!user,
  });

  const classIds = teacherDetails?.classIds || [];

  const { data: assignedClasses, isLoading: isLoadingClasses, error: classesError } = useQuery({
    queryKey: ['teacherClasses', classIds],
    queryFn: async () => {
        if (classIds.length === 0) return [];
        const response = await databases.listDocuments(DATABASE_ID, 'classes', [
            Query.equal('$id', classIds)
        ]);
        return response.documents;
    },
    enabled: !!teacherDetails && classIds.length > 0,
  });

  const { data: studentsInClasses, isLoading: isLoadingStudents, error: studentsError } = useQuery({
    queryKey: ['studentsInTeacherClasses', classIds],
    queryFn: async () => {
      if (classIds.length === 0) return [];
      const response = await databases.listDocuments(DATABASE_ID, 'students', [
        Query.equal('classId', classIds)
      ]);
      return response.documents;
    },
    enabled: !!teacherDetails && classIds.length > 0,
  });

  const totalStudentsInClasses = studentsInClasses?.length || 0;
  const isLoading = isLoadingTeacher || (classIds.length > 0 && (isLoadingClasses || isLoadingStudents));
  const isError = teacherError || classesError || studentsError;

  if (isLoading) {
    return <TeacherDashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was a problem loading your dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2 py-4 sm:px-4 md:px-8 lg:px-16 w-full">
      <TopNav title="Teacher Dashboard" subtitle={`Welcome back, ${user?.name || 'Teacher'}`} />

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedClasses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">You are assigned to these classes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsInClasses}</div>
            <p className="text-xs text-muted-foreground">Across all your classes.</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Classes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <Button className="w-full" onClick={() => setLocation('/take-attendance')}>Take Attendance</Button>
            <Button className="w-full" variant="outline" onClick={() => setLocation('/resources')}>Upload Resource</Button>
            <Button className="w-full" variant="outline" onClick={() => setLocation('/communications')}>Send Message</Button>
            <Button className="w-full" variant="outline" onClick={() => setLocation('/video-conferencing')}>Start a Meeting</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {assignedClasses?.map((c: any) => (
                <div key={c.$id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                  <p className="font-semibold mb-2 sm:mb-0">{c.name}</p>
                  <Button className="w-full sm:w-auto" variant="ghost" size="sm" onClick={() => setLocation(`/students?classId=${c.$id}`)}>View Students</Button>
                </div>
              ))}
              {assignedClasses?.length === 0 && (
                <p className="text-sm text-muted-foreground">You are not assigned to any classes.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TeacherDashboard;