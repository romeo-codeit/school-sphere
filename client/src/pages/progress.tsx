import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useAttendance } from "@/hooks/useAttendance";
import { getStudentByUserId } from "@/lib/api/students";
import { useExamAttempts } from "@/hooks/useExamAttempts";
import { useExams } from "@/hooks/useExams";
import { useState, useMemo, useEffect } from "react";
import { getStudentByParentEmail } from "@/lib/api/students";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Define types locally since shared schema was removed
interface Grade {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  maxScore: number;
  totalMarks: number;
  grade: string;
  semester: string;
  academicYear: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  createdAt: string;
}

interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  status: 'in_progress' | 'completed';
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  percentage?: number;
  passed?: boolean;
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number;
}

interface Exam {
  id: string;
  title: string;
  type: string;
  subject: string;
  year: string;
  duration: number;
  totalQuestions: number;
  createdAt: string;
}
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useProgressPerformanceTest, logProgressPerformanceMetrics } from '@/hooks/useProgressPerformanceTest';
import React from "react";

export function GradesChart({ grades }: { grades: Grade[] }) {
  const data = useMemo(() => {
    return grades?.map((grade: Grade) => ({
      name: grade.subject,
      score: grade.score,
      totalMarks: grade.totalMarks,
    })).sort((a, b) => a.name.localeCompare(b.name)) || [];
  }, [grades]);

  if (!grades || grades.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No Grades Available"
        description="No academic grades have been recorded yet. Grades will appear here once they are entered by your teacher."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="score" fill="#8884d8" name="Score" />
        <Bar dataKey="totalMarks" fill="#82ca9d" name="Total Marks" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AttendanceSummary({ attendance }: { attendance: Attendance[] }) {
    const summary = useMemo(() => {
        const counts = { present: 0, absent: 0 };
        attendance?.forEach((record: Attendance) => {
            if (record.status === 'present') counts.present++;
            if (record.status === 'absent') counts.absent++;
        });
        return counts;
    }, [attendance]);

    if (!attendance || attendance.length === 0) {
        return <p className="text-sm text-muted-foreground">No attendance records available.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Present</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <p className="text-2xl sm:text-3xl font-bold">{summary.present}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Absent</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <p className="text-2xl sm:text-3xl font-bold">{summary.absent}</p>
                </CardContent>
            </Card>
        </div>
    );
}

export function ExamAttemptsTable({ examAttempts, exams }: { examAttempts: ExamAttempt[], exams: Exam[] }) {
    if (!examAttempts || examAttempts.length === 0) {
        return <p className="text-sm text-muted-foreground">No exam attempts available.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[600px]">
                <TableHeader className="hidden sm:table-header-group">
                    <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Total Questions</TableHead>
                        <TableHead>Correct Answers</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {examAttempts.map((attempt: ExamAttempt) => {
                        const exam = exams.find(e => e.id === attempt.examId);
                        return (
                            <TableRow key={attempt.id} className="block sm:table-row mb-4 sm:mb-0 border-b sm:border-none rounded-lg sm:rounded-none">
                                <TableCell className="block sm:table-cell text-sm sm:text-base" data-label="Exam">{exam ? exam.title : attempt.examId}</TableCell>
                                <TableCell className="block sm:table-cell text-sm sm:text-base" data-label="Score">{attempt.score}</TableCell>
                                <TableCell className="block sm:table-cell text-sm sm:text-base" data-label="Total Questions">{attempt.totalQuestions}</TableCell>
                                <TableCell className="block sm:table-cell text-sm sm:text-base" data-label="Correct Answers">{attempt.correctAnswers}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

export default function Progress() {
  const { user } = useAuth();
  const { role } = useRole();
  const { students, error: studentsError } = useStudents({ enabled: role === 'admin' || role === 'teacher' });
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentIdForRole, setStudentIdForRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { testPerformance, clearCache } = useProgressPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logProgressPerformanceMetrics(metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).progressPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

  useEffect(() => {
    const fetchStudentForRole = async () => {
      if (!user) return;
      try {
        if (role === 'student') {
          const student = await getStudentByUserId(user.$id);
          if (student) setStudentIdForRole(student.$id);
        } else if (role === 'parent' && user.email) {
          const student = await getStudentByParentEmail(user.email);
          if (student) setStudentIdForRole(student.$id);
        }
      } catch(e) {
      }
    };
    fetchStudentForRole();
  }, [user, role]);

  const studentIdToFetch = useMemo(() => {
    if (role === 'student' || role === 'parent') {
      return studentIdForRole;
    }
    return selectedStudentId;
  }, [role, studentIdForRole, selectedStudentId]);

  const { grades, isLoading: isLoadingGrades, error: gradesError } = useGrades(studentIdToFetch || '');
  const { attendance, isLoading: isLoadingAttendance, error: attendanceError } = useAttendance(studentIdToFetch || '');
  const { examAttempts, isLoading: isLoadingExamAttempts, error: examAttemptsError } = useExamAttempts(studentIdToFetch || '');
  const { exams, isLoading: isLoadingExams, error: examsError } = useExams();

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setOpen(false);
  };

  const error = studentsError || gradesError || attendanceError || examAttemptsError || examsError;

  return (
    <div className="space-y-6">
      <TopNav title="Progress" subtitle="Track student progress and performance" showGoBackButton={true} />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ErrorBoundary>
        {(role === 'admin' || role === 'teacher') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Select Student</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full sm:w-[250px] justify-between"
                  >
                    {selectedStudentId
                      ? students?.find((student: any) => student.$id === selectedStudentId)?.firstName + ' ' + students?.find((student: any) => student.$id === selectedStudentId)?.lastName
                      : "Select student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search student..." />
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {students?.map((student: any) => (
                        <CommandItem
                          key={student.$id}
                          value={student.$id}
                          onSelect={() => handleStudentChange(student.$id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStudentId === student.$id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {student.firstName} {student.lastName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        )}

        {error && <div className="text-red-500">Error: {error.message}</div>}

        {studentIdToFetch ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Grades</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingGrades ? <div className="h-64 bg-muted rounded animate-pulse" /> : <GradesChart grades={grades || []} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? <TableSkeleton columns={2} rows={2} /> : <AttendanceSummary attendance={(attendance || []).map((a: any) => ({
                  date: a.date ? new Date(a.date).toISOString() : new Date().toISOString(),
                  id: a.$id,
                  createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
                  studentId: a.studentId || '',
                  classId: a.classId || '',
                  status: a.status as any,
                  remarks: a.remarks || '',
                  markedBy: a.markedBy || '',
                }))} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Exam Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingExamAttempts || isLoadingExams ? <TableSkeleton columns={4} rows={3} /> : <ExamAttemptsTable examAttempts={examAttempts || []} exams={exams || []} />}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Please select a student to view their progress.</p>
          </div>
        )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
