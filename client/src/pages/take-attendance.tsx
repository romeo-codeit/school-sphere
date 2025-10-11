import { useState } from "react";
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
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useAttendancePerformanceTest, logAttendancePerformanceMetrics } from '@/hooks/useAttendancePerformanceTest';
import React from "react";

export default function TakeAttendance() {
  const { classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { students, isLoading: studentsLoading } = useStudents({ classId: selectedClassId || undefined });
  const { createAttendance } = useAttendance();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<{ [studentId: string]: string }>({});

  const { testPerformance, clearCache } = useAttendancePerformanceTest();

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
      console.log('📝 Take Attendance Performance Testing available in console:');
      console.log('  window.takeAttendancePerfTest.testPerformance() - Run performance test');
      console.log('  window.takeAttendancePerfTest.clearCache() - Clear cache and reload');
    }
  }, []);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      toast({ title: "Error", description: "Please select a class.", variant: "destructive" });
      return;
    }

    if (Object.keys(attendance).length === 0) {
      toast({ title: "Error", description: "No attendance data to submit.", variant: "destructive" });
      return;
    }

    try {
      const attendancePromises = Object.keys(attendance).map(studentId =>
        createAttendance({
          classId: selectedClassId,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          studentId: studentId,
          status: attendance[studentId] || 'present', // Default to 'present' if no status is set
        })
      );

      await Promise.all(attendancePromises);

      toast({ title: "Success", description: "Attendance submitted successfully." });
      setAttendance({});
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to submit attendance: ${error.message}`, variant: "destructive" });
    }

  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
  <TopNav title="Take Attendance" subtitle="Mark student attendance for a class" showGoBackButton={true} />
      <div className="py-6">
        <ErrorBoundary>
          <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">Select Class</CardTitle>
              <Select onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classesLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                   classes?.map((c: any) => <SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedClassId ?
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
                <div className="flex justify-end p-4 mt-4">
                  <Button onClick={handleSubmit} className="w-full sm:w-auto">Submit Attendance</Button>
                </div>
              </>) :
             <p className="text-center text-muted-foreground p-8">Please select a class to take attendance.</p>
            }
          </CardContent>
        </Card>
        </ErrorBoundary>
      </div>
    </div>
  );
}
