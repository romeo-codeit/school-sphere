import { TopNav } from "@/components/top-nav";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  CreditCard, 
  BarChart3, 
  UserPlus, 
  Upload, 
  Megaphone, 
  FileText,
  TrendingUp,
  TriangleAlert,
  Eye,
  Play,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useDashboard } from "@/hooks/useDashboard";
import { useStudents } from "@/hooks/useStudents";
import { useResources } from "@/hooks/useResources";
import { usePayments } from "@/hooks/usePayments";
import { useExams } from "@/hooks/useExams";
import { useAttendance } from "@/hooks/useAttendance";
import { useActivities } from "@/hooks/useActivities";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentForm } from "@/components/student-form";
import { UploadExamForm } from "@/components/upload-exam-form";
import { SendAnnouncementForm } from "@/components/send-announcement-form";
import { StudentsProgressChart } from "@/components/students-progress-chart";
import { NoticeBoard } from "@/components/notice-board";
import { RecentActivityWidget } from "@/components/recent-activity-widget";
import { EventCalendar } from "@/components/event-calendar";

const RoundedBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  const radius = 6;

  const getPath = (x: number, y: number, width: number, height: number) => {
    if (height === 0) {
      return '';
    }
    return `M${x},${y + height}
            L${x},${y + radius}
            C${x},${y} ${x},${y} ${x + radius},${y}
            L${x + width - radius},${y}
            C${x + width},${y} ${x + width},${y} ${x + width},${y + radius}
            L${x + width},${y + height}
            Z`;
  };

  return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
};


export default function Dashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const { stats, isLoading: statsLoading } = useDashboard();
  const { students, isLoading: studentsLoading } = useStudents();
  const { resources } = useResources();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { exams, isLoading: examsLoading } = useExams();
  const { attendance, isLoading: attendanceLoading } = useAttendance();

  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isUploadExamFormOpen, setIsUploadExamFormOpen] = useState(false);
  const [isSendAnnouncementFormOpen, setIsSendAnnouncementFormOpen] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('week');

  const [location, setLocation] = useLocation();

  const recentStudents = students?.slice(0, 3) || [];
  const featuredResources = resources?.slice(0, 4) || [];

  const [chartData, setChartData] = useState<any[]>([]);

  const handleAttendanceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAttendanceFilter(e.target.value);
    // TODO: Implement data fetching based on filter
    console.log("Selected attendance filter:", e.target.value);
  };

  const handleDownloadResource = (resourceId: string) => {
    // TODO: Implement actual download logic
    console.log(`Downloading resource ${resourceId}`);
    // downloadResource(resourceId);
  };

  

  useEffect(() => {
    if (attendance) {
      const dailyAttendance: { [key: string]: { present: number; absent: number } } = {};

      attendance.forEach((record: any) => {
        const date = new Date(record.date); // Assuming 'date' field exists in attendance record
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });

        if (!dailyAttendance[dayOfWeek]) {
          dailyAttendance[dayOfWeek] = { present: 0, absent: 0 };
        }

        if (record.status === 'present') { // Assuming 'status' field exists with 'present' or 'absent'
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
  }, [attendance, attendanceFilter]);

  const totalPaidStudents = payments?.filter((p: any) => p.status === 'paid').length || 0;
  const totalPendingPayments = payments?.filter((p: any) => p.status === 'pending').length || 0;
  const totalOverduePayments = payments?.filter((p: any) => p.status === 'overdue').length || 0;

  const jambQuestions = exams?.filter((e: any) => e.type === 'JAMB').length || 0;
  const waecQuestions = exams?.filter((e: any) => e.type === 'WAEC').length || 0;
  const necoQuestions = exams?.filter((e: any) => e.type === 'NECO').length || 0;

  const { activities: recentActivities, isLoading: activitiesLoading } = useActivities();

  const studentGenderData = [
    { name: 'Male', value: 0, fill: 'var(--primary)' },
    { name: 'Female', value: 0, fill: 'var(--secondary)' }
  ];

  if (students && students.length > 0) {
    const maleStudents = students.filter((s: any) => s.gender && s.gender.toLowerCase() === 'male').length;
    const femaleStudents = students.filter((s: any) => s.gender && s.gender.toLowerCase() === 'female').length;
    const totalStudents = students.length;

    studentGenderData[0].value = (maleStudents / totalStudents) * 100;
    studentGenderData[1].value = (femaleStudents / totalStudents) * 100;
  }

  return (
    <div className="space-y-6">
      <TopNav 
        title={`${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Dashboard'}`} 
        subtitle={`Welcome back, ${user?.name || 'User'}`}
      />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-4 md:p-6">
          <StatsCard
            title="Total Students"
            value={statsLoading ? "Loading..." : stats?.totalStudents || 0}
            icon={Users}
            iconColor="bg-primary/10 text-primary"
          />
          
          <StatsCard
            title="Active Teachers"
            value={statsLoading ? "Loading..." : stats?.activeTeachers || 0}
            icon={UserCheck}
            iconColor="bg-secondary/10 text-secondary"
          />
          
          <StatsCard
            title="Pending Payments"
            value={statsLoading ? "Loading..." : stats?.pendingPayments || "₦0"}
            icon={CreditCard}
            iconColor="bg-accent/10 text-accent"
          />
          
          <StatsCard
            title="Average Attendance"
            value={statsLoading ? "Loading..." : stats?.averageAttendance || "0%"}
            icon={BarChart3}
            iconColor="bg-destructive/10 text-destructive"
          />
        </div>

        {/* Students, Weekly Attendance, Event Calendar Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
          <Card>
            <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="text-center py-8">Loading chart data...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{fill: 'transparent'}}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Bar dataKey="present" fill="var(--primary)" name="Present" shape={<RoundedBar />} />
                    <Bar dataKey="absent" fill="var(--secondary)" name="Absent" shape={<RoundedBar />} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <StudentsProgressChart data={studentGenderData} />
          <EventCalendar />
        </div>

        {/* Main Content Grid (remaining widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
          <div className="lg:col-span-2 space-y-6">
            <NoticeBoard notices={recentActivities || []} />
          </div>

          {/* Right Sidebar Content (remaining widgets) */}
          <div className="space-y-6 lg:pr-0">
            <RecentActivityWidget activities={recentActivities || []} />
          </div>
        </div>

        {/* Additional Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 p-4 md:p-6">
          {/* Payment Status */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <span className="font-medium text-foreground">Paid Students</span>
                </div>
                <span className="font-bold text-foreground" data-testid="text-paid-students">{totalPaidStudents}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="font-medium text-foreground">Pending Payments</span>
                </div>
                <span className="font-bold text-foreground" data-testid="text-pending-payments">{totalPendingPayments}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-destructive rounded-full"></div>
                  <span className="font-medium text-foreground">Overdue</span>
                </div>
                <span className="font-bold text-foreground" data-testid="text-overdue-payments">{totalOverduePayments}</span>
              </div>
              
              <div className="pt-4 border-t border-border">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  data-testid="button-view-payment-details"
                  onClick={() => setLocation('/payments')}
                >
                  View Payment Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exam Module Preview */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Exam Module</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-manage-exams"
                  onClick={() => setLocation('/exams')}
                >
                  Manage Exams
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border border-border rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-primary text-2xl" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">JAMB Questions</h4>
                  <p className="text-muted-foreground text-sm mb-4">Practice questions for JAMB preparation</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-jamb-count">{jambQuestions}</p>
                  <p className="text-sm text-muted-foreground">Available Questions</p>
                </div>

                <div className="text-center p-6 border border-border rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-secondary text-2xl" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">WAEC Questions</h4>
                  <p className="text-muted-foreground text-sm mb-4">West African Examination Council prep</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-waec-count">{waecQuestions}</p>
                  <p className="text-sm text-muted-foreground">Available Questions</p>
                </div>

                <div className="text-center p-6 border border-border rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-accent text-2xl" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">NECO Questions</h4>
                  <p className="text-muted-foreground text-sm mb-4">National Examination Council questions</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-neco-count">{necoQuestions}</p>
                  <p className="text-sm text-muted-foreground">Available Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Library Preview */}
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resource Library</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-browse-resources"
                  onClick={() => setLocation('/resources')}
                >
                  Browse All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredResources.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No resources available
                  </div>
                ) : (
                  featuredResources.map((resource: any) => (
                    <div key={resource.$id} className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-32 bg-muted flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-foreground mb-1" data-testid={`text-resource-title-${resource.$id}`}>
                          {resource.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-resource-type-${resource.$id}`}>
                          {resource.type?.toUpperCase()} {resource.type}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground" data-testid={`text-resource-downloads-${resource.$id}`}>
                            {resource.downloads} downloads
                          </span>
                          <Button variant="ghost" size="sm" data-testid={`button-download-resource-${resource.$id}`} onClick={() => handleDownloadResource(resource.$id)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentForm
        open={isStudentFormOpen}
        onOpenChange={setIsStudentFormOpen}
      />

      <UploadExamForm
        open={isUploadExamFormOpen}
        onOpenChange={setIsUploadExamFormOpen}
      />

      <SendAnnouncementForm
        open={isSendAnnouncementFormOpen}
        onOpenChange={setIsSendAnnouncementFormOpen}
      />
    </div>
  );
}