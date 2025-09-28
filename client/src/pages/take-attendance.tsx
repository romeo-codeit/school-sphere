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

export default function TakeAttendance() {
  const { classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { students, isLoading: studentsLoading } = useStudents({ classId: selectedClassId || undefined });
  const { createAttendance } = useAttendance();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<{ [studentId: string]: string }>({});

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      toast({ title: "Error", description: "Please select a class.", variant: "destructive" });
      return;
    }

    const studentAttendances = Object.keys(attendance).map(studentId => ({
      studentId,
      status: attendance[studentId],
    }));

    if (studentAttendances.length === 0) {
      toast({ title: "Error", description: "No attendance data to submit.", variant: "destructive" });
      return;
    }

    try {
      await createAttendance({
        classId: selectedClassId,
        date: new Date().toISOString(),
        studentAttendances: JSON.stringify(studentAttendances),
      });
      toast({ title: "Success", description: "Attendance submitted successfully." });
      setAttendance({});
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
  <TopNav title="Take Attendance" subtitle="Mark student attendance for a class" showGoBackButton={true} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Class</CardTitle>
              <Select onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-[280px]">
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
             (studentsLoading ? <p>Loading students...</p> :
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students?.map((student: any) => (
                      <TableRow key={student.$id}>
                        <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
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
                <div className="flex justify-end p-4">
                  <Button onClick={handleSubmit}>Submit Attendance</Button>
                </div>
              </div>) :
             <p className="text-center text-muted-foreground p-8">Please select a class to take attendance.</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
