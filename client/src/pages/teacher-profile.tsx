import { useParams } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeachers } from "@/hooks/useTeachers";

export default function TeacherProfile() {
  const params = useParams();
  const teacherId = params.id;
  const { useTeacher } = useTeachers();
  const { data: teacher, isLoading: isLoadingTeacher } = useTeacher(teacherId || "");

  if (isLoadingTeacher) {
    return <div className="p-6">Loading teacher profile...</div>;
  }

  if (!teacher) {
    return <div className="p-6">Teacher not found.</div>;
  }

  return (
    <div className="space-y-6">
      <TopNav title="Teacher Profile" subtitle={`${teacher.firstName} ${teacher.lastName}`} />

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={teacher.profileImageUrl} />
                <AvatarFallback className="text-3xl">
                  {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{teacher.firstName} {teacher.lastName}</h1>
                <p className="text-muted-foreground">Employee ID: {teacher.employeeId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Email:</strong> {teacher.email}</p>
            <p><strong>Phone:</strong> {teacher.phone}</p>
            <p><strong>Subjects:</strong> {teacher.subjects?.join(', ')}</p>
            <p><strong>Qualification:</strong> {teacher.qualification}</p>
            <p><strong>Experience:</strong> {teacher.experience} years</p>
            <p><strong>Status:</strong> {teacher.status}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
