import { useState, useMemo } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useQuery } from "@tanstack/react-query";
import { getAllAttendanceRecords, getAllClasses } from "@/lib/api/attendance";
import { format } from 'date-fns';

export function AttendanceManagementView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['allAttendance'],
    queryFn: () => getAllAttendanceRecords(500) // Fetch a large number for admin view
  });

  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['allClasses'],
    queryFn: getAllClasses,
  });

  const { students, isLoading: isLoadingStudents } = useStudents();

  const flattenedAttendance = useMemo(() => {
    if (!attendanceRecords?.documents || !students || !classes) return [];

    return attendanceRecords.documents.flatMap(record => {
      const classInfo = classes.find(c => c.$id === record.classId);
      const studentAttendances = JSON.parse(record.studentAttendances);

      return studentAttendances.map((att: any) => {
        const studentInfo = students.find(s => s.$id === att.studentId);
        return {
          id: `${record.$id}-${att.studentId}`,
          date: record.date,
          status: att.status,
          studentName: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'Unknown Student',
          className: classInfo ? classInfo.name : 'Unknown Class',
        };
      });
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, students, classes]);

  const filteredAttendance = useMemo(() => {
    return flattenedAttendance.filter(record =>
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.className.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [flattenedAttendance, searchQuery]);

  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isLoading = isLoadingAttendance || isLoadingClasses || isLoadingStudents;

  return (
    <div className="space-y-6">
      <TopNav title="Attendance Log" subtitle="A comprehensive log of all attendance records" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student or class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-8">Loading all attendance records...</div>
            ) : paginatedAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No records found.
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.studentName}</TableCell>
                          <TableCell>{record.className}</TableCell>
                          <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'present' ? 'primary' : record.status === 'absent' ? 'destructive' : 'secondary'}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}