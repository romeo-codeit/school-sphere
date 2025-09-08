import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "teacher", "student", "parent"] }).notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  studentId: varchar("student_id").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  parentName: varchar("parent_name"),
  parentPhone: varchar("parent_phone"),
  parentEmail: varchar("parent_email"),
  class: varchar("class").notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: varchar("status", { enum: ["active", "inactive", "suspended"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teachers table
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeId: varchar("employee_id").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  subjects: text("subjects").array(),
  qualification: varchar("qualification"),
  experience: integer("experience"),
  status: varchar("status", { enum: ["active", "inactive"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exams table
export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  type: varchar("type", { enum: ["jamb", "waec", "neco", "internal"] }).notNull(),
  subject: varchar("subject").notNull(),
  questions: jsonb("questions").notNull(),
  duration: integer("duration"), // in minutes
  totalMarks: integer("total_marks"),
  passingMarks: integer("passing_marks"),
  createdBy: varchar("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam attempts table
export const examAttempts = pgTable("exam_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").references(() => exams.id),
  studentId: varchar("student_id").references(() => students.id),
  answers: jsonb("answers"),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  timeSpent: integer("time_spent"), // in minutes
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  purpose: varchar("purpose").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: varchar("status", { enum: ["pending", "paid", "overdue", "cancelled"] }).default("pending"),
  paymentMethod: varchar("payment_method"),
  transactionId: varchar("transaction_id"),
  term: varchar("term"),
  academicYear: varchar("academic_year"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  date: timestamp("date").notNull(),
  status: varchar("status", { enum: ["present", "absent", "late", "excused"] }).notNull(),
  remarks: text("remarks"),
  markedBy: varchar("marked_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id),
  recipientId: varchar("recipient_id").references(() => users.id),
  subject: varchar("subject"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  messageType: varchar("message_type", { enum: ["personal", "announcement", "notification"] }).default("personal"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resources table
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type", { enum: ["pdf", "video", "audio", "link", "image"] }).notNull(),
  subject: varchar("subject"),
  class: varchar("class"),
  fileUrl: varchar("file_url"),
  fileSize: integer("file_size"),
  downloads: integer("downloads").default(0),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grades table
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  subject: varchar("subject").notNull(),
  examType: varchar("exam_type"),
  score: decimal("score", { precision: 5, scale: 2 }),
  totalMarks: decimal("total_marks", { precision: 5, scale: 2 }),
  grade: varchar("grade"),
  term: varchar("term"),
  academicYear: varchar("academic_year"),
  teacherId: varchar("teacher_id").references(() => teachers.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  teachers: many(teachers),
  messagesSent: many(messages, { relationName: "sender" }),
  messagesReceived: many(messages, { relationName: "recipient" }),
  resources: many(resources),
  exams: many(exams),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  payments: many(payments),
  attendance: many(attendance),
  examAttempts: many(examAttempts),
  grades: many(grades),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  grades: many(grades),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  creator: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  attempts: many(examAttempts),
}));

export const examAttemptsRelations = relations(examAttempts, ({ one }) => ({
  exam: one(exams, {
    fields: [examAttempts.examId],
    references: [exams.id],
  }),
  student: one(students, {
    fields: [examAttempts.studentId],
    references: [students.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  markedBy: one(users, {
    fields: [attendance.markedBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  uploader: one(users, {
    fields: [resources.uploadedBy],
    references: [users.id],
  }),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
  teacher: one(teachers, {
    fields: [grades.teacherId],
    references: [teachers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type ExamAttempt = typeof examAttempts.$inferSelect;
