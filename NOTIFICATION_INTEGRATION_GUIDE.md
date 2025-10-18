/**
 * Notification Integration Guide
 * Shows where and how to trigger notifications throughout the application
 */

// ============================================================================
// 1. EXAM NOTIFICATIONS
// ============================================================================

// In server/routes/cbt.ts - When exam attempt is submitted
/*
app.post('/api/cbt/attempts/:attemptId/submit', auth, async (req: Request, res: Response) => {
  try {
    const user = await req.appwrite!.account.get();
    const { attemptId } = req.params;
    const { answers } = req.body;
    
    // ... existing submit logic ...
    
    // After successful submission:
    const notificationService = new NotificationService(databases);
    
    await notificationService.notifyExamSubmitted(
      user.$id,
      exam.title,
      score,
      totalScore
    );
    
    // Notify teacher that results are ready
    if (exam.createdBy) {
      await notificationService.notifyTeacherExamResultsReady(
        exam.createdBy,
        exam.title,
        1 // incrementally
      );
    }
    
    res.json(updated);
  } catch (error) {
    // ...
  }
});
*/

// In client/src/pages/exam-taking.tsx - When time is running low
/*
useEffect(() => {
  if (timeLeft && timeLeft <= 5 * 60 && !warningShown) { // 5 minutes
    setWarningShown(true);
    
    // Show toast locally
    toast({
      title: "Time Running Out",
      description: `You have ${timeLeft / 60} minutes remaining!`,
      variant: "destructive"
    });
    
    // Optionally call API to trigger notification
    fetch('/api/notifications/exam-warning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examTitle: exam?.title, timeLeft })
    });
  }
}, [timeLeft]);
*/

// ============================================================================
// 2. ATTENDANCE NOTIFICATIONS
// ============================================================================

// In server/routes/ - When attendance marked
/*
// Create route: POST /api/attendance/mark
app.post('/api/attendance/mark', auth, async (req: Request, res: Response) => {
  try {
    const { classId, studentAttendance, date } = req.body;
    
    // Mark attendance for each student
    const studentIds = Object.keys(studentAttendance);
    
    for (const [studentId, status] of Object.entries(studentAttendance)) {
      await databases.createDocument(
        DB_ID,
        'attendanceRecords',
        ID.unique(),
        { studentId, classId, date, status }
      );
    }
    
    // Notify students
    const notificationService = new NotificationService(databases);
    const classDoc = await databases.getDocument(DB_ID, 'classes', classId);
    
    await notificationService.notifyAttendanceMarked(
      studentIds,
      classDoc.name,
      date
    );
    
    res.json({ success: true });
  } catch (error) {
    // ...
  }
});
*/

// In server/routes/ - Periodically check and notify low attendance
/*
// Cron job or scheduled task
async function checkAndNotifyLowAttendance() {
  try {
    const students = await databases.listDocuments(DB_ID, 'students', [Query.limit(1000)]);
    const notificationService = new NotificationService(databases);
    
    for (const student of students.documents) {
      const attendance = await databases.listDocuments(DB_ID, 'attendanceRecords', [
        Query.equal('studentId', student.$id)
      ]);
      
      const presentDays = attendance.documents.filter(a => a.status === 'present').length;
      const totalDays = attendance.documents.length;
      const percentage = (presentDays / totalDays) * 100;
      
      if (percentage < 80) {
        // Notify student
        await notificationService.notifyLowAttendance(student.$id, percentage);
        
        // Notify parent if parentId exists
        if (student.parentId) {
          await notificationService.notifyParentLowAttendance(
            student.parentId,
            student.firstName + ' ' + student.lastName,
            percentage
          );
        }
      }
    }
  } catch (error) {
    logError('Low attendance check failed', error);
  }
}
*/

// ============================================================================
// 3. GRADE NOTIFICATIONS
// ============================================================================

// In server/routes/ - When grades are posted
/*
app.post('/api/grades', auth, async (req: Request, res: Response) => {
  try {
    const { studentId, subject, score, totalScore, grade } = req.body;
    
    // Create grade record
    const gradeDoc = await databases.createDocument(DB_ID, 'grades', ID.unique(), {
      studentId,
      subject,
      score,
      totalScore,
      grade,
      percentage: (score / totalScore) * 100
    });
    
    // Notify student
    const notificationService = new NotificationService(databases);
    await notificationService.notifyGradesPosted(
      studentId,
      subject,
      score,
      totalScore,
      grade
    );
    
    // Notify parent
    const student = await databases.getDocument(DB_ID, 'students', studentId);
    if (student.parentId) {
      await notificationService.notifyParentGradesPosted(
        student.parentId,
        student.firstName + ' ' + student.lastName,
        subject,
        grade,
        (score / totalScore) * 100
      );
    }
    
    // If low score, notify teacher
    if ((score / totalScore) * 100 < 50) {
      const teacher = await getTeacherBySubject(subject);
      if (teacher) {
        await notificationService.notifyTeacherLowPerformance(
          teacher.$id,
          student.firstName + ' ' + student.lastName,
          subject,
          (score / totalScore) * 100
        );
      }
    }
    
    res.json(gradeDoc);
  } catch (error) {
    // ...
  }
});
*/

// ============================================================================
// 4. PAYMENT NOTIFICATIONS
// ============================================================================

// In server/routes/ - When payment is made
/*
app.post('/api/payments/process', auth, async (req: Request, res: Response) => {
  try {
    const { studentId, amount, reference, description } = req.body;
    
    // Create payment record
    const paymentDoc = await databases.createDocument(DB_ID, 'payments', ID.unique(), {
      studentId,
      amount,
      reference,
      description,
      status: 'confirmed',
      paidAt: new Date().toISOString()
    });
    
    const notificationService = new NotificationService(databases);
    
    // Notify student/parent
    const student = await databases.getDocument(DB_ID, 'students', studentId);
    await notificationService.notifyPaymentConfirmed(student.$id, amount, reference);
    
    if (student.parentId) {
      await notificationService.notifyPaymentConfirmed(student.parentId, amount, reference);
    }
    
    // Notify admin
    const adminUsers = await databases.listDocuments(DB_ID, 'userProfiles', [
      Query.equal('role', 'admin')
    ]);
    
    for (const admin of adminUsers.documents) {
      await notificationService.notifyAdminPaymentReceived(
        admin.userId,
        student.firstName + ' ' + student.lastName,
        amount,
        reference
      );
    }
    
    res.json(paymentDoc);
  } catch (error) {
    // ...
  }
});
*/

// Periodic check for pending/overdue payments
/*
async function checkAndNotifyPendingPayments() {
  try {
    const payments = await databases.listDocuments(DB_ID, 'payments', [
      Query.equal('status', 'pending'),
      Query.limit(1000)
    ]);
    
    const notificationService = new NotificationService(databases);
    
    for (const payment of payments.documents) {
      const student = await databases.getDocument(DB_ID, 'students', payment.studentId);
      const daysOverdue = Math.floor(
        (Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysOverdue > 0) {
        // Overdue
        await notificationService.notifyOverduePayment(
          student.$id,
          payment.amount,
          daysOverdue,
          payment.description
        );
        
        if (student.parentId) {
          await notificationService.notifyOverduePayment(
            student.parentId,
            payment.amount,
            daysOverdue,
            payment.description
          );
        }
      } else if (daysOverdue >= -7) {
        // Due within 7 days
        await notificationService.notifyPendingPayment(
          student.$id,
          payment.amount,
          payment.dueDate,
          payment.description
        );
      }
    }
  } catch (error) {
    logError('Payment notification check failed', error);
  }
}
*/

// ============================================================================
// 5. ANNOUNCEMENT NOTIFICATIONS
// ============================================================================

// In client/src/components/send-announcement-form.tsx - When sending announcements
/*
const onSubmit = async (data: AnnouncementFormData) => {
  try {
    // Get recipients based on type
    let recipients = [];
    
    if (data.recipientType === 'all-students') {
      const students = await databases.listDocuments(DB_ID, 'students', [Query.limit(1000)]);
      recipients = students.documents.map(s => s.userId).filter(Boolean);
    } else if (data.recipientType === 'all-teachers') {
      const teachers = await databases.listDocuments(DB_ID, 'teachers', [Query.limit(1000)]);
      recipients = teachers.documents.map(t => t.userId).filter(Boolean);
    }
    
    // Create notifications
    const notificationService = new NotificationService(databases);
    await notificationService.broadcastAnnouncement(
      recipients,
      data.subject,
      data.content,
      '/notices'
    );
    
    toast({ title: "Success", description: "Announcement sent successfully" });
  } catch (error) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  }
};
*/

// ============================================================================
// 6. SUBSCRIPTION/ACTIVATION NOTIFICATIONS
// ============================================================================

// In server/routes/ - When subscription is activated
/*
app.post('/api/activate', auth, async (req: Request, res: Response) => {
  try {
    const { activationCode } = req.body;
    const user = await req.appwrite!.account.get();
    
    // Validate and activate
    const code = await databases.listDocuments(DB_ID, 'activationCodes', [
      Query.equal('code', activationCode),
      Query.equal('used', false)
    ]);
    
    if (!code.documents.length) {
      return res.status(400).json({ message: 'Invalid activation code' });
    }
    
    // Mark code as used
    await databases.updateDocument(
      DB_ID,
      'activationCodes',
      code.documents[0].$id,
      { used: true, usedBy: user.$id, usedAt: new Date().toISOString() }
    );
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
    
    // Update user subscription
    const notificationService = new NotificationService(databases);
    await notificationService.notifySubscriptionActivated(
      user.$id,
      'Premium Access',
      expiryDate.toLocaleDateString()
    );
    
    res.json({ success: true, expiryDate });
  } catch (error) {
    // ...
  }
});
*/

// Periodic check for expiring subscriptions
/*
async function checkAndNotifyExpiringSubscriptions() {
  try {
    const users = await databases.listDocuments(DB_ID, 'userSubscriptions', [
      Query.limit(1000)
    ]);
    
    const notificationService = new NotificationService(databases);
    
    for (const subscription of users.documents) {
      const expiryDate = new Date(subscription.subscriptionExpiry);
      const daysLeft = Math.floor(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
        await notificationService.notifySubscriptionExpiring(
          subscription.userId,
          daysLeft,
          'Premium Access'
        );
      } else if (daysLeft === 0) {
        await notificationService.notifySubscriptionExpired(
          subscription.userId,
          'Premium Access'
        );
      }
    }
  } catch (error) {
    logError('Subscription expiry check failed', error);
  }
}
*/

// ============================================================================
// 7. SETUP AND SCHEDULING (server/index.ts)
// ============================================================================

/*
import NotificationService from './services/notificationService';

// In your express app setup:
const app = express();
const databases = new Databases(client);
const notificationService = new NotificationService(databases);

// Make available globally or pass to routes
export { notificationService };

// Schedule periodic notification checks
// Every day at 2 AM
schedule.scheduleJob('0 2 * * *', async () => {
  console.log('Running scheduled notification checks...');
  
  await checkAndNotifyLowAttendance();
  await checkAndNotifyExpiringSubscriptions();
  await checkAndNotifyPendingPayments();
});

// Cleanup old notifications weekly
schedule.scheduleJob('0 3 * * 0', async () => {
  console.log('Cleaning up old notifications...');
  await notificationService.deleteOldNotifications(30); // Delete older than 30 days
});
*/

// ============================================================================
// 8. CLIENT HOOKS FOR TRIGGERING NOTIFICATIONS
// ============================================================================

// Create a new hook in client/src/hooks/useNotificationTriggers.ts
/*
import { useNotifications } from './useNotifications';
import { useMutation } from '@tanstack/react-query';

export function useNotificationTriggers() {
  const { createNotification } = useNotifications();

  // Trigger exam submission notification
  const triggerExamSubmitted = useMutation({
    mutationFn: async (data: { examTitle: string; score: number; totalScore: number }) => {
      const percentage = Math.round((data.score / data.totalScore) * 100);
      const passed = percentage >= 50;

      return createNotification({
        message: `Your exam "${data.examTitle}" has been submitted! Score: ${data.score}/${data.totalScore} (${percentage}%) ${
          passed ? '✅ Passed!' : '⚠️ Review and try again'
        }`,
        link: '/exams/results'
      });
    }
  });

  return {
    triggerExamSubmitted,
  };
}
*/

// ============================================================================
// SUMMARY OF NOTIFICATION TRIGGERS
// ============================================================================

/*
EXAM NOTIFICATIONS:
✅ When exam is available/starts
✅ When time is running low (5 min warning)
✅ When exam is submitted
✅ When teacher has results to review

ATTENDANCE NOTIFICATIONS:
✅ When attendance is marked for class
✅ When student attendance falls below 80%
✅ When parent gets alert about low attendance

GRADE NOTIFICATIONS:
✅ When grades are posted for student
✅ When parent receives grade update
✅ When teacher notices low performance

PAYMENT NOTIFICATIONS:
✅ When payment is due (7 days before)
✅ When payment is overdue
✅ When payment is confirmed
✅ When admin receives payment notification

ANNOUNCEMENT NOTIFICATIONS:
✅ General announcements to students
✅ Class-specific announcements
✅ Teacher-only announcements

SUBSCRIPTION NOTIFICATIONS:
✅ When subscription is activated
✅ 7 days before expiry
✅ 3 days before expiry
✅ When expired

ADMIN NOTIFICATIONS:
✅ New user registration
✅ System alerts
✅ Payment received
✅ Low attendance alerts
*/

export {};
