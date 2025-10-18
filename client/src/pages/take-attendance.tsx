import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTeachers } from "@/hooks/useTeachers";
import { useRole } from "@/hooks/useRole";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useAttendancePerformanceTest, logAttendancePerformanceMetrics } from '@/hooks/useAttendancePerformanceTest';
import React from "react";

export default function TakeAttendance() {
  const { user } = useAuth();
  const { role } = useRole();
  const { classes: allClasses, isLoading: classesLoading } = useClasses();
  const { useTeacherByUserId } = useTeachers();
  const { data: teacherProfile, isLoading: teacherLoading } = useTeacherByUserId(user?.$id || '');
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { students, isLoading: studentsLoading } = useStudents({ classId: selectedClassId || undefined });
  const { createAttendance } = useAttendance();
  const [attendanceAlreadySubmitted, setAttendanceAlreadySubmitted] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  useEffect(() => {
    async function checkExistingAttendance() {
      if (!selectedClassId) {
        setAttendanceAlreadySubmitted(false);
        return;
      }
      setCheckingAttendance(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        // Use Appwrite API directly to check for any attendance records for this class/date
        const response = await import('@/lib/api/attendance').then(api => api.getAttendanceRecordsForDate(selectedClassId, today));
        setAttendanceAlreadySubmitted(response.length > 0);
      } catch (err) {
        setAttendanceAlreadySubmitted(false);
      } finally {
        setCheckingAttendance(false);
      }
    }
    checkExistingAttendance();
  }, [selectedClassId]);
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<{ [studentId: string]: string }>({});

  const { testPerformance, clearCache } = useAttendancePerformanceTest();

  // Get teacher's assigned classes
  const teacherClasses = teacherProfile?.classIds ? 
    allClasses?.filter(cls => teacherProfile.classIds.includes(cls.$id)) || [] : 
    [];

  // Auto-select class if teacher has only one assigned class
  useEffect(() => {
    if (role === 'teacher' && teacherClasses.length === 1 && !selectedClassId) {
      setSelectedClassId(teacherClasses[0].$id);
    }
  }, [role, teacherClasses, selectedClassId]);

  // Determine which classes to show in dropdown
  const availableClasses = role === 'teacher' ? teacherClasses : allClasses;

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logAttendancePerformanceMetrics(metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).takeAttendancePerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    // For teachers with one class, use that class automatically
    const classIdToUse = selectedClassId || (role === 'teacher' && teacherClasses.length === 1 ? teacherClasses[0].$id : null);

    if (!classIdToUse) {
      toast({ title: "Error", description: "Please select a class.", variant: "destructive" });
      return;
    }

    if (!students || students.length === 0) {
      toast({ title: "Error", description: "No students in this class.", variant: "destructive" });
      return;
    }

    if (attendanceAlreadySubmitted) {
      toast({ title: "Already Submitted", description: "Attendance for this class has already been submitted today.", variant: "destructive" });
      return;
    }

    try {
      // Create attendance records for all students (use stored status or default to 'present')
      const attendancePromises = students.map((student: any) =>
        createAttendance({
          classId: classIdToUse,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          studentId: student.$id,
          status: attendance[student.$id] || 'present', // Default to 'present' if not explicitly set
        })
      );

      await Promise.all(attendancePromises);

      toast({ title: "Success", description: "Attendance submitted successfully." });
      setAttendance({});
      // Notify Historical Attendance page to refetch
      window.dispatchEvent(new Event('attendanceSubmitted'));
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to submit attendance: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <>
      <TopNav title="Take Attendance" subtitle="Mark student attendance for a class" showGoBackButton={true} />
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <ErrorBoundary>
          <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">
                {role === 'teacher' ? 
                  (teacherClasses.length > 1 ? 'Select Class' : 'Take Attendance') : 
                  'Select Class'
                }
              </CardTitle>
              {((role === 'teacher' && teacherClasses.length > 1) || role !== 'teacher') && (
                <Select onValueChange={setSelectedClassId} value={selectedClassId || undefined}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder={
                      role === 'teacher' ? 
                        "Select your class..." : 
                        "Select a class..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {classesLoading || teacherLoading ? 
                      <SelectItem value="loading" disabled>Loading...</SelectItem> :
                      availableClasses?.map((c: any) => <SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              )}
              {role === 'teacher' && teacherClasses.length === 1 && (
                <div className="text-sm text-muted-foreground">
                  Class: <span className="font-medium">{teacherClasses[0]?.name}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(selectedClassId || (role === 'teacher' && teacherClasses.length === 1)) ?
             (studentsLoading ? <TableSkeleton columns={2} rows={5} /> :
              <>
                {/* Mobile: Card view */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {students?.map((student: any) => (
                    <Card key={student.$id} className="p-4">
                      <div className="flex flex-col gap-2">
                        <div className="font-medium text-base">{student.firstName} {student.lastName}</div>
                        <Select onValueChange={(value) => handleStatusChange(student.$id, value)} value={attendance[student.$id] || 'present'}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  ))}
                </div>
                {/* Desktop: Table view */}
                <div className="rounded-md border overflow-x-auto hidden sm:block">
                  <Table className="min-w-[400px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students?.map((student: any) => (
                        <TableRow key={student.$id}>
                          <TableCell className="font-medium text-sm">{student.firstName} {student.lastName}</TableCell>
                          <TableCell>
                            <Select onValueChange={(value) => handleStatusChange(student.$id, value)} value={attendance[student.$id] || 'present'}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="excused">Excused</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col gap-2 p-4 mt-4">
                  {attendanceAlreadySubmitted ? (
                    <div className="text-red-600 text-center font-medium">Attendance for this class has already been submitted today.</div>
                  ) : null}
                  <Button onClick={handleSubmit} className="w-full sm:w-auto" disabled={attendanceAlreadySubmitted || checkingAttendance}>Submit Attendance</Button>
                </div>
              </>) :
             <p className="text-center text-muted-foreground p-8">
               {role === 'teacher' && teacherClasses.length === 1 ? 
                 "Loading students..." : 
                 "Please select a class to take attendance."
               }
             </p>
            }
          </CardContent>
        </Card>
        </ErrorBoundary>
      </div>
      </div>
    </>
  );
}
