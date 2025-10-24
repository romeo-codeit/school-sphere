import React, { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { withBase } from "@/lib/http";
import { useDashboard } from "@/hooks/useDashboard";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useExams } from "@/hooks/useExams";
import { useAttendance } from "@/hooks/useAttendance";
import { useActivities } from "@/hooks/useActivities";
import { useNotices } from "@/hooks/useNotices";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentsProgressChart } from "@/components/students-progress-chart";
import { NoticeBoard } from "@/components/notice-board";
import type { Notice } from "@/components/notice-board";
import { RecentActivityWidget } from "@/components/recent-activity-widget";
import { EventCalendar } from "@/components/event-calendar";
import { QuickTipsWidget } from "@/components/quick-tips-widget";
import { SubscriptionManager } from "@/components/subscription-manager";
import { AccountApprovalManager } from "@/components/account-approval-manager";

const RoundedBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  const radius = 6;
  const getPath = (x: number, y: number, width: number, height: number) => {
    if (height === 0) return '';
    return `M${x},${y + height} L${x},${y + radius} C${x},${y} ${x},${y} ${x + radius},${y} L${x + width - radius},${y} C${x + width},${y} ${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z`;
  };
  return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
};

import { AdminDashboardSkeleton } from "@/components/skeletons/admin-dashboard-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { useAdminDashboardPerformanceTest } from "@/hooks/useAdminDashboardPerformanceTest";

export function AdminDashboard() {
  const { user, getJWT } = useAuth();
  // Local state for richer profile name (first + last) sourced from userProfiles collection
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const jwt = await getJWT();
        const jwtResp = jwt
          ? await fetch(withBase('/api/users/me'), { headers: { Authorization: `Bearer ${jwt}` }, credentials: 'include' }).catch(() => null)
          : null;
        if (!jwtResp || !jwtResp.ok) {
          if (!cancelled) setDisplayName(user?.name || null);
          return;
        }
        const me = await jwtResp.json();
        let fullName: string | null = null;
        if (me?.firstName || me?.lastName) {
          fullName = [me.firstName, me.lastName].filter(Boolean).join(' ').trim() || null;
        }
        if (!fullName && me?.name) fullName = me.name;
        if (!fullName && user?.name) fullName = user.name;
        if (!cancelled) setDisplayName(fullName);
      } catch (e: any) {
        if (!cancelled) {
          setProfileError(e?.message || 'Failed to load profile');
          setDisplayName(user?.name || null);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [user?.name]);
  const { stats, isLoading: statsLoading, error: statsError } = useDashboard();
  const { students, isLoading: studentsLoading, error: studentsError } = useStudents({ limit: 1000 }); // Fetch all students for stats
  const { payments, isLoading: paymentsLoading, error: paymentsError } = usePayments();
  const { exams, isLoading: examsLoading, error: examsError } = useExams();
  const { attendance, isLoading: attendanceLoading, error: attendanceError } = useAttendance();
  const { activities: recentActivities, isLoading: activitiesLoading, error: activitiesError } = useActivities();
  const { notices, isLoading: noticesLoading, error: noticesError } = useNotices(5);

  // Performance testing hook
  useAdminDashboardPerformanceTest();
  const [, setLocation] = useLocation();
  const [chartData, setChartData] = useState<any[]>([]);

  const isLoading = statsLoading || studentsLoading || paymentsLoading || examsLoading || attendanceLoading || activitiesLoading || noticesLoading;
  const isError = statsError || studentsError || paymentsError || examsError || attendanceError || activitiesError || noticesError;

  useEffect(() => {
    if (attendance) {
      const weeklyAttendance: { [key: string]: { present: number; absent: number } } = {
        'Sun': { present: 0, absent: 0 },
        'Mon': { present: 0, absent: 0 },
        'Tue': { present: 0, absent: 0 },
        'Wed': { present: 0, absent: 0 },
        'Thu': { present: 0, absent: 0 },
        'Fri': { present: 0, absent: 0 },
        'Sat': { present: 0, absent: 0 },
      };

      attendance.forEach((record: any) => {
        const date = new Date(record.date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (weeklyAttendance[dayOfWeek]) {
          if (record.status === 'present') {
            weeklyAttendance[dayOfWeek].present++;
          } else if (record.status === 'absent') {
            weeklyAttendance[dayOfWeek].absent++;
          }
        }
      });

      const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const formattedChartData = daysOrder.map(day => ({
        name: day,
        present: weeklyAttendance[day]?.present || 0,
        absent: weeklyAttendance[day]?.absent || 0,
      }));
      setChartData(formattedChartData);
    }
  }, [attendance]);

  const totalPaidStudents = payments?.filter((p: any) => p.status === 'paid').length || 0;
  const totalPendingPayments = payments?.filter((p: any) => p.status === 'pending').length || 0;
  const totalOverduePayments = payments?.filter((p: any) => p.status === 'overdue').length || 0;

  const studentGenderData = [
    { name: 'Male', value: 0, fill: 'var(--primary)' },
    { name: 'Female', value: 0, fill: 'var(--secondary)' }
  ];
  if (students && students.length > 0) {
    const maleStudents = students.filter((s: any) => s.gender && s.gender.toLowerCase() === 'male').length;
    const femaleStudents = students.filter((s: any) => s.gender && s.gender.toLowerCase() === 'female').length;
    studentGenderData[0].value = maleStudents;
    studentGenderData[1].value = femaleStudents;
  }

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (isError) {
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => setRetryCount(c => c + 1), 1500);
      return (
        <div className="p-6 flex flex-col items-center justify-center">
          <AdminDashboardSkeleton />
          <div className="mt-4 text-sm text-muted-foreground">Retrying to load dashboard... ({retryCount + 1}/{MAX_RETRIES})</div>
        </div>
      );
    }
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <Alert variant="destructive" className="max-w-md w-full">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            There was a problem fetching the required data.<br />
            <Button variant="outline" className="mt-2" onClick={() => setRetryCount(0)}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Graceful fallback for missing data
  const safeStats = stats || {};
  const safeStudents = students || [];
  const safePayments = payments || [];
  const safeExams = exams || [];
  const safeAttendance = attendance || [];
  const safeActivities = recentActivities || [];
  const safeNotices = notices || [];

  return (
    <>
      <TopNav
        title="Admin Dashboard"
        subtitle={
          profileLoading
            ? 'Loading profile…'
            : `Welcome back, ${displayName || user?.name || 'Administrator'}`
        }
      />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 px-4 sm:px-6 lg:px-8">
          <StatsCard title="Total Students" value={stats?.totalStudents || 0} icon={Users} />
          <StatsCard title="Active Teachers" value={stats?.activeTeachers || 0} icon={UserCheck} />
          <StatsCard title="Pending Payments" value={stats?.pendingPayments || 0} icon={CreditCard} />
          <StatsCard title="Avg. Attendance" value={`${(stats?.averageAttendance || 0).toFixed(1)}%`} icon={BarChart3} />
        </div>

        {/* Charts and Widgets */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-4 px-4 sm:px-6 lg:px-8 items-stretch">
          {/* First Row: Attendance and Students (max height for perfect alignment) */}
          <Card className="h-[440px]">
            <CardHeader><CardTitle className="text-base sm:text-lg lg:text-xl">Weekly Attendance</CardTitle></CardHeader>
            <CardContent className="h-[360px]">
              {attendanceLoading ? (
                <p className="text-sm sm:text-base">Loading...</p>
              ) : chartData.length === 0 || chartData.every(d => d.present === 0 && d.absent === 0) ? (
                <EmptyState
                  icon={BarChart3}
                  title="No Attendance Data"
                  description="Attendance records will appear here once students start checking in."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)'}} />
                    <Bar dataKey="present" fill="var(--primary)" name="Present" shape={<RoundedBar />} />
                    <Bar dataKey="absent" fill="var(--secondary)" name="Absent" shape={<RoundedBar />} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Students Widget - Max height for perfect alignment */}
          <StudentsProgressChart data={studentGenderData} height={440} contentHeight={360} />

          {/* Notice Calendar - Full height */}
          <div className="row-span-2"><EventCalendar /></div>

          {/* Second Row: Daily Inspiration spanning 2 columns, reduced height */}
          <div className="lg:col-span-2"><QuickTipsWidget height={220} contentHeight={140} /></div>
        </div>

        {/* Notices and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-2 space-y-6">
            <NoticeBoard notices={(notices || []).map((n: any) => ({
              $id: n.$id,
              activity: n.activity,
              date: n.date,
              category: n.category,
            })) as Notice[]} />
          </div>
          <div className="space-y-6 lg:pr-0"><RecentActivityWidget activities={recentActivities || []} /></div>
        </div>

        {/* Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 px-4 sm:px-6 lg:px-8">
          {/* Subscription Management */}
          <div className="shadow-sm hover:shadow-md transition-shadow">
            <SubscriptionManager />
          </div>

          {/* Account Approvals */}
          <div className="shadow-sm hover:shadow-md transition-shadow">
            <AccountApprovalManager />
          </div>
        </div>
      </div>
    </>
  );
}