import React from "react";
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
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useStudentProfilePerformanceTest, logStudentProfilePerformanceMetrics } from '@/hooks/useStudentProfilePerformanceTest';
import { Mail, Phone, Home, User, GraduationCap, Users, AlertTriangle, CheckCircle } from "lucide-react";

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
          return 'primary';
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
                              <Badge 
                                variant={getStatusVariant(payment.status)}
                                aria-label={`Payment status: ${payment.status}`}
                              >
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

interface StudentProfileProps {
  id: string;
}

export default function StudentProfile({ id }: StudentProfileProps) {
  const { useStudent } = useStudents();
  const { data: student, isLoading: isLoadingStudent, error: studentError } = useStudent(id || "");
  const { grades, isLoading: isLoadingGrades, error: gradesError } = useGrades(id || "");
  const { attendance, isLoading: isLoadingAttendance, error: attendanceError } = useAttendance(id || "");
  const { payments, isLoading: isLoadingPayments, error: paymentsError } = usePayments(id || "");

  const { testPerformance, clearCache } = useStudentProfilePerformanceTest(id || "");

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logStudentProfilePerformanceMetrics(metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).studentProfilePerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
        studentId: id,
      };
      console.log('📚 Student Profile Performance Testing available in console:');
      console.log('  window.studentProfilePerfTest.testPerformance() - Run performance test');
      console.log('  window.studentProfilePerfTest.clearCache() - Clear cache and reload');
    }
  }, [id]);

  const outstandingFees = React.useMemo(() => {
    if (!payments || !Array.isArray(payments)) return null;

    const overdueFees = payments.filter((fee: any) => fee.status === 'overdue' || fee.status === 'pending');
    const totalOwed = overdueFees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);
    const nextDueDate = overdueFees
      .filter((fee: any) => fee.dueDate)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate;

    return {
      count: overdueFees.length,
      totalAmount: totalOwed,
      nextDueDate,
      isOverdue: overdueFees.some((fee: any) => fee.status === 'overdue')
    };
  }, [payments]);

  if (isLoadingStudent) {
    return (
      <div className="space-y-6">
        <TopNav title="Student Profile" subtitle="Loading..." showGoBackButton={true} />
        <Card className="overflow-hidden">
          <div className="h-24 bg-primary/10 animate-pulse" />
          <CardContent className="pt-6">
            <div className="flex items-start -mt-16">
              <div className="h-24 w-24 rounded-full bg-muted animate-pulse border-4 border-background" />
              <div className="ml-6 flex-1 space-y-3">
                <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                <div className="h-5 bg-muted rounded animate-pulse w-20" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse flex-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (studentError) {
    return (
      <div className="space-y-6">
        <TopNav title="Student Profile" subtitle="Error" showGoBackButton={true} />
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load student profile</h3>
              <p className="text-muted-foreground">{studentError.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return <div className="p-6 text-center">Student not found.</div>;
  }

  return (
    <div className="space-y-6">
      <TopNav title="Student Profile" subtitle={`Details for ${student.firstName} ${student.lastName}`} showGoBackButton={true} />

      {/* Outstanding Fees Alert */}
      {outstandingFees && (
        <div className={`p-4 rounded-lg border-2 ${
          outstandingFees.isOverdue
            ? 'border-destructive/50 bg-destructive/10 text-destructive'
            : 'border-yellow-500/50 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
        }`} role="alert" aria-live="assertive">
          <div className="flex items-center gap-3">
            {outstandingFees.isOverdue ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold">
                {outstandingFees.isOverdue ? 'Overdue School Fees' : 'Outstanding School Fees'}
              </div>
              <div className="text-sm mt-1">
                {student.firstName} has {outstandingFees.count} outstanding school fee{outstandingFees.count > 1 ? 's' : ''} totaling
                <span className="font-semibold"> ₦{outstandingFees.totalAmount.toLocaleString()}</span>
                {outstandingFees.nextDueDate && (
                  <span> with the next due date on {new Date(outstandingFees.nextDueDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Gender: {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{student.address || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Parent: {student.parentName || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">Parent Phone: {student.parentPhone || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <ErrorBoundary>
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
                {gradesError ? (
                  <div className="text-center py-8 text-destructive">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p>Failed to load grades: {gradesError.message}</p>
                  </div>
                ) : isLoadingGrades ? (
                  <div className="space-y-4">
                    <div className="h-64 bg-muted rounded animate-pulse" />
                    <TableSkeleton columns={3} rows={3} />
                  </div>
                ) : (
                  <GradesChart grades={grades || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="attendance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceError ? (
                  <div className="text-center py-8 text-destructive">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p>Failed to load attendance: {attendanceError.message}</p>
                  </div>
                ) : isLoadingAttendance ? (
                  <div className="space-y-4">
                    <div className="h-32 bg-muted rounded animate-pulse" />
                    <TableSkeleton columns={3} rows={4} />
                  </div>
                ) : (
                  <AttendanceSummary attendance={(attendance || []).map((a: any) => ({
                    date: a.date ? new Date(a.date).toISOString() : new Date().toISOString(),
                    id: a.$id,
                    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
                    studentId: a.studentId || '',
                    classId: a.classId || '',
                    status: a.status as any,
                    remarks: a.remarks || '',
                    markedBy: a.markedBy || '',
                  }))} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsError ? (
                  <div className="text-center py-8 text-destructive">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p>Failed to load payments: {paymentsError.message}</p>
                  </div>
                ) : isLoadingPayments ? (
                  <TableSkeleton columns={4} rows={5} />
                ) : (
                  <PaymentsTable payments={Array.isArray(payments) ? payments.map(p => ({
                    $id: p.$id,
                    purpose: p.purpose,
                    amount: p.amount,
                    status: p.status,
                    paidDate: p.paidDate,
                    dueDate: p.dueDate,
                  })) : []} />
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