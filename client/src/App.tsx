import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Menu, X } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/sidebar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignUpPage from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import StudentProfile from "@/pages/student-profile";
import Teachers from "@/pages/teachers";
import TeacherProfile from "@/pages/teacher-profile";
import Exams from "@/pages/exams";
import ExamTaking from "@/pages/exam-taking";
import Payments from "@/pages/payments";
import Messages from "@/pages/messages";
import Resources from "@/pages/resources";
import Settings from "@/pages/settings";
import VideoConferencing from "@/pages/video-conferencing";
import Communications from "@/pages/communications";
import Attendance from "@/pages/attendance";
import Progress from "@/pages/progress";
import CreateUserPage from "@/pages/create-user";
import { RoleGuard } from "@/components/RoleGuard";
import { useState } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="h-screen flex bg-background">
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
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 sticky top-0 bg-background z-10 border-b">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/students" component={Students} />
          <Route path="/students/:id" component={StudentProfile} />
          <Route path="/teachers" component={Teachers} />
          <Route path="/teachers/:id" component={TeacherProfile} />
          <Route path="/exams" component={Exams} />
          <Route path="/exams/:id/take" component={ExamTaking} />
          <Route path="/progress" component={Progress} />
          <Route path="/payments" component={Payments} />
          <Route path="/messages" component={Messages} />
          <Route path="/resources" component={Resources} />
          <Route path="/settings" component={Settings} />
          <Route path="/video-conferencing" component={VideoConferencing} />
          <Route path="/communications" component={Communications} />
          <Route path="/attendance" component={Attendance} />
          <RoleGuard allowedRoles={["admin"]}>
            <Route path="/create-user" component={CreateUserPage} />
          </RoleGuard>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;