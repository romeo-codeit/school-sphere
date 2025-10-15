import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Menu, X } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/sidebar";
import { RoleGuard } from "@/components/RoleGuard";
import { useState, lazy, Suspense } from "react";
import { ThemeInitializer } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import { SplashScreen } from "@/components/ui/splash-screen";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { useEffect } from "react";
import { configureAuthHeaderProvider, onNetworkChange, processQueueOnce, processAppwriteQueueOnce } from "@/lib/offline";

// Lazy load all the pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const LoginPage = lazy(() => import("@/pages/login"));
const SignUpPage = lazy(() => import("@/pages/signup"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Students = lazy(() => import("@/pages/students"));
const StudentProfile = lazy(() => import("@/pages/student-profile"));
const Teachers = lazy(() => import("@/pages/teachers"));
const TeacherProfile = lazy(() => import("@/pages/teacher-profile"));
const Exams = lazy(() => import("@/pages/exams"));
const ExamTaking = lazy(() => import("@/pages/exam-taking"));
const Payments = lazy(() => import("@/pages/payments"));
const ExamResultsPage = lazy(() => import("@/pages/exam-results"));
const Messages = lazy(() => import("@/pages/messages"));
const Resources = lazy(() => import("@/pages/resources"));
const Settings = lazy(() => import("@/pages/settings"));
const VideoConferencing = lazy(() => import("@/pages/video-conferencing"));
const Communications = lazy(() => import("@/pages/communications"));
const Attendance = lazy(() => import("@/pages/attendance"));
const TakeAttendance = lazy(() => import("@/pages/take-attendance"));
const HistoricalAttendance = lazy(() => import("@/pages/historical-attendance"));
const AttendanceReports = lazy(() => import("@/pages/attendance-reports"));
const Progress = lazy(() => import("@/pages/progress"));
const CreateUserPage = lazy(() => import("@/pages/create-user"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const SubjectsPage = lazy(() => import("@/pages/subjects"));
const NoticesPage = lazy(() => import("@/pages/notices"));
const ActivitiesPage = lazy(() => import("@/pages/activities"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const ActivatePage = lazy(() => import("@/pages/activate"));
const AdminActivationCodesPage = lazy(() => import("@/pages/admin-activation-codes"));

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="border rounded-md p-4">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Configure offline sync auth header provider and auto-process queue on reconnect
  useEffect(() => {
    configureAuthHeaderProvider(async () => {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('appwrite_jwt');
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // ignore
      }
      return headers;
    });
    const off = onNetworkChange((online) => {
      if (online) {
        processQueueOnce();
        processAppwriteQueueOnce();
      }
    });
    return () => off();
  }, []);

  if (isLoading) {
    return null; // Splash screen will show instead
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={null}>
        <Switch>
          <Route path="/"><Landing /></Route>
          <Route path="/login"><LoginPage /></Route>
          <Route path="/signup"><SignUpPage /></Route>
          <Route path="/activate"><ActivatePage /></Route>
          <Route><NotFound /></Route>
        </Switch>
      </Suspense>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <OfflineBanner />
      {/* Desktop Sidebar */}
      <Sidebar
        className="hidden lg:block"
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 lg:hidden">
          <div className="fixed left-0 top-0 h-full w-64 transform transition-transform duration-300">
            <Sidebar isCollapsed={false} setIsCollapsed={() => setSidebarOpen(false)} />
            <button
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted z-10"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-close-mobile-nav"
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto mb-8">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 sticky top-0 bg-background z-10 border-b">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <Suspense fallback={<PageSkeleton />}>
          <Switch>
            <Route path="/"><Dashboard /></Route>
            <Route path="/students"><RoleGuard allowedRoles={['admin', 'teacher']}><Students /></RoleGuard></Route>
            <Route path="/students/:id">{params => (
              <RoleGuard allowedRoles={['admin', 'teacher', 'student', 'parent']}>
                <StudentProfile id={params.id} />
              </RoleGuard>
            )}</Route>
            <Route path="/teachers"><RoleGuard allowedRoles={['admin']}><Teachers /></RoleGuard></Route>
            <Route path="/teachers/:id">{params => (
              <RoleGuard allowedRoles={['admin', 'teacher']}>
                <TeacherProfile id={params.id} />
              </RoleGuard>
            )}</Route>
            <Route path="/exams"><Exams /></Route>
            <Route path="/activate"><ActivatePage /></Route>
            <Route path="/exams/:id/take">
              <RoleGuard allowedRoles={['admin', 'student']}>
                <ExamTaking />
              </RoleGuard>
            </Route>
            <Route path="/exams/practice/:type">
              <RoleGuard allowedRoles={['admin', 'student', 'guest']}>
                <ExamTaking />
              </RoleGuard>
            </Route>
            <Route path="/exams/attempts/:attemptId/results">
              <RoleGuard allowedRoles={['admin', 'student', 'teacher']}>
                <ExamResultsPage />
              </RoleGuard>
            </Route>
            <Route path="/progress"><Progress /></Route>
            <Route path="/payments"><RoleGuard allowedRoles={['admin', 'student', 'parent']}><Payments /></RoleGuard></Route>
            <Route path="/messages"><Messages /></Route>
            <Route path="/resources"><Resources /></Route>
            <Route path="/settings"><Settings /></Route>
            <Route path="/admin/activation-codes"><RoleGuard allowedRoles={['admin']}><AdminActivationCodesPage /></RoleGuard></Route>
            <Route path="/video-conferencing"><VideoConferencing /></Route>
            <Route path="/communications"><Communications /></Route>
            <Route path="/attendance"><Attendance /></Route>
            <Route path="/notices"><NoticesPage /></Route>
            <Route path="/activities"><ActivitiesPage /></Route>
            <Route path="/notifications"><NotificationsPage /></Route>
            <Route path="/take-attendance">
              <RoleGuard allowedRoles={['admin', 'teacher']}><TakeAttendance /></RoleGuard>
            </Route>
            <Route path="/historical-attendance">
              <RoleGuard allowedRoles={['admin', 'teacher']}><HistoricalAttendance /></RoleGuard>
            </Route>
            <Route path="/create-user">
              <RoleGuard allowedRoles={['admin']}><CreateUserPage /></RoleGuard>
            </Route>
            <Route path="/attendance-reports">
              <RoleGuard allowedRoles={['admin']}><AttendanceReports /></RoleGuard>
            </Route>
            <Route path="/subjects">
              <RoleGuard allowedRoles={['admin']}><SubjectsPage /></RoleGuard>
            </Route>
            <Route path="/profile"><ProfilePage /></Route>
            <Route><NotFound /></Route>
          </Switch>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <ThemeInitializer />
      <SplashScreen />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;