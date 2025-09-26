import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useExams } from "@/hooks/useExams";
import { useAttendance } from "@/hooks/useAttendance";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentsProgressChart } from "@/components/students-progress-chart";
import { NoticeBoard } from "@/components/notice-board";
import { RecentActivityWidget } from "@/components/recent-activity-widget";
import { EventCalendar } from "@/components/event-calendar";
import { useActivities } from "@/hooks/useActivities";

const RoundedBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  const radius = 6;
  const getPath = (x: number, y: number, width: number, height: number) => {
    if (height === 0) return '';
    return `M${x},${y + height} L${x},${y + radius} C${x},${y} ${x},${y} ${x + radius},${y} L${x + width - radius},${y} C${x + width},${y} ${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z`;
  };
  return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
};

export function AdminDashboard() {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useDashboard();
  const { students, isLoading: studentsLoading } = useStudents();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { exams, isLoading: examsLoading } = useExams();
  const { attendance, isLoading: attendanceLoading } = useAttendance();
  const { activities: recentActivities, isLoading: activitiesLoading } = useActivities();
  const [, setLocation] = useLocation();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (attendance) {
      const dailyAttendance: { [key: string]: { present: number; absent: number } } = {};
      attendance.forEach((record: any) => {
        const date = new Date(record.date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyAttendance[dayOfWeek]) {
          dailyAttendance[dayOfWeek] = { present: 0, absent: 0 };
        }
        if (record.status === 'present') {
          dailyAttendance[dayOfWeek].present++;
        } else if (record.status === 'absent') {
          dailyAttendance[dayOfWeek].absent++;
        }
      });
      const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const formattedChartData = daysOrder.map(day => ({
        name: day,
        present: dailyAttendance[day]?.present || 0,
        absent: dailyAttendance[day]?.absent || 0,
      }));
      setChartData(formattedChartData);
    }
  }, [attendance]);

  const totalPaidStudents = payments?.filter((p: any) => p.status === 'paid').length || 0;
  const totalPendingPayments = payments?.filter((p: any) => p.status === 'pending').length || 0;
  const totalOverduePayments = payments?.filter((p: any) => p.status === 'overdue').length || 0;
  const jambQuestions = exams?.filter((e: any) => e.type === 'JAMB').length || 0;
  const waecQuestions = exams?.filter((e: any) => e.type === 'WAEC').length || 0;
  const necoQuestions = exams?.filter((e: any) => e.type === 'NECO').length || 0;

  const studentGenderData = [
    { name: 'Male', value: 0, fill: 'var(--primary)' },
    { name: 'Female', value: 0, fill: 'var(--secondary)' }
  ];
  if (students && students.length > 0) {
    const maleStudents = students.filter((s: any) => s.gender && s.gender.toLowerCase() === 'male').length;
    const femaleStudents = students.filter((s: any) => s.gender && s.gender.toLowerCase() === 'female').length;
    studentGenderData[0].value = (maleStudents / students.length) * 100;
    studentGenderData[1].value = (femaleStudents / students.length) * 100;
  }

  return (
    <div className="space-y-6">
      <TopNav title="Admin Dashboard" subtitle={`Welcome back, ${user?.name || 'Admin'}`} />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-4 md:p-6">
          <StatsCard title="Total Students" value={statsLoading ? "..." : stats?.totalStudents || 0} icon={Users} />
          <StatsCard title="Active Teachers" value={statsLoading ? "..." : stats?.activeTeachers || 0} icon={UserCheck} />
          <StatsCard title="Pending Payments" value={statsLoading ? "..." : stats?.pendingPayments || "₦0"} icon={CreditCard} />
          <StatsCard title="Avg. Attendance" value={statsLoading ? "..." : stats?.averageAttendance || "0%"} icon={BarChart3} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
          <Card>
            <CardHeader><CardTitle>Weekly Attendance</CardTitle></CardHeader>
            <CardContent>{attendanceLoading ? <p>Loading...</p> : <ResponsiveContainer width="100%" height={300}><BarChart data={chartData} barSize={10}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)'}} /><Bar dataKey="present" fill="var(--primary)" name="Present" shape={<RoundedBar />} /><Bar dataKey="absent" fill="var(--secondary)" name="Absent" shape={<RoundedBar />} /></BarChart></ResponsiveContainer>}</CardContent>
          </Card>
          <StudentsProgressChart data={studentGenderData} />
          <EventCalendar />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
          <div className="lg:col-span-2 space-y-6"><NoticeBoard notices={recentActivities || []} /></div>
          <div className="space-y-6 lg:pr-0"><RecentActivityWidget activities={recentActivities || []} /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 p-4 md:p-6">
          <Card className="h-full">
            <CardHeader><CardTitle>Payment Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg"><div className="flex items-center space-x-3"><div className="w-3 h-3 bg-secondary rounded-full"></div><span className="font-medium text-foreground">Paid Students</span></div><span className="font-bold text-foreground">{totalPaidStudents}</span></div>
              <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg"><div className="flex items-center space-x-3"><div className="w-3 h-3 bg-accent rounded-full"></div><span className="font-medium text-foreground">Pending Payments</span></div><span className="font-bold text-foreground">{totalPendingPayments}</span></div>
              <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg"><div className="flex items-center space-x-3"><div className="w-3 h-3 bg-destructive rounded-full"></div><span className="font-medium text-foreground">Overdue</span></div><span className="font-bold text-foreground">{totalOverduePayments}</span></div>
              <div className="pt-4 border-t border-border"><Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setLocation('/payments')}>View Payment Details</Button></div>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Exam Module</CardTitle><Button variant="outline" size="sm" onClick={() => setLocation('/exams')}>Manage Exams</Button></div></CardHeader>
            <CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="text-center p-6 border border-border rounded-lg"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="text-primary text-2xl" /></div><h4 className="font-semibold">JAMB Questions</h4><p className="text-2xl font-bold">{jambQuestions}</p></div><div className="text-center p-6 border rounded-lg"><div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="text-secondary text-2xl" /></div><h4 className="font-semibold">WAEC Questions</h4><p className="text-2xl font-bold">{waecQuestions}</p></div><div className="text-center p-6 border rounded-lg"><div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="text-accent text-2xl" /></div><h4 className="font-semibold">NECO Questions</h4><p className="text-2xl font-bold">{necoQuestions}</p></div></div></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}