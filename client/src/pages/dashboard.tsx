import { useRole } from "@/hooks/useRole";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import TeacherDashboard from "@/components/dashboards/teacher-dashboard";
import StudentParentDashboard from "@/components/dashboards/student-parent-dashboard";
import { TopNav } from "@/components/top-nav";
import ErrorBoundary from "@/components/ui/error-boundary";
import { ExamSuccessModal } from "@/components/exam-success-modal";
import { AdmissionTipsModal } from "@/components/admission-tips-modal";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { role } = useRole();
  const [showExamTips, setShowExamTips] = useState(false);
  const [showAdmissionTips, setShowAdmissionTips] = useState(false);

  // Show exam tips modal automatically on first login (for students)
  useEffect(() => {
    if (role === "student" || role === "parent") {
      const hasSeenTips = localStorage.getItem("hasSeenExamTips");
      if (!hasSeenTips) {
        setTimeout(() => setShowExamTips(true), 1500);
        localStorage.setItem("hasSeenExamTips", "true");
      }
    }
  }, [role]);

  return (
    <ErrorBoundary>
      <>
        <ExamSuccessModal open={showExamTips} onOpenChange={setShowExamTips} />
        <AdmissionTipsModal open={showAdmissionTips} onOpenChange={setShowAdmissionTips} />
        
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