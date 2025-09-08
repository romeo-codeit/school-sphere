import {
  users,
  students,
  teachers,
  exams,
  payments,
  attendance,
  messages,
  resources,
  grades,
  examAttempts,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Teacher,
  type InsertTeacher,
  type Exam,
  type InsertExam,
  type Payment,
  type InsertPayment,
  type Resource,
  type InsertResource,
  type Message,
  type InsertMessage,
  type Grade,
  type InsertGrade,
  type Attendance,
  type ExamAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;

  // Teacher operations
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher>;

  // Exam operations
  getExams(): Promise<Exam[]>;
  getExam(id: string): Promise<Exam | undefined>;
  getExamsByType(type: string): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: string, exam: Partial<InsertExam>): Promise<Exam>;
  deleteExam(id: string): Promise<void>;

  // Exam attempt operations
  getExamAttempts(studentId: string): Promise<ExamAttempt[]>;
  createExamAttempt(attempt: any): Promise<ExamAttempt>;

  // Payment operations
  getPayments(): Promise<Payment[]>;
  getPaymentsByStudent(studentId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;

  // Attendance operations
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  markAttendance(attendance: any): Promise<Attendance>;

  // Message operations
  getMessages(userId: string): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;

  // Resource operations
  getResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: string): Promise<void>;

  // Grade operations
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalStudents: number;
    activeTeachers: number;
    pendingPayments: string;
    averageAttendance: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Teacher operations
  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(desc(teachers.createdAt));
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(teachers).values(teacher).returning();
    return newTeacher;
  }

  async updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher> {
    const [updatedTeacher] = await db
      .update(teachers)
      .set({ ...teacher, updatedAt: new Date() })
      .where(eq(teachers.id, id))
      .returning();
    return updatedTeacher;
  }

  // Exam operations
  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams).orderBy(desc(exams.createdAt));
  }

  async getExam(id: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsByType(type: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.type, type));
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  }

  async updateExam(id: string, exam: Partial<InsertExam>): Promise<Exam> {
    const [updatedExam] = await db
      .update(exams)
      .set({ ...exam, updatedAt: new Date() })
      .where(eq(exams.id, id))
      .returning();
    return updatedExam;
  }

  async deleteExam(id: string): Promise<void> {
    await db.delete(exams).where(eq(exams.id, id));
  }

  // Exam attempt operations
  async getExamAttempts(studentId: string): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.studentId, studentId));
  }

  async createExamAttempt(attempt: any): Promise<ExamAttempt> {
    const [newAttempt] = await db.insert(examAttempts).values(attempt).returning();
    return newAttempt;
  }

  // Payment operations
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByStudent(studentId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.studentId, studentId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Attendance operations
  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async markAttendance(attendanceData: any): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  // Message operations
  async getMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  // Resource operations
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async getResource(id: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource> {
    const [updatedResource] = await db
      .update(resources)
      .set({ ...resource, updatedAt: new Date() })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteResource(id: string): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  // Grade operations
  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.studentId, studentId));
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(grades).values(grade).returning();
    return newGrade;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalStudents: number;
    activeTeachers: number;
    pendingPayments: string;
    averageAttendance: string;
  }> {
    const [studentCount] = await db.select({ count: count() }).from(students);
    const [teacherCount] = await db.select({ count: count() }).from(teachers).where(eq(teachers.status, 'active'));
    
    const [pendingPaymentSum] = await db
      .select({ sum: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.status, 'pending'));

    // Calculate average attendance for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [attendanceStats] = await db
      .select({
        total: count(),
        present: sql<number>`SUM(CASE WHEN ${attendance.status} = 'present' THEN 1 ELSE 0 END)`,
      })
      .from(attendance)
      .where(gte(attendance.date, thirtyDaysAgo));

    const averageAttendance = attendanceStats?.total > 0 
      ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)
      : "0.0";

    return {
      totalStudents: studentCount.count,
      activeTeachers: teacherCount.count,
      pendingPayments: `₦${parseFloat(pendingPaymentSum.sum || "0").toLocaleString()}`,
      averageAttendance: `${averageAttendance}%`,
    };
  }
}

export const storage = new DatabaseStorage();
