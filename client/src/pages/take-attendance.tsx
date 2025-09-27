import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTeacherClasses, getStudentsByClass, getAttendance, saveAttendance } from '@/lib/api/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const TakeAttendance: React.FC = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (user) {
            // Assuming the teacher's document ID in the 'teachers' collection is the same as the user's ID
            getTeacherClasses(user.$id).then(setClasses);
        }
    }, [user]);

    useEffect(() => {
        if (selectedClass) {
            setIsLoading(true);
            Promise.all([
                getStudentsByClass(selectedClass),
                getAttendance(selectedClass, today)
            ]).then(([studentDocs, attendanceDoc]) => {
                setStudents(studentDocs);
                if (attendanceDoc) {
                    setAttendance(JSON.parse(attendanceDoc.studentAttendances));
                } else {
                    const initialAttendance = studentDocs.reduce((acc, student) => {
                        acc[student.$id] = 'present';
                        return acc;
                    }, {});
                    setAttendance(initialAttendance);
                }
                setIsLoading(false);
            });
        }
    }, [selectedClass, today]);

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendance((prev: any) => ({
            ...prev,
            [studentId]: status,
        }));
    };

    const handleSubmit = async () => {
        if (!selectedClass) return;
        setIsSubmitting(true);
        try {
            const studentAttendances = Object.keys(attendance).map(studentId => ({
                studentId,
                status: attendance[studentId]
            }));
            await saveAttendance(selectedClass, today, studentAttendances);
            toast({ title: "Success", description: "Attendance saved successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save attendance.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Take Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Select onValueChange={setSelectedClass} disabled={classes.length === 0}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isLoading ? (
                            <p>Loading students...</p>
                        ) : students.length > 0 ? (
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student Name</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {students.map((student) => (
                                                <TableRow key={student.$id}>
                                                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant={attendance[student.$id] === 'present' ? 'default' : 'outline'}
                                                                onClick={() => handleStatusChange(student.$id, 'present')}
                                                            >
                                                                Present
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={attendance[student.$id] === 'absent' ? 'destructive' : 'outline'}
                                                                onClick={() => handleStatusChange(student.$id, 'absent')}
                                                            >
                                                                Absent
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={attendance[student.$id] === 'late' ? 'secondary' : 'outline'}
                                                                onClick={() => handleStatusChange(student.$id, 'late')}
                                                            >
                                                                Late
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : selectedClass ? (
                            <p>No students in this class.</p>
                        ) : (
                            <p>Please select a class to take attendance.</p>
                        )}

                        {students.length > 0 && (
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TakeAttendance;