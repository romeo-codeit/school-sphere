
import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClasses } from "@/hooks/useClasses";
import { useToast } from "@/hooks/use-toast";
import { databases } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export default function HistoricalAttendance() {
  const { user } = useAuth();
  const { classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <TopNav title="Historical Attendance" subtitle="View past attendance records for your classes" showGoBackButton={true} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <select
              className="border rounded p-2 mt-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              value={selectedClassId || ''}
              onChange={e => {
                setSelectedClassId(e.target.value);
                fetchAttendance(e.target.value);
              }}
            >
              <option value="">Select a class...</option>
              {classesLoading ? <option disabled>Loading...</option> :
                classes?.map((c: any) => <option key={c.$id} value={c.$id}>{c.name}</option>)}
            </select>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading attendance records...</p> :
              selectedClassId && records.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
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
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{present}</TableCell>
                            <TableCell>{absent}</TableCell>
                            <TableCell>{late}</TableCell>
                            <TableCell>{excused}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : selectedClassId ? <p>No attendance records found for this class.</p> : <p>Please select a class.</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
