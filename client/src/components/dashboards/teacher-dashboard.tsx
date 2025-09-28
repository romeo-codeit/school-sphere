import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

function TeacherDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: teacherDetails, isLoading: isLoadingTeacher } = useQuery({
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

  const { data: assignedClasses, isLoading: isLoadingClasses } = useQuery({
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

  const { data: studentsInClasses, isLoading: isLoadingStudents } = useQuery({
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
  const isLoading = isLoadingTeacher || isLoadingClasses || isLoadingStudents;

  return (
    <div className="space-y-6">
      <TopNav title="Teacher Dashboard" subtitle={`Welcome back, ${user?.name || 'Teacher'}`} />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : assignedClasses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">You are assigned to these classes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalStudentsInClasses}</div>
            <p className="text-xs text-muted-foreground">Across all your classes.</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button onClick={() => setLocation('/take-attendance')}>Take Attendance</Button>
            <Button variant="outline" onClick={() => setLocation('/resources')}>Upload Resource</Button>
            <Button variant="outline" onClick={() => setLocation('/communications')}>Send Message</Button>
            <Button variant="outline" onClick={() => setLocation('/video-conferencing')}>Start a Meeting</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p>Loading...</p> : (
                assignedClasses?.map((c: any) => (
                    <div key={c.$id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                        <p className="font-semibold">{c.name}</p>
                        <Button variant="ghost" size="sm" onClick={() => setLocation(`/students?classId=${c.$id}`)}>View Students</Button>
                    </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TeacherDashboard;