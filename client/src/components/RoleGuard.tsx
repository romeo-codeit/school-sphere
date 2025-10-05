import { useRole, type UserRole } from "@/hooks/useRole";
import { ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  resource?: string;
  action?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ 
  allowedRoles, 
  resource, 
  action, 
  children, 
  fallback = null 
}: RoleGuardProps) {
  const { canAccess, hasPermission, role } = useRole();

  // Check role-based access strictly
  if (allowedRoles && !canAccess(allowedRoles)) {
    return <div style={{color: 'red', padding: 24, fontWeight: 'bold'}}>Access denied. Your role: {role ?? 'unknown'}. Allowed: {allowedRoles?.join(', ')}.</div>;
  }

  // Check permission-based access
  if (resource && action && !hasPermission(resource as any, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function TeacherOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["teacher"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function StudentOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["student"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ParentOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["parent"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdminOrTeacher({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["admin", "teacher"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}