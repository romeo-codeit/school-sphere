import type { RequestHandler } from "express";
import { storage } from "./storage";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    claims: any;
  };
}

// Role-based authorization middleware
export const requireRole = (allowedRoles: UserRole[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role as UserRole)) {
        return res.status(403).json({ 
          message: "Access denied", 
          required: allowedRoles,
          current: user.role 
        });
      }

      // Attach user info to request
      req.user.id = user.id;
      req.user.role = user.role;
      
      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      res.status(500).json({ message: "Authorization error" });
    }
  };
};

// Resource ownership check for students/parents
export const requireOwnership = (resourceField: string = "studentId"): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Admins and teachers can access all resources
      if (user.role === "admin" || user.role === "teacher") {
        return next();
      }

      // Students can only access their own data
      if (user.role === "student") {
        const students = await storage.getStudents();
        const studentRecord = students.find(s => s.userId === user.id);
        
        if (!studentRecord) {
          return res.status(403).json({ message: "Student record not found" });
        }

        const resourceId = req.params.id || req.body[resourceField];
        if (resourceId && resourceId !== studentRecord.id) {
          return res.status(403).json({ message: "Access denied - not your resource" });
        }
      }

      // Parents can only access their child's data
      if (user.role === "parent") {
        // For now, we'll implement a simple check - in a real system, 
        // you'd have a parent-child relationship table
        const students = await storage.getStudents();
        const childRecord = students.find(s => s.parentEmail === user.email);
        
        if (!childRecord) {
          return res.status(403).json({ message: "Child record not found" });
        }

        const resourceId = req.params.id || req.body[resourceField];
        if (resourceId && resourceId !== childRecord.id) {
          return res.status(403).json({ message: "Access denied - not your child's resource" });
        }
      }

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      res.status(500).json({ message: "Authorization error" });
    }
  };
};

// Permission definitions for different roles
export const permissions = {
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
    students: ["read", "update"], // Can view and update their assigned students
    teachers: ["read"], // Can view other teachers
    exams: ["create", "read", "update"], // Can create and manage exams
    payments: ["read"], // Can view payment status
    messages: ["create", "read", "update"],
    resources: ["create", "read", "update"],
    settings: ["read"], // Limited settings access
    attendance: ["create", "read", "update"],
    grades: ["create", "read", "update"]
  },
  student: {
    students: ["read"], // Can only view their own profile
    teachers: ["read"], // Can view teacher info
    exams: ["read"], // Can take exams and view results
    payments: ["read"], // Can view their payment status
    messages: ["create", "read"],
    resources: ["read"],
    settings: ["read"], // Can view limited settings
    attendance: ["read"], // Can view their attendance
    grades: ["read"] // Can view their grades
  },
  parent: {
    students: ["read"], // Can view their child's profile
    teachers: ["read"], // Can view teacher info
    exams: ["read"], // Can view child's exam results
    payments: ["read"], // Can view child's payment status
    messages: ["create", "read"],
    resources: ["read"],
    settings: ["read"], // Limited settings access
    attendance: ["read"], // Can view child's attendance
    grades: ["read"] // Can view child's grades
  }
};

export const hasPermission = (userRole: UserRole, resource: string, action: string): boolean => {
  const rolePermissions = permissions[userRole];
  if (!rolePermissions || !rolePermissions[resource]) {
    return false;
  }
  return rolePermissions[resource].includes(action);
};