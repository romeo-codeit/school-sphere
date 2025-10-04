import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { getAttendanceByStudent } from '@/lib/api/attendance';
import { getStudentByUserId, getStudentByParentEmail } from '@/lib/api/students';
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

                if (student) {
                    const history = await getAttendanceByStudent(student.$id);
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
      <>
        <TopNav title="My Attendance" subtitle="View your personal attendance history" showGoBackButton={true} />
        <div className="space-y-6">
          <div className="py-6">
            <Card>
              <CardHeader><CardTitle className="text-lg sm:text-xl">Attendance History</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-4">Loading your attendance history...</p> :
                  studentHistory.length === 0 ? <p className="text-center py-4 text-muted-foreground">No attendance records found.</p> :
                  <>
                    {/* Mobile: Card view */}
                    <div className="grid grid-cols-1 gap-4 sm:hidden">
                      {studentHistory.map((record, index) => (
                        <Card key={index} className="p-4 flex justify-between items-center">
                          <div className="text-sm">{new Date(record.date).toLocaleDateString()}</div>
                          <Badge className={cn({
                            "bg-green-500 hover:bg-green-600": record.status === 'present',
                            "bg-red-500 hover:bg-red-600": record.status === 'absent',
                            "bg-yellow-500 hover:bg-yellow-600": record.status === 'late',
                          })}>
                            {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                          </Badge>
                        </Card>
                      ))}
                    </div>
                    {/* Desktop: Table view */}
                    <div className="rounded-md border overflow-x-auto hidden sm:block">
                      <Table className="min-w-[400px]">
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {studentHistory.map((record, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
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
                      </Table>
                    </div>
                  </>
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </>
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
    <>
      <TopNav title="Attendance Management" subtitle="Manage all attendance-related tasks" />
      <div className="space-y-6">
        <div className="py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8">
          {availableLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">{link.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm sm:text-base">{link.description}</p>
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
    </>
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