import { useAuth } from "./useAuth";

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
  const { role } = useAuth();

  const hasPermission = (resource: keyof RolePermissions, action: string): boolean => {
    if (!role) return false;
    
    const userRole = role as UserRole;
    const rolePermissions = permissions[userRole];
    
    if (!rolePermissions || !rolePermissions[resource]) {
      return false;
    }
    
    return rolePermissions[resource].includes(action);
  };

  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role as UserRole);
  };

  const getUserRole = (): UserRole | null => {
    return (role as UserRole) || null;
  };

  const isAdmin = (): boolean => role === "admin";
  const isTeacher = (): boolean => role === "teacher";
  const isStudent = (): boolean => role === "student";
  const isParent = (): boolean => role === "parent";

  return {
    role: getUserRole(),
    hasPermission,
    canAccess,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    permissions: role ? permissions[role as UserRole] : null
  };
}