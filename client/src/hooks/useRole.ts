import { useAuth } from "./useAuth";
import type { User } from "@shared/schema";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface RolePermissions {
  students: string[];
  teachers: string[];
  exams: string[];
  payments: string[];
  messages: string[];
  resources: string[];
  settings: string[];
  attendance: string[];
  grades: string[];
}

const permissions: Record<UserRole, RolePermissions> = {
  admin: {
    students: ["create", "read", "update", "delete"],
    teachers: ["create", "read", "update", "delete"],
    exams: ["create", "read", "update", "delete"],
    payments: ["create", "read", "update", "delete"],
    messages: ["create", "read", "update", "delete"],
    resources: ["create", "read", "update", "delete"],
    settings: ["create", "read", "update", "delete"],
    attendance: ["create", "read", "update", "delete"],
    grades: ["create", "read", "update", "delete"]
  },
  teacher: {
    students: ["read", "update"],
    teachers: ["read"],
    exams: ["create", "read", "update"],
    payments: ["read"],
    messages: ["create", "read", "update"],
    resources: ["create", "read", "update"],
    settings: ["read"],
    attendance: ["create", "read", "update"],
    grades: ["create", "read", "update"]
  },
  student: {
    students: ["read"],
    teachers: ["read"],
    exams: ["read"],
    payments: ["read"],
    messages: ["create", "read"],
    resources: ["read"],
    settings: ["read"],
    attendance: ["read"],
    grades: ["read"]
  },
  parent: {
    students: ["read"],
    teachers: ["read"],
    exams: ["read"],
    payments: ["read"],
    messages: ["create", "read"],
    resources: ["read"],
    settings: ["read"],
    attendance: ["read"],
    grades: ["read"]
  }
};

export function useRole() {
  const { user } = useAuth() as { user: User | undefined; isLoading: boolean; isAuthenticated: boolean };

  const hasPermission = (resource: keyof RolePermissions, action: string): boolean => {
    if (!user?.role) return false;
    
    const userRole = user.role as UserRole;
    const rolePermissions = permissions[userRole];
    
    if (!rolePermissions || !rolePermissions[resource]) {
      return false;
    }
    
    return rolePermissions[resource].includes(action);
  };

  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return allowedRoles.includes(user.role as UserRole);
  };

  const getUserRole = (): UserRole | null => {
    return (user?.role as UserRole) || null;
  };

  const isAdmin = (): boolean => user?.role === "admin";
  const isTeacher = (): boolean => user?.role === "teacher";
  const isStudent = (): boolean => user?.role === "student";
  const isParent = (): boolean => user?.role === "parent";

  return {
    role: getUserRole(),
    hasPermission,
    canAccess,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    permissions: user?.role ? permissions[user.role as UserRole] : null
  };
}