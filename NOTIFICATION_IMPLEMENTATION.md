/**
 * SchoolSphere Notification System - Complete Implementation Guide
 * 
 * This document outlines a production-ready notification system designed
 * specifically for educational institutions with the features needed
 * for a comprehensive school management platform.
 */

# SchoolSphere Notification System - Complete Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [What Should Trigger Notifications](#what-should-trigger-notifications)
3. [Architecture](#architecture)
4. [Implementation](#implementation)
5. [Key Features](#key-features)
6. [Integration Points](#integration-points)
7. [Testing & Deployment](#testing--deployment)

---

## Overview

The notification system is designed to:
- ✅ Keep all users informed of important events
- ✅ Provide real-time updates without page refresh
- ✅ Support bulk notifications efficiently
- ✅ Maintain notification history
- ✅ Allow filtering and search
- ✅ Handle different notification types with appropriate icons/colors

**Tech Stack:**
- Frontend: React hooks (useNotifications)
- Backend: Node.js/Express with Appwrite SDK
- Real-time: Appwrite Realtime API
- Database: Appwrite Databases

---

## What Should Trigger Notifications

### 1. **EXAM NOTIFICATIONS** 📝

**Notify Students:**
- ✅ Exam becomes available (with start time if scheduled)
- ✅ Time warning when 5 minutes remain
- ✅ Results available after submission
- ✅ Score and performance feedback

**Notify Teachers:**
- ✅ Student submitted exam
- ✅ Batch of results ready for review
- ✅ New exam uploaded to system

**Example:**
```
"Exam 'Physics Final' is now available. You have 60 minutes to complete it."
[Click] → Navigate to /exams/exam_id/take
```

---

### 2. **ATTENDANCE NOTIFICATIONS** 📅

**Notify Students:**
- ✅ Attendance marked for their class
- ✅ Attendance percentage drops below 80%
- ✅ Weekly attendance summary
- ✅ Date approaching when they'll be absent

**Notify Parents:**
- ✅ Student's attendance is low
- ✅ Unexcused absences
- ✅ Attendance improvement

**Notify Teachers:**
- ✅ Class average attendance percentage
- ✅ Students with concerning attendance

**Example:**
```
"⚠️ Your attendance is 65%. Minimum required: 80%. Please improve!"
[Click] → Navigate to /attendance
```

---

### 3. **PAYMENT NOTIFICATIONS** 💳

**Notify Students/Parents:**
- ✅ Payment reminder 7 days before due
- ✅ Payment reminder 3 days before due
- ✅ Payment reminder 1 day before due (urgent)
- ✅ Overdue payment alert (sent daily until paid)
- ✅ Payment confirmation with reference number
- ✅ Receipt and transaction details

**Notify Admin:**
- ✅ Payment received with amount and student name
- ✅ Overdue payments (daily summary)
- ✅ Payment discrepancies

**Example:**
```
"💳 Payment due: ₦50,000 for School Fees. Due: 2025-11-18"
[Click] → Navigate to /payments
```

---

### 4. **GRADE NOTIFICATIONS** 📊

**Notify Students:**
- ✅ Grade posted (with score and subject)
- ✅ Performance alerts (low scores)
- ✅ Improvement congratulations
- ✅ Mid-term and final grades

**Notify Parents:**
- ✅ Child's grade posted
- ✅ Performance feedback
- ✅ Academic progress summary

**Notify Teachers:**
- ✅ Student requesting grade review
- ✅ Bulk grade posting confirmation
- ✅ Low-performing student alert

**Example:**
```
"📊 Grades posted for Mathematics: A (85%)"
[Click] → Navigate to /progress
```

---

### 5. **COMMUNICATION & ANNOUNCEMENTS** 📢

**Notify Students:**
- ✅ New class announcement
- ✅ School-wide announcement
- ✅ Emergency/important notices
- ✅ Homework or assignment posted
- ✅ New class resources

**Notify Teachers:**
- ✅ Admin announcements
- ✅ Important updates
- ✅ System maintenance notices

**Notify Parents:**
- ✅ School announcements affecting them
- ✅ Events and dates
- ✅ Holiday schedules

**Example:**
```
"📣 School will be closed on Monday for maintenance."
[Click] → Navigate to /notices
```

---

### 6. **SUBSCRIPTION/ACTIVATION NOTIFICATIONS** 🎫

**Notify Users:**
- ✅ Subscription successfully activated
- ✅ Access to premium features granted
- ✅ Subscription expires in 7 days (warning)
- ✅ Subscription expires in 3 days (urgent)
- ✅ Subscription expired (loss of access)
- ✅ Renewal successful

**Example:**
```
"✅ Premium Access activated! Expires: 2025-11-18"
[Click] → Navigate to /exams
```

---

### 7. **SYSTEM ALERTS** 🚨

**Notify Admin:**
- ✅ Database errors
- ✅ Unusual activity (suspicious login)
- ✅ High payment default rate
- ✅ System maintenance scheduled
- ✅ Low server resources
- ✅ New user registrations (summary)

**Example:**
```
"🚨 Alert: 50 students with overdue payments"
```

---

### 8. **ACTIVITY NOTIFICATIONS** 🔔

**Notify Users:**
- ✅ Someone sent them a message
- ✅ Someone replied to their post/comment
- ✅ Video conference starting
- ✅ Assignment deadline approaching
- ✅ Class cancelled/rescheduled

**Example:**
```
"Your class 'Physics' has been rescheduled to 3 PM"
[Click] → Navigate to /communications
```

---

## Architecture

### Database Schema

**Collection: `notifications`**

```javascript
{
  $id: "unique_id",
  userId: "recipient_user_id",           // Who receives it
  message: "Notification text",          // Main message (1000 chars max)
  link: "/optional/path",               // Where to navigate on click
  type: "exam|attendance|payment|grade|announcement|general",
  data: JSON.stringify({                 // Additional context
    examTitle?: string,
    score?: number,
    amount?: number,
    // etc...
  }),
  isRead: false,                         // Read status
  search: "userId message link...",     // For full-text search
  $createdAt: "2025-10-18T...",
  $updatedAt: "2025-10-18T..."
}
```

### Service Layer

**File:** `server/services/notificationService.ts`

Centralized NotificationService class with methods for:
- Creating single notifications
- Bulk notifications
- Exam-specific notifications
- Attendance notifications
- Payment notifications
- Grade notifications
- Announcements
- Admin alerts
- Subscription alerts
- Cleanup/maintenance

### Frontend Hook

**File:** `client/src/hooks/useNotifications.ts`

Provides:
- `notifications[]` - List of user's notifications
- `isLoading` - Loading state
- `error` - Error state
- `createNotification()` - Create new notification
- `markAsRead()` - Mark individual as read
- `markAllAsRead()` - Mark all as read
- Real-time subscription for instant updates

### UI Components

**Top Navigation Bell Icon** (`client/src/components/top-nav.tsx`)
- Shows bell icon with badge count
- Popover with last 5-10 notifications
- Quick mark as read
- "View All" link to full page

**Notifications Page** (`client/src/pages/notifications.tsx`)
- Full notification history
- Filter by read/unread
- Search functionality
- Pagination
- Delete individual notifications

---

## Implementation

### Step 1: Create NotificationService

✅ **Done!** File: `server/services/notificationService.ts`

This service includes all methods needed for different notification types.

### Step 2: Add Test API Route

Create route in `server/routes.ts`:

```typescript
app.post('/api/notifications/test', auth, async (req: Request, res: Response) => {
  try {
    const user = await req.appwrite!.account.get();
    const sessionUser: any = user;
    
    // Only admins can test
    if (sessionUser?.prefs?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    
    const { userId, message, link, type } = req.body;
    const notificationService = new NotificationService(databases);
    
    const notificationId = await notificationService.createNotification({
      userId,
      message,
      link,
      type: type || 'general'
    });
    
    res.json({ success: true, notificationId });
  } catch (error) {
    logError('Test notification failed', error);
    res.status(500).json({ message: 'Failed to create test notification' });
  }
});
```

### Step 3: Integrate with Existing Routes

**In CBT/Exam Routes** (`server/routes/cbt.ts`)

```typescript
// When exam is submitted
app.post('/api/cbt/attempts/:attemptId/submit', auth, async (req, res) => {
  // ... existing code ...
  
  const notificationService = new NotificationService(databases);
  await notificationService.notifyExamSubmitted(
    user.$id,
    exam.title,
    score,
    totalScore
  );
  
  // ... rest of code ...
});
```

**In Attendance Routes** (`server/routes/attendance.ts` or similar)

```typescript
// When attendance marked
app.post('/api/attendance/mark', auth, async (req, res) => {
  // ... existing code ...
  
  const notificationService = new NotificationService(databases);
  await notificationService.notifyAttendanceMarked(
    studentIds,
    className,
    date
  );
  
  // ... rest of code ...
});
```

**In Payment Routes**

```typescript
// When payment confirmed
app.post('/api/payments/confirm', auth, async (req, res) => {
  // ... existing code ...
  
  const notificationService = new NotificationService(databases);
  await notificationService.notifyPaymentConfirmed(
    userId,
    amount,
    reference
  );
  
  // ... rest of code ...
});
```

### Step 4: Add Scheduled Jobs

Create cron jobs for periodic notifications:

```typescript
// In server/index.ts
import schedule from 'node-schedule';

// Check low attendance daily at 2 AM
schedule.scheduleJob('0 2 * * *', async () => {
  const students = await databases.listDocuments(DB_ID, 'students', [Query.limit(1000)]);
  const notificationService = new NotificationService(databases);
  
  for (const student of students.documents) {
    const attendance = await databases.listDocuments(DB_ID, 'attendanceRecords', [
      Query.equal('studentId', student.$id)
    ]);
    
    const present = attendance.documents.filter(a => a.status === 'present').length;
    const percentage = (present / attendance.documents.length) * 100;
    
    if (percentage < 80) {
      await notificationService.notifyLowAttendance(student.$id, percentage);
    }
  }
});

// Check pending payments daily
schedule.scheduleJob('0 3 * * *', async () => {
  const payments = await databases.listDocuments(DB_ID, 'payments', [
    Query.equal('status', 'pending')
  ]);
  
  const notificationService = new NotificationService(databases);
  
  for (const payment of payments.documents) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysOverdue > 0) {
      const student = await databases.getDocument(DB_ID, 'students', payment.studentId);
      await notificationService.notifyOverduePayment(
        student.parentId || student.$id,
        payment.amount,
        daysOverdue
      );
    }
  }
});

// Cleanup old notifications weekly
schedule.scheduleJob('0 4 * * 0', async () => {
  const notificationService = new NotificationService(databases);
  await notificationService.deleteOldNotifications(30);
});
```

### Step 5: Update Announcements Form

Modify `client/src/components/send-announcement-form.tsx`:

```typescript
const onSubmit = async (data: AnnouncementFormData) => {
  try {
    // Get recipients
    let recipientIds = [];
    if (data.recipientType === 'all-students') {
      const res = await databases.listDocuments(DB_ID, 'students', [Query.limit(1000)]);
      recipientIds = res.documents.map(s => s.userId).filter(Boolean);
    }
    // ... handle other recipient types ...
    
    // Create notifications
    const notificationService = new NotificationService(databases);
    await notificationService.broadcastAnnouncement(
      recipientIds,
      data.subject,
      data.content,
      '/notices'
    );
    
    toast({ title: 'Success', description: 'Announcement sent!' });
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  }
};
```

---

## Key Features

### ✅ Real-time Updates
Notifications appear instantly without page refresh using Appwrite Realtime API

### ✅ Badge Count
Bell icon shows count of unread notifications

### ✅ Notification Types
Color-coded and icon-coded by type (exam 📝, payment 💳, etc.)

### ✅ Search & Filter
Filter by read/unread, search in notification content

### ✅ Links
Click notification to navigate to relevant page

### ✅ Bulk Operations
Send notifications to multiple users efficiently

### ✅ Error Handling
Graceful failures with logging

### ✅ Cleanup
Automatic deletion of old notifications

### ✅ Admin Control
Admins can see notification activity and patterns

---

## Integration Points

| Feature | Route | Method | Notification Type | Implemented |
|---------|-------|--------|-------------------|-------------|
| Exam Submitted | POST /api/cbt/attempts/*/submit | Student | exam | ❌ Needs integration |
| Attendance Marked | POST /api/attendance/mark | Students | attendance | ❌ Needs integration |
| Low Attendance | Scheduled Job | Daily 2am | Cron | ❌ Needs scheduler |
| Payment Confirmed | POST /api/payments/confirm | User | payment | ❌ Needs integration |
| Payment Overdue | Scheduled Job | Daily 3am | Cron | ❌ Needs scheduler |
| Grades Posted | POST /api/grades | Student | grade | ❌ Needs integration |
| Announcement | POST /api/announcements | Recipients | announcement | ❌ Needs integration |
| Subscription Active | POST /api/activate | User | general | ❌ Needs integration |

---

## Testing & Deployment

### Before Going Live

1. **Test manually** using NOTIFICATION_TESTING_GUIDE.md
2. **Load test** with 100+ notifications
3. **Real-time test** across multiple browsers
4. **Error scenarios** (db down, invalid user, etc.)
5. **Performance** (notification creation speed)

### Deployment Checklist

- ☐ NotificationService created and imported
- ☐ Test API route working
- ☐ All integration points implemented
- ☐ Scheduled jobs configured
- ☐ Logs monitoring set up
- ☐ Database permissions correct
- ☐ Real-time subscription working
- ☐ UI components rendering correctly
- ☐ Testing completed
- ☐ Performance acceptable

### Monitoring

```typescript
// Log notification creation
logInfo('Notification created', { 
  userId, 
  type, 
  message: message.substring(0, 50) 
});

// Track failures
logError('Notification failed', error);

// Monitor bulk operations
logInfo('Bulk notifications', { total, successful });
```

---

## Next Steps

1. **Create** `server/services/notificationService.ts` ✅ Done
2. **Add** test API route
3. **Integrate** with exam routes
4. **Integrate** with attendance routes
5. **Integrate** with payment routes
6. **Integrate** with grade routes
7. **Add** scheduled jobs
8. **Test** all scenarios
9. **Deploy** to production
10. **Monitor** and optimize

---

## Files Reference

| File | Purpose |
|------|---------|
| `NOTIFICATION_SYSTEM.md` | Overview & architecture |
| `NOTIFICATION_INTEGRATION_GUIDE.md` | Code examples for integration |
| `NOTIFICATION_TESTING_GUIDE.md` | Testing scenarios |
| `NOTIFICATION_IMPLEMENTATION.md` | **This file** - Complete guide |
| `server/services/notificationService.ts` | Core service ✅ Created |
| `client/src/hooks/useNotifications.ts` | React hook (exists) |
| `client/src/components/top-nav.tsx` | Bell icon UI (exists) |
| `client/src/pages/notifications.tsx` | Full page (exists) |

---

## Summary

This notification system is built to:
- Provide **immediate feedback** to users about important events
- **Reduce manual checks** by pushing information proactively
- **Improve engagement** through timely reminders
- **Enhance communication** between teachers, students, and parents
- **Streamline operations** for administrators

The implementation is:
- **Scalable** - handles hundreds of notifications efficiently
- **Reliable** - error handling and logging
- **Real-time** - instant updates using WebSockets
- **User-friendly** - intuitive UI with proper organization
- **Maintainable** - centralized service with clear patterns

With this system in place, your SchoolSphere platform will feel responsive and keep all stakeholders informed of important events!

---

**Created:** October 18, 2025
**Status:** Ready for Implementation
