import React, { useState, useEffect, useMemo } from 'react';
import { getAllAttendanceRecords, getAllClasses } from '@/lib/api/attendance';
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const AttendanceReports: React.FC = () => {
    const { toast } = useToast();
    const [records, setRecords] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [attendanceResponse, classesResponse] = await Promise.all([
                    getAllAttendanceRecords(100, 0), // Fetching last 100 records for demo
                    getAllClasses()
                ]);
                setRecords(attendanceResponse.documents);
                setClasses(classesResponse);
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch attendance reports data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const { overallStats, dailyTrend, classStats } = useMemo(() => {
        if (records.length === 0) return { overallStats: {}, dailyTrend: [], classStats: [] };

        let totalPresent = 0;
        let totalStudents = 0;
        const dailyData: { [key: string]: { present: number, total: number } } = {};
        const classData: { [key: string]: { present: number, total: number } } = {};

        records.forEach(record => {
            const date = format(new Date(record.date), 'yyyy-MM-dd');
            if (!dailyData[date]) dailyData[date] = { present: 0, total: 0 };

            const classId = record.classId;
            if (!classData[classId]) classData[classId] = { present: 0, total: 0 };

            const studentAttendances = JSON.parse(record.studentAttendances);
            studentAttendances.forEach((att: any) => {
                if (att.status === 'present') {
                    totalPresent++;
                    dailyData[date].present++;
                    classData[classId].present++;
                }
                totalStudents++;
                dailyData[date].total++;
                classData[classId].total++;
            });
        });

        const overallStats = {
            presentRate: totalStudents > 0 ? (totalPresent / totalStudents * 100).toFixed(1) : 0,
            totalRecords: records.length,
        };

        const dailyTrend = Object.keys(dailyData).map(date => ({
            date: format(new Date(date), 'MMM dd'),
            'Attendance (%)': dailyData[date].total > 0 ? (dailyData[date].present / dailyData[date].total * 100) : 0,
        })).slice(0, 7).reverse(); // Last 7 days

        const classStats = Object.keys(classData).map(classId => {
            const classInfo = classes.find(c => c.$id === classId);
            return {
                name: classInfo ? classInfo.name : 'Unknown Class',
                'Attendance (%)': classData[classId].total > 0 ? (classData[classId].present / classData[classId].total * 100) : 0,
            };
        });

        return { overallStats, dailyTrend, classStats };
    }, [records, classes]);

    const getClassName = (classId: string) => classes.find(c => c.$id === classId)?.name || 'Unknown';

    if (isLoading) {
        return <div className="p-6">Loading reports...</div>;
    }

    try {
        return (
            <div className="space-y-6">
            <TopNav title="Attendance Reports" subtitle="School-wide attendance analytics" showGoBackButton={true} />
            <div className="px-4 sm:px-6 lg:px-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Overall Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl sm:text-4xl font-bold">{overallStats.presentRate}%</div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Based on {overallStats.totalRecords} records</p>
                    </CardContent>
                </Card>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base sm:text-lg">Daily Attendance Trend (Last 7 Days)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Attendance (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base sm:text-lg">Attendance Rate by Class</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={classStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Attendance (%)" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="px-4 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader><CardTitle className="text-base sm:text-lg">Recent Attendance Records</CardTitle></CardHeader>
                    <CardContent>
                        {/* Mobile: Card view */}
                        <div className="grid grid-cols-1 gap-4 sm:hidden">
                            {records.slice(0, 10).map(record => {
                                const attendances = JSON.parse(record.studentAttendances);
                                const presentCount = attendances.filter((a: any) => a.status === 'present').length;
                                const totalCount = attendances.length;
                                const rate = totalCount > 0 ? (presentCount / totalCount * 100).toFixed(1) + '%' : 'N/A';
                                return (
                                    <Card key={record.$id} className="p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="font-medium text-base">{getClassName(record.classId)}</div>
                                            <div className="text-sm text-muted-foreground">{format(new Date(record.date), 'PPP')}</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div><span className="font-medium">Present:</span> {presentCount}</div>
                                            <div><span className="font-medium">Total:</span> {totalCount}</div>
                                            <div><span className="font-medium">Rate:</span> <Badge>{rate}</Badge></div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                        {/* Desktop: Table view */}
                        <div className="rounded-md border overflow-x-auto hidden sm:block">
                            <Table className="min-w-[600px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Present</TableHead>
                                        <TableHead>Total Students</TableHead>
                                        <TableHead>Attendance Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.slice(0, 10).map(record => {
                                        const attendances = JSON.parse(record.studentAttendances);
                                        const presentCount = attendances.filter((a: any) => a.status === 'present').length;
                                        const totalCount = attendances.length;
                                        const rate = totalCount > 0 ? (presentCount / totalCount * 100).toFixed(1) + '%' : 'N/A';
                                        return (
                                            <TableRow key={record.$id}>
                                                <TableCell className="text-sm">{getClassName(record.classId)}</TableCell>
                                                <TableCell className="text-sm">{format(new Date(record.date), 'PPP')}</TableCell>
                                                <TableCell className="text-sm">{presentCount}</TableCell>
                                                <TableCell className="text-sm">{totalCount}</TableCell>
                                                <TableCell className="text-sm"><Badge>{rate}</Badge></TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        );
    } catch (err) {
        console.error('Attendance Reports page error:', err);
        return <div style={{color: 'red', padding: 24}}>A fatal error occurred in Attendance Reports page. Check the console for details.</div>;
    }
};

export default AttendanceReports;