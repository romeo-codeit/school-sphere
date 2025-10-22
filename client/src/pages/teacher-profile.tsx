import React from "react";
import { useParams } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useTeacherProfilePerformanceTest, logPerformanceMetrics } from '@/hooks/useTeacherProfilePerformanceTest';
import ErrorBoundary from "@/components/ui/error-boundary";
import { useTeachers } from "@/hooks/useTeachers";
import { useClasses } from "@/hooks/useClasses";
import { useTeacherStudentsPaginated } from "@/hooks/useTeacherStudentsPaginated";
import { Mail, Phone, Book, Award, Briefcase, User, Edit, Users, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useRole } from "@/hooks/useRole";

interface TeacherProfileProps {
  id: string;
}

export default function TeacherProfile({ id }: TeacherProfileProps) {
  const { useTeacher } = useTeachers();
  const { data: teacher, isLoading: isLoadingTeacher } = useTeacher(id || "");
  const { classes, isLoading: isLoadingClasses, error: classesError } = useClasses(id || "");

  // Pagination state for students
  const [currentPage, setCurrentPage] = React.useState(1);
  const studentsPerPage = 20;

  const { students, total: totalStudents, isLoading: isLoadingStudents, error: studentsError } = useTeacherStudentsPaginated({
    limit: studentsPerPage,
    offset: (currentPage - 1) * studentsPerPage,
    enabled: !!id,
  });

  const totalPages = Math.ceil(totalStudents / studentsPerPage);

  const { testPerformance, clearCache } = useTeacherProfilePerformanceTest(id || "");

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logPerformanceMetrics(metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
    window.location.reload(); // Simple way to reset the component state
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Expose performance testing functions to window for console access
      (window as any).teacherProfilePerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
        teacherId: id,
      };
    }
  }, [id]);
  const { hasPermission } = useRole();
  const [, setLocation] = useLocation();

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

  const handleEdit = () => {
    setLocation(`/teachers?edit=${teacher.$id}`);
  };

  return (
    <div className="space-y-6">
      <TopNav 
        title="Teacher Profile" 
        subtitle={`Details for ${teacher.firstName} ${teacher.lastName}`}
        showGoBackButton={true}
      />

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
              <div className="ml-6 flex-1">
                <div className="flex items-start justify-between">
                  <div>
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
                  {hasPermission("teachers", "update") && (
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Teacher
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t">
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
                <span className="text-sm">Experience: {teacher.experience ? `${teacher.experience} years` : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <ErrorBoundary>
          <Tabs defaultValue="classes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="w-5 h-5" />
                    Classes Taught
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingClasses ? (
                    <TableSkeleton columns={2} rows={3} />
                  ) : classesError ? (
                    <div className="text-center py-4 text-destructive">
                      Error loading classes: {classesError.message}
                    </div>
                  ) : classes && classes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted hover:bg-muted">
                            <TableHead>Class Name</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classes.map((classItem: any) => (
                            <TableRow key={classItem.$id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{classItem.name}</TableCell>
                              <TableCell>{classItem.description || 'No description'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No classes assigned to this teacher.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Students ({totalStudents})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStudents ? (
                    <TableSkeleton columns={4} rows={5} />
                  ) : studentsError ? (
                    <div className="text-center py-4 text-destructive">
                      Error loading students: {studentsError.message}
                    </div>
                  ) : students && students.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted hover:bg-muted">
                              <TableHead>Student ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Email</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student: any) => (
                              <TableRow key={student.$id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{student.studentId}</TableCell>
                                <TableCell>{student.firstName} {student.lastName}</TableCell>
                                <TableCell>
                                  {classes?.find((c: any) => c.$id === student.classId)?.name || 'Unknown Class'}
                                </TableCell>
                                <TableCell>{student.email || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, totalStudents)} of {totalStudents} students
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Previous
                            </Button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No students found in this teacher's classes.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  );
}
