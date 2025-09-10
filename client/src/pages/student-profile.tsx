import { useParams } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useAttendance } from "@/hooks/useAttendance";
import { usePayments } from "@/hooks/usePayments";
import { GradesChart, AttendanceSummary } from "./progress"; // Reusing components from progress page
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function PaymentsTable({ payments }) {
    if (!payments || payments.length === 0) {
        return <p>No payments available.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payments.map(payment => (
                    <TableRow key={payment.$id}>
                        <TableCell>{payment.purpose}</TableCell>
                        <TableCell>₦{parseFloat(payment.amount.toString()).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              payment.status === 'paid' ? 'default' : 
                              payment.status === 'overdue' ? 'destructive' : 'secondary'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(payment.paidDate || payment.dueDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.id;
  const { useStudent } = useStudents();
  const { data: student, isLoading: isLoadingStudent } = useStudent(studentId);
  const { grades, isLoading: isLoadingGrades } = useGrades(studentId);
  const { attendance, isLoading: isLoadingAttendance } = useAttendance(studentId);
  const { payments, isLoading: isLoadingPayments } = usePayments(studentId);

  if (isLoadingStudent) {
    return <div className="p-6">Loading student profile...</div>;
  }

  if (!student) {
    return <div className="p-6">Student not found.</div>;
  }

  return (
    <div className="space-y-6">
      <TopNav title="Student Profile" subtitle={`${student.firstName} ${student.lastName}`} />

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={student.profileImageUrl} />
                <AvatarFallback className="text-3xl">
                  {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
                <p className="text-muted-foreground">Student ID: {student.studentId}</p>
                <p className="text-muted-foreground">Class: {student.class}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="grades">
          <TabsList>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="grades" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Grades</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingGrades ? <p>Loading grades...</p> : <GradesChart grades={grades} />}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="attendance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? <p>Loading attendance...</p> : <AttendanceSummary attendance={attendance} />}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? <p>Loading payments...</p> : <PaymentsTable payments={payments} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}