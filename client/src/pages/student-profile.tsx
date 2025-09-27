import { useParams } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useAttendance } from "@/hooks/useAttendance";
import { usePayments } from "@/hooks/usePayments";
import { GradesChart, AttendanceSummary } from "./progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Home, User, GraduationCap } from "lucide-react";

interface Payment {
  $id: string;
  purpose: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  dueDate: string;
}

function PaymentsTable({ payments }: { payments: Payment[] }) {
    if (!payments || payments.length === 0) {
        return <p className="text-center text-muted-foreground py-4">No payments available.</p>;
    }

    const getStatusVariant = (status: string) => {
      switch (status) {
        case 'paid':
          return 'success';
        case 'overdue':
          return 'destructive';
        default:
          return 'secondary';
      }
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="py-3">Purpose</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment: Payment) => (
                        <TableRow key={payment.$id} className="hover:bg-muted/50">
                            <TableCell>{payment.purpose}</TableCell>
                            <TableCell>₦{parseFloat(payment.amount.toString()).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(payment.status)}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(payment.paidDate || payment.dueDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.id;
  const { useStudent } = useStudents();
  const { data: student, isLoading: isLoadingStudent } = useStudent(studentId || "");
  const { grades, isLoading: isLoadingGrades } = useGrades(studentId || "");
  const { attendance, isLoading: isLoadingAttendance } = useAttendance(studentId || "");
  const { payments, isLoading: isLoadingPayments } = usePayments(studentId || "");

  if (isLoadingStudent) {
    return <div className="p-6 text-center">Loading student profile...</div>;
  }

  if (!student) {
    return <div className="p-6 text-center">Student not found.</div>;
  }

  return (
    <div className="space-y-6">
      <TopNav title="Student Profile" subtitle={`Details for ${student.firstName} ${student.lastName}`} showGoBackButton={true} />

      <div className="p-6 space-y-6">
        <Card className="overflow-hidden">
          <div className="h-24 bg-primary/10" />
          <CardContent className="pt-6">
            <div className="flex items-start -mt-16">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={student.profileImageUrl} />
                <AvatarFallback className="text-3xl">
                  {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-6">
                <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
                <p className="text-muted-foreground">Student ID: {student.studentId}</p>
                <p className="text-muted-foreground">Class: {student.class}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{student.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{student.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3 col-span-2">
                <Home className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{student.address || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Parent: {student.parentName || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{student.parentPhone || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="grades" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="grades" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingGrades ? <p className="text-center py-8">Loading grades...</p> : <GradesChart grades={grades || []} />}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="attendance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? <p className="text-center py-8">Loading attendance...</p> : <AttendanceSummary attendance={attendance || []} />}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? <p className="text-center py-8">Loading payments...</p> : <PaymentsTable payments={payments || []} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}