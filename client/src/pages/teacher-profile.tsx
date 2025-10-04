import { useParams } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTeachers } from "@/hooks/useTeachers";
import { Mail, Phone, Book, Award, Briefcase, UserCheck } from "lucide-react";

export default function TeacherProfile() {
  const params = useParams();
  const teacherId = params.id;
  const { useTeacher } = useTeachers();
  const { data: teacher, isLoading: isLoadingTeacher } = useTeacher(teacherId || "");

  if (isLoadingTeacher) {
    return <div className="p-6 text-center">Loading teacher profile...</div>;
  }

  if (!teacher) {
    return <div className="p-6 text-center">Teacher not found.</div>;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'on-leave':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Teacher Profile" subtitle={`Details for ${teacher.firstName} ${teacher.lastName}`} showGoBackButton={true} />

      <div className="p-6 space-y-6">
        <Card className="overflow-hidden">
          <div className="h-24 bg-primary/10" />
          <CardContent className="pt-6">
            <div className="flex items-start -mt-16">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={teacher.profileImageUrl} />
                <AvatarFallback className="text-3xl">
                  {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-6">
                <h1 className="text-2xl font-bold">{teacher.firstName} {teacher.lastName}</h1>
                <p className="text-muted-foreground">Employee ID: {teacher.employeeId}</p>
                <Badge 
                  variant={getStatusVariant(teacher.status)} 
                  className="mt-2"
                  aria-label={`Teacher status: ${teacher.status}`}
                >
                  {teacher.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">{teacher.email || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">{teacher.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Gender: {teacher.gender ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1) : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Book className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Subjects: {teacher.subjects?.join(', ') || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Qualification: {teacher.qualification || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Experience: {teacher.experience} years</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
