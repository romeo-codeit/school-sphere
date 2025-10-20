import { z } from 'zod';

// User registration schema
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'guest']).default('student')
});

// User creation schema (admin only)
export const userCreationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'teacher', 'student', 'parent'])
});

// School settings schema
export const schoolSettingsSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  website: z.string().url('Invalid website URL').optional(),
  logo: z.string().optional()
});

// Activation code generation schema
export const activationCodeSchema = z.object({
  count: z.number().int().min(1).max(100).default(10),
  prefix: z.string().min(1).max(10).default('OHM'),
  length: z.number().int().min(5).max(20).default(10),
  codeType: z.string().default('trial_30d')
});

// Exam assignment schema
export const examAssignmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

// Exam attempt start schema
export const examAttemptStartSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjects: z.array(z.string()).optional(),
  year: z.string().optional(),
  paperType: z.string().optional(),
});

// Exam attempt submit schema
export const examAttemptSubmitSchema = z.object({
  answers: z.record(z.any()).or(z.string())
});

// Exam attempt autosave schema
export const examAttemptAutosaveSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  answers: z.record(z.any()).optional(),
  timeSpent: z.number().int().min(0).optional()
});

// Subject validation schema
export const subjectValidationSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  selectedSubjects: z.array(z.string()).min(1, 'At least one subject is required'),
  year: z.string().optional()
});

// Subscription activation schema
export const subscriptionActivationSchema = z.object({
  code: z.string().min(1, 'Activation code is required')
});

// Query parameter schemas
export const examQuerySchema = z.object({
  limit: z.string().optional(),
  type: z.string().optional(),
  subject: z.string().optional(),
  year: z.string().optional()
});

export const subjectQuerySchema = z.object({
  type: z.string().min(1, 'Type is required'),
  paperType: z.string().optional(),
});

export const yearQuerySchema = z.object({
  type: z.string().min(1, 'Type is required'),
  subject: z.union([z.string(), z.array(z.string())]).optional(),
  subjects: z.string().optional(),
  paperType: z.string().optional(),
});

export const attemptQuerySchema = z.object({
  studentId: z.string().optional()
});