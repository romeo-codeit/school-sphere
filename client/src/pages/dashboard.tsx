import { useRole } from "@/hooks/useRole";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import TeacherDashboard from "@/components/dashboards/teacher-dashboard";
import StudentParentDashboard from "@/components/dashboards/student-parent-dashboard";

export default function Dashboard() {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
    case "parent":
      return <StudentParentDashboard />;
    default:
      return <div className="p-6">You do not have a role assigned. Please contact an administrator.</div>;
  }
}