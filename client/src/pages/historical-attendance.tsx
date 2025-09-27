import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTeacherClasses, getStudentsByClass, getAttendance, saveAttendance } from '@/lib/api/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

const HistoricalAttendance: React.FC = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any>({});
    const [originalAttendance, setOriginalAttendance] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            // Assuming the teacher's document ID in the 'teachers' collection is the same as the user's ID
            getTeacherClasses(user.$id).then(setClasses);
        }
    }, [user]);

    const fetchAttendanceData = async () => {
        if (!selectedClass || !date) return;
        setIsLoading(true);
        try {
            const studentDocs = await getStudentsByClass(selectedClass);
            setStudents(studentDocs);

            const attendanceDoc = await getAttendance(selectedClass, date.toISOString().split('T')[0]);
            if (attendanceDoc) {
                const parsedAttendance = JSON.parse(attendanceDoc.studentAttendances);
                // Convert array of objects to a map for easier lookup
                const attendanceMap = parsedAttendance.reduce((acc: any, item: any) => {
                    acc[item.studentId] = item.status;
                    return acc;
                }, {});
                setAttendance(attendanceMap);
                setOriginalAttendance(attendanceDoc);
            } else {
                setAttendance({});
                setOriginalAttendance(null);
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch attendance data.", variant: "destructive" });
            setAttendance({});
            setOriginalAttendance(null);
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [selectedClass, date]);

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendance((prev: any) => ({
            ...prev,
            [studentId]: status,
        }));
    };

    const handleSaveChanges = async () => {
        if (!selectedClass || !date || !originalAttendance) return;
        setIsSubmitting(true);
        try {
            const studentAttendances = Object.keys(attendance).map(studentId => ({
                studentId,
                status: attendance[studentId]
            }));
            await saveAttendance(selectedClass, date.toISOString().split('T')[0], studentAttendances);
            toast({ title: "Success", description: "Attendance updated successfully." });
            setIsEditing(false);
            // Refetch data to confirm changes
            fetchAttendanceData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (originalAttendance) {
            const parsedAttendance = JSON.parse(originalAttendance.studentAttendances);
            const attendanceMap = parsedAttendance.reduce((acc: any, item: any) => {
                acc[item.studentId] = item.status;
                return acc;
            }, {});
            setAttendance(attendanceMap);
        }
        setIsEditing(false);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Historical Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <Select onValueChange={setSelectedClass} disabled={classes.length === 0}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {isLoading ? (
                        <p>Loading attendance data...</p>
                    ) : !selectedClass ? (
                        <p>Please select a class and date to view attendance.</p>
                    ) : students.length === 0 ? (
                        <p>No students found for this class.</p>
                    ) : Object.keys(attendance).length === 0 ? (
                        <p>No attendance record found for this day.</p>
                    ) : (
                        <>
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
                                                        {isEditing ? (
                                                             <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant={attendance[student.$id] === 'present' ? 'default' : 'outline'} onClick={() => handleStatusChange(student.$id, 'present')}>Present</Button>
                                                                <Button size="sm" variant={attendance[student.$id] === 'absent' ? 'destructive' : 'outline'} onClick={() => handleStatusChange(student.$id, 'absent')}>Absent</Button>
                                                                <Button size="sm" variant={attendance[student.$id] === 'late' ? 'secondary' : 'outline'} onClick={() => handleStatusChange(student.$id, 'late')}>Late</Button>
                                                            </div>
                                                        ) : (
                                                            <span className={cn("font-semibold", {
                                                                "text-green-600": attendance[student.$id] === 'present',
                                                                "text-red-600": attendance[student.$id] === 'absent',
                                                                "text-yellow-600": attendance[student.$id] === 'late',
                                                            })}>
                                                                {attendance[student.$id]?.charAt(0).toUpperCase() + attendance[student.$id]?.slice(1) || 'N/A'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end gap-2 mt-4">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                        <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>Edit</Button>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HistoricalAttendance;