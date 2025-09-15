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

  return (
    <div className="space-y-6">
      <TopNav 
        title={`${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Dashboard'}`} 
        subtitle={`Welcome back, ${user?.name || 'User'}`}
      />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Students"
            value={statsLoading ? "Loading..." : stats?.totalStudents || 0}
            icon={Users}
            iconColor="bg-primary/10 text-primary"
            trend={{
              value: "+12% from last month",
              isPositive: true,
              icon: TrendingUp
            }}
          />
          
          <StatsCard
            title="Active Teachers"
            value={statsLoading ? "Loading..." : stats?.activeTeachers || 0}
            icon={UserCheck}
            iconColor="bg-secondary/10 text-secondary"
            trend={{
              value: "+3 new this month",
              isPositive: true,
              icon: TrendingUp
            }}
          />
          
          <StatsCard
            title="Pending Payments"
            value={statsLoading ? "Loading..." : stats?.pendingPayments || "₦0"}
            icon={CreditCard}
            iconColor="bg-accent/10 text-accent"
            subtitle={`${totalOverduePayments} overdue`}
          />
          
          <StatsCard
            title="Average Attendance"
            value={statsLoading ? "Loading..." : stats?.averageAttendance || "0%"}
            icon={BarChart3}
            iconColor="bg-destructive/10 text-destructive"
            trend={{
              value: "+2.1% this week",
              isPositive: true,
              icon: TrendingUp
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Students */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Students</CardTitle>
                  <Button variant="outline" size="sm" data-testid="button-view-all-students" onClick={() => setLocation('/students')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="text-center py-8">Loading students...</div>
                ) : recentStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No students found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-6 py-3 text-muted-foreground font-medium">Student</th>
                          <th className="text-left px-6 py-3 text-muted-foreground font-medium">Class</th>
                          <th className="text-left px-6 py-3 text-muted-foreground font-medium">Status</th>
                          <th className="text-left px-6 py-3 text-muted-foreground font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentStudents.map((student: any) => (
                          <tr key={student.$id} className="hover:bg-muted/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-primary font-medium">
                                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground" data-testid={`text-student-name-${student.$id}`}>
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground" data-testid={`text-student-id-${student.$id}`}>
                                    ID: {student.studentId}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-foreground" data-testid={`text-student-class-${student.$id}`}>
                              {student.class}
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant={student.status === 'active' ? 'secondary-soft' : 'destructive-soft'}
                              >
                                {student.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="ghost" size="sm" data-testid={`button-view-student-${student.$id}`} onClick={() => setLocation(`/students/${student.$id}`)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-primary hover:bg-primary/90"
                  onClick={() => setIsStudentFormOpen(true)}
                  data-testid="button-add-student"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New Student
                </Button>
                
                <Button 
                  className="w-full justify-start bg-secondary hover:bg-secondary/90"
                  onClick={() => setIsUploadExamFormOpen(true)}
                  data-testid="button-upload-exam"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Exam Questions
                </Button>
                
                <Button 
                  className="w-full justify-start bg-accent hover:bg-accent/90"
                  onClick={() => setIsSendAnnouncementFormOpen(true)}
                  data-testid="button-send-announcement"
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  Send Announcement
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  data-testid="button-generate-report"
                  onClick={() => setLocation('/progress')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/create-user')}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create New User
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activitiesLoading ? (
                  <div className="text-center py-8">Loading activities...</div>
                ) : (
                  Array.isArray(recentActivities) && recentActivities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground" data-testid={`text-activity-${index}`}>
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-activity-time-${index}`}>
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Attendance Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Overview</CardTitle>
                <select className="border border-border rounded-lg px-3 py-2 text-sm" onChange={handleAttendanceFilterChange} value={attendanceFilter}>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="term">This Term</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <div className="text-center py-8">Loading attendance data...</div>                ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#8884d8" name="Present" />
                    <Bar dataKey="absent" fill="#82ca9d" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
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
        </div>

        {/* Exam Module Preview */}
        <Card className="mt-8">
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