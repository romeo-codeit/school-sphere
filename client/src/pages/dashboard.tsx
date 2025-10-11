import { useRole } from "@/hooks/useRole";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import TeacherDashboard from "@/components/dashboards/teacher-dashboard";
import StudentParentDashboard from "@/components/dashboards/student-parent-dashboard";
import { TopNav } from "@/components/top-nav";
import ErrorBoundary from "@/components/ui/error-boundary";

export default function Dashboard() {
  const { role } = useRole();

  return (
    <ErrorBoundary>
      <>
        {role !== "admin" && <TopNav title="Dashboard" />}
        <div className="space-y-6 px-2 sm:px-6 lg:px-0">
          {role === "admin" && <AdminDashboard />}
          {role === "teacher" && <TeacherDashboard />}
          {(role === "student" || role === "parent") && <StudentParentDashboard />}
          {!role && <div className="p-6">You do not have a role assigned. Please contact an administrator.</div>}
        </div>
      </>
    </ErrorBoundary>
  );
}