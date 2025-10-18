/**
 * Notification Service
 * Centralized service for triggering notifications across the platform
 * Handles all notification creation with proper validation and error handling
 */

import { Databases, ID, Query } from 'node-appwrite';
import { logInfo, logError } from '../logger';

const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID!;
const NOTIFICATIONS_COLLECTION = 'notifications';

interface NotificationPayload {
  userId: string;
  message: string;
  link?: string;
  type?: 'exam' | 'attendance' | 'payment' | 'grade' | 'announcement' | 'general' | 'account';
  data?: Record<string, any>;
}

interface NotificationSchemaSupport {
  hasType: boolean;
  hasData: boolean;
}

export class NotificationService {
  private schemaSupport: NotificationSchemaSupport | null = null;
  private schemaCheckPromise: Promise<NotificationSchemaSupport> | null = null;

  constructor(private databases: Databases) {}

  private async resolveSchemaSupport(): Promise<NotificationSchemaSupport> {
    if (this.schemaSupport) {
      return this.schemaSupport;
    }

    if (!this.schemaCheckPromise) {
      this.schemaCheckPromise = this.databases
        .getCollection(DB_ID, NOTIFICATIONS_COLLECTION)
        .then((collection: any) => {
          const attributes = Array.isArray(collection?.attributes) ? collection.attributes : [];
          const supports: NotificationSchemaSupport = {
            hasType: attributes.some((attr: any) => {
              const key = String(attr?.key ?? attr?.$id ?? attr?.id ?? '');
              return key === 'type';
            }),
            hasData: attributes.some((attr: any) => {
              const key = String(attr?.key ?? attr?.$id ?? attr?.id ?? '');
              return key === 'data';
            }),
          };
          this.schemaSupport = supports;
          return supports;
        })
        .catch((error) => {
          logError('Failed to inspect notifications schema', error);
          const fallback: NotificationSchemaSupport = { hasType: false, hasData: false };
          this.schemaSupport = fallback;
          return fallback;
        });
    }

    return this.schemaCheckPromise!;
  }

  /**
   * Create a single notification
   */
  async createNotification(payload: NotificationPayload): Promise<string> {
    try {
      const { userId, message, link, type = 'general', data } = payload;

      if (!userId || !message) {
        throw new Error('userId and message are required');
      }

      const schemaSupport = await this.resolveSchemaSupport();

      const searchParts: string[] = [userId, type ?? 'general', message, link ?? ''];
      if (!schemaSupport.hasData && data) {
        searchParts.push(JSON.stringify(data));
      }
      const search = searchParts.filter(Boolean).join(' ');

      const docPayload: Record<string, any> = {
        userId,
        message: schemaSupport.hasType || type === 'general' ? message : `[${type.toUpperCase()}] ${message}`,
        link: link || null,
        isRead: false,
        search,
      };

      if (schemaSupport.hasType) {
        docPayload.type = type;
      }

      if (schemaSupport.hasData && data) {
        docPayload.data = JSON.stringify(data);
      }

      const doc = await this.databases.createDocument(
        DB_ID,
        NOTIFICATIONS_COLLECTION,
        ID.unique(),
        docPayload
      );

      logInfo('Notification created', { userId, type, message: message.substring(0, 50) });
      return doc.$id;
    } catch (error) {
      logError('Failed to create notification', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users (bulk operation)
   */
  async createNotificationsForUsers(
    userIds: string[],
    message: string,
    link?: string,
    type: NotificationPayload['type'] = 'general',
    data?: Record<string, any>
  ): Promise<string[]> {
    try {
      if (!userIds || userIds.length === 0) {
        throw new Error('At least one userId is required');
      }

      const notifications = await Promise.all(
        userIds.map((userId) =>
          this.createNotification({ userId, message, link, type, data }).catch((err) => {
            logError(`Failed to create notification for user ${userId}`, err);
            return null;
          })
        )
      );

      const successfulIds = notifications.filter((id) => id !== null) as string[];
      logInfo('Bulk notifications created', { total: userIds.length, successful: successfulIds.length });
      return successfulIds;
    } catch (error) {
      logError('Failed to create bulk notifications', error);
      throw error;
    }
  }

  /**
   * EXAM NOTIFICATIONS
   */

  /**
   * Notify student when exam starts/is available
   */
  async notifyExamStarted(
    studentIds: string[],
    examTitle: string,
    examId: string,
    duration?: number
  ): Promise<string[]> {
    const message = duration
      ? `Exam "${examTitle}" is now available. You have ${duration} minutes to complete it.`
      : `Exam "${examTitle}" is now available. Start when ready!`;

    return this.createNotificationsForUsers(studentIds, message, `/exams/${examId}/take`, 'exam', {
      examTitle,
      examId,
      duration,
    });
  }

  /**
   * Notify student when exam time is running low
   */
  async notifyExamTimeWarning(studentId: string, examTitle: string, timeLeftMinutes: number): Promise<string> {
    const message = `⏰ Time running out! You have ${timeLeftMinutes} minutes left in "${examTitle}"`;
    return this.createNotification({
      userId: studentId,
      message,
      type: 'exam',
      data: { examTitle, timeLeft: timeLeftMinutes },
    });
  }

  /**
   * Notify student when exam attempt is submitted
   */
  async notifyExamSubmitted(
    studentId: string,
    examTitle: string,
    score: number,
    totalScore: number,
    attemptId?: string
  ): Promise<string> {
    const hasScore = totalScore > 0;
    const percentage = hasScore ? Math.round((score / totalScore) * 100) : undefined;
    const passed = percentage !== undefined ? percentage >= 50 : undefined;

    const message = hasScore
      ? `Your exam "${examTitle}" has been submitted! Score: ${score}/${totalScore} (${percentage}%) ${
          passed ? '✅ Passed!' : '⚠️ Review and try again'
        }`
      : `Your exam "${examTitle}" has been submitted! We'll notify you once grading is complete.`;

    return this.createNotification({
      userId: studentId,
      message,
      link: attemptId ? `/exams/attempts/${attemptId}/results` : '/exams/history',
      type: 'exam',
      data: { examTitle, score, totalScore, percentage, passed },
    });
  }

  /**
   * Notify teacher when exam results are ready for review
   */
  async notifyTeacherExamResultsReady(
    teacherId: string,
    examTitle: string,
    submissionCount: number
  ): Promise<string> {
    const message = `Exam "${examTitle}" has ${submissionCount} student submission(s) ready for review.`;

    return this.createNotification({
      userId: teacherId,
      message,
      link: `/exams`,
      type: 'exam',
      data: { examTitle, submissionCount },
    });
  }

  /**
   * ATTENDANCE NOTIFICATIONS
   */

  /**
   * Notify student of low attendance
   */
  async notifyLowAttendance(
    studentId: string,
    attendancePercentage: number,
    requiredPercentage: number = 80
  ): Promise<string> {
    const message = `⚠️ Your attendance is ${attendancePercentage}%. Minimum required: ${requiredPercentage}%. Please improve your attendance.`;

    return this.createNotification({
      userId: studentId,
      message,
      link: '/attendance',
      type: 'attendance',
      data: { current: attendancePercentage, required: requiredPercentage },
    });
  }

  /**
   * Notify parent of student's low attendance
   */
  async notifyParentLowAttendance(
    parentId: string,
    studentName: string,
    attendancePercentage: number
  ): Promise<string> {
    const message = `${studentName}'s attendance is ${attendancePercentage}%. Please contact the school for more information.`;

    return this.createNotification({
      userId: parentId,
      message,
      link: '/attendance',
      type: 'attendance',
      data: { studentName, percentage: attendancePercentage },
    });
  }

  /**
   * Notify attendance marked for class
   */
  async notifyAttendanceMarked(studentIds: string[], className: string, date: string): Promise<string[]> {
    const message = `Attendance has been marked for ${className} on ${date}. Check your record!`;

    return this.createNotificationsForUsers(
      studentIds,
      message,
      '/attendance',
      'attendance',
      { className, date }
    );
  }

  /**
   * PAYMENT NOTIFICATIONS
   */

  /**
   * Notify student/parent of pending payment
   */
  async notifyPendingPayment(
    userId: string,
    amount: number,
    dueDate: string,
    description: string = 'School Fees'
  ): Promise<string> {
    const message = `💳 Payment due: ₦${amount.toLocaleString()} for ${description}. Due: ${dueDate}`;

    return this.createNotification({
      userId,
      message,
      link: '/payments',
      type: 'payment',
      data: { amount, dueDate, description },
    });
  }

  /**
   * Notify student/parent of overdue payment
   */
  async notifyOverduePayment(
    userId: string,
    amount: number,
    daysOverdue: number,
    description: string = 'School Fees'
  ): Promise<string> {
    const message = `🚨 Overdue payment: ₦${amount.toLocaleString()} for ${description}. ${daysOverdue} days late!`;

    return this.createNotification({
      userId,
      message,
      link: '/payments',
      type: 'payment',
      data: { amount, daysOverdue, description },
    });
  }

  /**
   * Notify user when payment is confirmed
   */
  async notifyPaymentConfirmed(userId: string, amount: number, reference: string): Promise<string> {
    const message = `✅ Payment confirmed! ₦${amount.toLocaleString()} has been received. Ref: ${reference}`;

    return this.createNotification({
      userId,
      message,
      link: '/payments',
      type: 'payment',
      data: { amount, reference },
    });
  }

  /**
   * Bulk notify parents of pending payments
   */
  async notifyParentsPendingPayments(
    parentIds: string[],
    amount: number,
    dueDate: string
  ): Promise<string[]> {
    const message = `💳 Payment reminder: ₦${amount.toLocaleString()} due by ${dueDate}`;

    return this.createNotificationsForUsers(parentIds, message, '/payments', 'payment', {
      amount,
      dueDate,
    });
  }

  /**
   * GRADE NOTIFICATIONS
   */

  /**
   * Notify student when grades are posted
   */
  async notifyGradesPosted(
    studentId: string,
    subject: string,
    score: number,
    totalScore: number,
    grade: string
  ): Promise<string> {
    const percentage = Math.round((score / totalScore) * 100);
    const message = `📊 Grades posted for ${subject}: ${grade} (${percentage}%)`;

    return this.createNotification({
      userId: studentId,
      message,
      link: '/progress',
      type: 'grade',
      data: { subject, score, totalScore, grade, percentage },
    });
  }

  /**
   * Notify parent when student grades are posted
   */
  async notifyParentGradesPosted(
    parentId: string,
    studentName: string,
    subject: string,
    grade: string,
    percentage: number
  ): Promise<string> {
    const message = `${studentName}'s grade for ${subject}: ${grade} (${percentage}%)`;

    return this.createNotification({
      userId: parentId,
      message,
      link: '/progress',
      type: 'grade',
      data: { studentName, subject, grade, percentage },
    });
  }

  /**
   * Notify teacher of low-performing student
   */
  async notifyTeacherLowPerformance(
    teacherId: string,
    studentName: string,
    subject: string,
    percentage: number
  ): Promise<string> {
    const message = `⚠️ ${studentName} scored ${percentage}% in ${subject}. Consider additional support.`;

    return this.createNotification({
      userId: teacherId,
      message,
      link: '/progress',
      type: 'grade',
      data: { studentName, subject, percentage },
    });
  }

  /**
   * ANNOUNCEMENT NOTIFICATIONS
   */

  /**
   * Broadcast announcement to multiple users
   */
  async broadcastAnnouncement(
    userIds: string[],
    title: string,
    content: string,
    link?: string
  ): Promise<string[]> {
    // Truncate message if too long
    const message = `📢 ${title}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;

    return this.createNotificationsForUsers(
      userIds,
      message,
      link || '/notices',
      'announcement',
      { title, content }
    );
  }

  /**
   * Announce to all students in a class
   */
  async announceToClass(
    studentIds: string[],
    className: string,
    message: string,
    link?: string
  ): Promise<string[]> {
    const fullMessage = `📣 ${className}: ${message}`;
    return this.createNotificationsForUsers(studentIds, fullMessage, link || '/notices', 'announcement', {
      className,
    });
  }

  /**
   * Announce to all teachers
   */
  async announceToAllTeachers(message: string, link?: string): Promise<string[]> {
    try {
      // Fetch all teachers
      const teachers = await this.databases.listDocuments(DB_ID, 'teachers', [Query.limit(1000)]);
      const teacherIds = teachers.documents.map((doc) => (doc as any).userId).filter(Boolean);

      return this.createNotificationsForUsers(
        teacherIds,
        `📢 ${message}`,
        link || '/notices',
        'announcement'
      );
    } catch (error) {
      logError('Failed to announce to all teachers', error);
      throw error;
    }
  }

  /**
   * ADMIN NOTIFICATIONS
   */

  /**
   * Notify admin of new user signup
   */
  async notifyAdminNewUser(adminId: string, userName: string, userEmail: string, role: string): Promise<string> {
    const message = `New ${role} registration: ${userName} (${userEmail})`;

    return this.createNotification({
      userId: adminId,
      message,
      link: '/students',
      type: 'general',
      data: { userName, userEmail, role },
    });
  }

  /**
   * Notify admin of system alert
   */
  async notifyAdminAlert(adminId: string, alertTitle: string, alertDetails: string): Promise<string> {
    const message = `🚨 ${alertTitle}: ${alertDetails}`;

    return this.createNotification({
      userId: adminId,
      message,
      type: 'general',
      data: { alertTitle, alertDetails },
    });
  }

  /**
   * Notify admin of payment received
   */
  async notifyAdminPaymentReceived(
    adminId: string,
    studentName: string,
    amount: number,
    reference: string
  ): Promise<string> {
    const message = `✅ Payment received from ${studentName}: ₦${amount.toLocaleString()} (Ref: ${reference})`;

    return this.createNotification({
      userId: adminId,
      message,
      link: '/payments',
      type: 'payment',
      data: { studentName, amount, reference },
    });
  }

  /**
   * ACCOUNT NOTIFICATIONS
   */

  async notifyAccountPendingReview(userId: string, role: string): Promise<string> {
    const message = `Your ${role} account is pending approval. We'll notify you once it's reviewed.`;

    return this.createNotification({
      userId,
      message,
      link: '/login',
      type: 'account',
      data: { status: 'pending', role },
    });
  }

  async notifyAccountApproved(userId: string, role?: string): Promise<string> {
    const message = role
      ? `Your ${role} account has been approved. You can now sign in.`
      : 'Your account has been approved. You can now sign in.';

    return this.createNotification({
      userId,
      message,
      link: '/login',
      type: 'account',
      data: { status: 'approved', role },
    });
  }

  async notifyAccountRejected(userId: string, reason?: string): Promise<string> {
    const message = reason
      ? `Your account application was rejected: ${reason}`
      : 'Your account application was rejected. Please contact support for details.';

    return this.createNotification({
      userId,
      message,
      link: '/support',
      type: 'account',
      data: { status: 'rejected', reason },
    });
  }

  /**
   * SUBSCRIPTION/ACTIVATION NOTIFICATIONS
   */

  /**
   * Notify user of successful subscription
   */
  async notifySubscriptionActivated(userId: string, planName: string, expiryDate: string): Promise<string> {
    const message = `✅ Subscription activated: ${planName}. Expires: ${expiryDate}`;

    return this.createNotification({
      userId,
      message,
      link: '/exams',
      type: 'general',
      data: { planName, expiryDate },
    });
  }

  /**
   * Notify user of subscription expiring soon
   */
  async notifySubscriptionExpiring(userId: string, daysLeft: number, planName: string): Promise<string> {
    const message = `⏰ Your ${planName} subscription expires in ${daysLeft} days!`;

    return this.createNotification({
      userId,
      message,
      link: '/exams',
      type: 'general',
      data: { planName, daysLeft },
    });
  }

  /**
   * Notify user of subscription expired
   */
  async notifySubscriptionExpired(userId: string, planName: string): Promise<string> {
    const message = `Your ${planName} subscription has expired. Renew to continue using premium features.`;

    return this.createNotification({
      userId,
      message,
      link: '/activate',
      type: 'general',
      data: { planName },
    });
  }

  /**
   * Mark notification as read (utility)
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.databases.updateDocument(DB_ID, NOTIFICATIONS_COLLECTION, notificationId, {
        isRead: true,
      });
    } catch (error) {
      logError('Failed to mark notification as read', error);
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldNotifications = await this.databases.listDocuments(
        DB_ID,
        NOTIFICATIONS_COLLECTION,
        [
          Query.lessThan('$createdAt', cutoffDate.toISOString()),
          Query.limit(100), // Delete in batches
        ]
      );

      let deletedCount = 0;
      for (const notification of oldNotifications.documents) {
        try {
          await this.databases.deleteDocument(DB_ID, NOTIFICATIONS_COLLECTION, notification.$id);
          deletedCount++;
        } catch (err) {
          logError(`Failed to delete notification ${notification.$id}`, err);
        }
      }

      logInfo('Deleted old notifications', { count: deletedCount, daysOld });
      return deletedCount;
    } catch (error) {
      logError('Failed to delete old notifications', error);
      return 0;
    }
  }
}

export default NotificationService;
