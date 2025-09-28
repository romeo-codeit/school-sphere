import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { getAttendanceByClass, getStudentByUserId, getStudentByParentEmail } from '@/lib/api/attendance';
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';

const StudentAttendanceView: React.FC = () => {
    const { user } = useAuth();
    const { role } = useRole();
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!user || !role) return;

            try {
                let student;
                if (role === 'student') {
                    student = await getStudentByUserId(user.$id);
                } else if (role === 'parent' && user.email) {
                    student = await getStudentByParentEmail(user.email);
                }

                if (student && student.classId) {
                    const classAttendanceRecords = await getAttendanceByClass(student.classId);

                    const history = classAttendanceRecords.map(record => {
                        const studentAttendances = JSON.parse(record.studentAttendances);
                        const studentStatus = studentAttendances.find((att: any) => att.studentId === student.$id);
                        return {
                            date: record.date,
                            status: studentStatus ? studentStatus.status : 'N/A',
                        };
                    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    setStudentHistory(history);
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch attendance history.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudentData();
    }, [user, role, toast]);

    return (
        <div className="space-y-6">
            <TopNav title="My Attendance" subtitle="View your personal attendance history" showGoBackButton={true} />
            <div className="p-6">
                <Card>
                    <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
                    <CardContent>
                        {isLoading ? <p>Loading your attendance history...</p> :
                         studentHistory.length === 0 ? <p>No attendance records found.</p> :
                         <div className="rounded-md border"><Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {studentHistory.map((record, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={cn({
                                                "bg-green-500 hover:bg-green-600": record.status === 'present',
                                                "bg-red-500 hover:bg-red-600": record.status === 'absent',
                                                "bg-yellow-500 hover:bg-yellow-600": record.status === 'late',
                                            })}>
                                                {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table></div>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AttendanceHubView: React.FC = () => {
  const { role } = useRole();

  const navLinks = [
    {
      title: "Take Attendance",
      description: "Mark attendance for a class session.",
      href: "/take-attendance",
      roles: ["admin", "teacher"],
    },
    {
      title: "Historical Attendance",
      description: "View and manage past attendance records.",
      href: "/historical-attendance",
      roles: ["admin", "teacher"],
    },
    {
      title: "Attendance Reports",
      description: "Generate and view attendance analytics.",
      href: "/attendance-reports",
      roles: ["admin"],
    },
  ];

  const availableLinks = navLinks.filter(link => role && link.roles.includes(role));

  return (
    <div className="space-y-6">
      <TopNav title="Attendance Management" subtitle="Manage all attendance-related tasks" />
      <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availableLinks.map((link) => (
          <Link href={link.href} key={link.href}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer flex flex-col">
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{link.description}</p>
              </CardContent>
              <div className="p-6 pt-0">
                  <Button variant="link" className="p-0">
                    Go to Page <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};


export default function Attendance() {
    const { role } = useRole();

    if (!role) {
        return <div>Loading...</div>;
    }

    switch (role) {
        case 'student':
        case 'parent':
            return <StudentAttendanceView />;
        case 'teacher':
        case 'admin':
            return <AttendanceHubView />;
        default:
            return <div>You do not have permission to view this page.</div>;
    }
}