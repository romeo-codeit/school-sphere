import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Grade, Attendance, ExamAttempt, Exam } from "~/shared/schema";

export function GradesChart({ grades }: { grades: Grade[] }) {
  const data = useMemo(() => {
    return grades?.map((grade: Grade) => ({
      name: grade.subject,
      score: grade.score,
      totalMarks: grade.totalMarks,
    })).sort((a, b) => a.name.localeCompare(b.name)) || [];
  }, [grades]);

  if (!grades || grades.length === 0) {
    return <p>No grades available.</p>;
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
        console.error("Failed to fetch student for role", e);
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
                      ? students?.find(student => student.$id === selectedStudentId)?.firstName + ' ' + students?.find(student => student.$id === selectedStudentId)?.lastName
                      : "Select student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search student..." />
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {students?.map(student => (
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
                {isLoadingGrades ? <p>Loading grades...</p> : <GradesChart grades={grades || []} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? <p>Loading attendance...</p> : <AttendanceSummary attendance={attendance || []} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Exam Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingExamAttempts || isLoadingExams ? <p>Loading exam attempts...</p> : <ExamAttemptsTable examAttempts={examAttempts || []} exams={exams || []} />}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Please select a student to view their progress.</p>
          </div>
        )}
      </div>
    </div>
  );
}
