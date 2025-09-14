import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useAttendance } from "@/hooks/useAttendance";
import { useExamAttempts } from "@/hooks/useExamAttempts";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Grade {
  subject: string;
  score: string;
  totalMarks: string;
}

interface AttendanceRecord {
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface ExamAttempt {
  id: string;
  examId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export function GradesChart({ grades }: { grades: Grade[] }) {
  const data = useMemo(() => {
    return grades?.map((grade: Grade) => ({
      name: grade.subject,
      score: parseFloat(grade.score),
      totalMarks: parseFloat(grade.totalMarks),
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

export function AttendanceSummary({ attendance }: { attendance: AttendanceRecord[] }) {
    const summary = useMemo(() => {
        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        attendance?.forEach((record: AttendanceRecord) => {
            if (record.status in counts) {
                counts[record.status]++;
            }
        });
        return counts;
    }, [attendance]);

    if (!attendance || attendance.length === 0) {
        return <p>No attendance records available.</p>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Present</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{summary.present}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Absent</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{summary.absent}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Late</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{summary.late}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Excused</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{summary.excused}</p>
                </CardContent>
            </Card>
        </div>
    );
}

export function ExamAttemptsTable({ examAttempts }: { examAttempts: ExamAttempt[] }) {
    if (!examAttempts || examAttempts.length === 0) {
        return <p>No exam attempts available.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Total Questions</TableHead>
                    <TableHead>Correct Answers</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {examAttempts.map((attempt: ExamAttempt) => (
                    <TableRow key={attempt.id}>
                        <TableCell>{attempt.examId}</TableCell> {/* Ideally, we would fetch exam title here */}
                        <TableCell>{attempt.score}</TableCell>
                        <TableCell>{attempt.totalQuestions}</TableCell>
                        <TableCell>{attempt.correctAnswers}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function Progress() {
  const { user } = useAuth();
  const { role } = useRole();
  const { students } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const studentIdToFetch = useMemo(() => {
    if (role === 'student') {
      return user?.$id;
    }
    return selectedStudentId;
  }, [role, user, selectedStudentId]);

  const { grades, isLoading: isLoadingGrades } = useGrades(studentIdToFetch || '');
  const { attendance, isLoading: isLoadingAttendance } = useAttendance(studentIdToFetch || '');
  const { examAttempts, isLoading: isLoadingExamAttempts } = useExamAttempts(studentIdToFetch || '');

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  return (
    <div className="space-y-6">
      <TopNav title="Progress" subtitle="Track student progress and performance" />

      <div className="p-6 space-y-6">
        {(role === 'admin' || role === 'teacher') && (
          <Card>
            <CardHeader>
              <CardTitle>Select Student</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleStudentChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(student => (
                    <SelectItem key={student.$id} value={student.$id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {studentIdToFetch ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grades</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingGrades ? <p>Loading grades...</p> : <GradesChart grades={grades || []} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? <p>Loading attendance...</p> : <AttendanceSummary attendance={attendance || []} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exam Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingExamAttempts ? <p>Loading exam attempts...</p> : <ExamAttemptsTable examAttempts={examAttempts || []} />}
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
