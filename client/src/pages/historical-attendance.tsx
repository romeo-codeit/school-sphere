import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClasses } from "@/hooks/useClasses";
import { useToast } from "@/hooks/use-toast";
import { databases } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useAttendancePerformanceTest, logAttendancePerformanceMetrics } from '@/hooks/useAttendancePerformanceTest';
import React from "react";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export default function HistoricalAttendance() {
  const { user } = useAuth();
  const { classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { testPerformance, clearCache } = useAttendancePerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logAttendancePerformanceMetrics(metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).historicalAttendancePerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

  const fetchAttendance = async (classId: string) => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        'attendance',
        []
      );
      setRecords(response.documents.filter((r: any) => r.classId === classId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Refetch attendance when notified by Take Attendance page
  React.useEffect(() => {
    const handler = () => {
      if (selectedClassId) fetchAttendance(selectedClassId);
    };
    window.addEventListener('attendanceSubmitted', handler);
    return () => window.removeEventListener('attendanceSubmitted', handler);
  }, [selectedClassId]);

  return (
    <>
      <TopNav title="Historical Attendance" subtitle="View past attendance records for your classes" showGoBackButton={true} />
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <ErrorBoundary>
          <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">Select Class</CardTitle>
              <Select onValueChange={classId => { setSelectedClassId(classId); fetchAttendance(classId); }}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classesLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                   classes?.map((c: any) => <SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? <TableSkeleton columns={5} rows={5} /> :
              !selectedClassId ? <p className="text-center text-muted-foreground py-8">Please select a class to view attendance records.</p> :
              records.length === 0 ? <p className="text-center text-muted-foreground py-8">No attendance records found for this class.</p> :
              <>
                {/* Mobile: Card view */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {records.map((record: any) => {
                    const attendances = JSON.parse(record.studentAttendances);
                    const present = attendances.filter((a: any) => a.status === 'present').length;
                    const absent = attendances.filter((a: any) => a.status === 'absent').length;
                    const late = attendances.filter((a: any) => a.status === 'late').length;
                    const excused = attendances.filter((a: any) => a.status === 'excused').length;
                    return (
                      <Card key={record.$id} className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-base">{new Date(record.date).toLocaleDateString()}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">Present:</span> {present}</div>
                          <div><span className="font-medium">Absent:</span> {absent}</div>
                          <div><span className="font-medium">Late:</span> {late}</div>
                          <div><span className="font-medium">Excused:</span> {excused}</div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {/* Desktop: Table view */}
                <div className="rounded-md border overflow-x-auto hidden sm:block">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Present</TableHead>
                        <TableHead>Absent</TableHead>
                        <TableHead>Late</TableHead>
                        <TableHead>Excused</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record: any) => {
                        const attendances = JSON.parse(record.studentAttendances);
                        const present = attendances.filter((a: any) => a.status === 'present').length;
                        const absent = attendances.filter((a: any) => a.status === 'absent').length;
                        const late = attendances.filter((a: any) => a.status === 'late').length;
                        const excused = attendances.filter((a: any) => a.status === 'excused').length;
                        return (
                          <TableRow key={record.$id}>
                            <TableCell className="text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-sm">{present}</TableCell>
                            <TableCell className="text-sm">{absent}</TableCell>
                            <TableCell className="text-sm">{late}</TableCell>
                            <TableCell className="text-sm">{excused}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>}
          </CardContent>
        </Card>
        </ErrorBoundary>
      </div>
      </div>
    </>
  );
}
