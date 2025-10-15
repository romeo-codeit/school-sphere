# OhmanFoundations School Management System - Feature Guide

This guide explains every feature and page in your site, in the order a user would experience them, from sign up to sign out. It is designed for your client to understand how the platform works and what each part does.

---

## 1. Landing Page
- **Purpose:** Welcome users, explain the platform, and guide them to sign up or log in.
- **Features:**
  - Hero section with branding and call-to-action
  - Features overview (what the platform offers)
  - How it works (step-by-step explanation)
  - Testimonials from users
  - Footer with contact info and links

## 2. Sign Up Page
- **Purpose:** Allow new users (students, teachers, parents, admins) to create an account.
- **Features:**
  - Form for entering name, email, password, and role
  - Validation for required fields
  - Option to enter activation code (for teachers/admins)
  - Success message and redirect to login

## 3. Login Page
- **Purpose:** Authenticate users and grant access to their dashboard.
- **Features:**
  - Email and password login form
  - Error messages for invalid credentials
  - Password reset option
  - Block after too many failed attempts (security)

## 4. Dashboard (Role-Based)
- **Purpose:** Main hub for each user type, showing relevant info and actions.
- **Features:**
  - **Admin Dashboard:**
    - Stats cards (students, teachers, payments, attendance)
    - Weekly attendance chart
    - Student progress chart
    - Event calendar
    - Notice board (announcements)
    - Recent activity widget
    - Subscription management
    - Account approval manager
  - **Teacher Dashboard:**
    - Class attendance
    - Student list and progress
    - Exam management
    - Notices and events
    - Recent activity
  - **Student/Parent Dashboard:**
    - Exam results
    - Attendance records
    - Notices and events
    - Payment status
    - Recent activity

## 5. Profile Page
- **Purpose:** View and edit user profile details.
- **Features:**
  - Display name, email, role
  - Edit profile info
  - Change password
  - Upload profile picture

## 6. Students Page
- **Purpose:** List and manage students (admin/teacher only).
- **Features:**
  - Table of students with search/filter
  - Add, edit, or remove students
  - View student profiles

## 7. Teachers Page
- **Purpose:** List and manage teachers (admin only).
- **Features:**
  - Table of teachers with search/filter
  - Add, edit, or remove teachers
  - View teacher profiles

## 8. Subjects Page
- **Purpose:** Manage subjects offered in the school.
- **Features:**
  - List of subjects
  - Add, edit, or remove subjects
  - Assign subjects to classes/teachers

## 9. Exams Page
- **Purpose:** Manage and take exams.
- **Features:**
  - List of available exams
  - Take exam (students)
  - Upload exam (admin/teacher)
  - View exam results
  - Assign exams to students/classes

## 10. Exam Results Page
- **Purpose:** View results of completed exams.
- **Features:**
  - Table of exam results
  - Filter by student, subject, date
  - Download/print results

## 11. Attendance Page
- **Purpose:** Track and manage attendance.
- **Features:**
  - Mark attendance (teacher)
  - View attendance records (student/parent)
  - Attendance reports (admin)
  - Historical attendance data

## 12. Payments Page
- **Purpose:** Manage school payments and fees.
- **Features:**
  - View payment status (student/parent)
  - Make payments online
  - Admin/teacher: view all payments, pending/overdue

## 13. Resources Page
- **Purpose:** Access learning resources and materials.
- **Features:**
  - List of resources by subject/type
  - Download/view resources
  - Upload resources (admin/teacher)

## 14. Notices & Notifications Pages
- **Purpose:** Communicate important updates and alerts.
- **Features:**
  - Notice board for announcements
  - Notifications for events, deadlines, messages
  - Mark notifications as read

## 15. Messages Page
- **Purpose:** Internal messaging between users.
- **Features:**
  - Send/receive messages
  - Inbox and sent items
  - Reply to messages

## 16. Activities Page
- **Purpose:** Track recent activities and events.
- **Features:**
  - Timeline of user actions (logins, submissions, etc.)
  - Filter by date/type

## 17. Event Calendar
- **Purpose:** View upcoming school events and deadlines.
- **Features:**
  - Calendar view
  - Add/view events
  - Event reminders

## 18. Settings Page
- **Purpose:** Configure user and app settings.
- **Features:**
  - Change notification preferences
  - Theme selection (light/dark mode)
  - Account settings

## 19. Video Conferencing Page
- **Purpose:** Join or host virtual classes/meetings.
- **Features:**
  - Start/join video calls
  - Schedule meetings
  - Share screen and resources

## 20. Sign Out
- **Purpose:** Securely log out of the platform.
- **Features:**
  - Sign out button in dashboard/profile/settings
  - Session cleared, redirect to landing/login page

---

## Sub-Pages & Dialogs
- **Activation Codes:** Enter codes for teacher/admin activation
- **Create User:** Admin creates new users
- **Take Attendance:** Teacher marks attendance for class
- **Student/Teacher Profile:** Detailed view for each user
- **Assign Exam Dialog:** Assign exams to students/classes
- **Subject Selection Dialog:** Choose subjects for exams
- **Upload Exam Form:** Admin/teacher uploads exam files
- **Account Approval Manager:** Admin approves new accounts
- **Subscription Manager:** Manage school subscriptions
- **Error Boundary:** Friendly error messages if something goes wrong
- **Splash Screen:** Animated loading screen on app start

---

## Error Handling & Help
- Friendly error messages and retry options on all pages
- Loading spinners while data is fetched
- Help/contact info in footer and settings

---

## Sequential User Journey
1. **Visit Landing Page** → 2. **Sign Up** → 3. **Login** → 4. **Dashboard**
5. **Explore Profile, Students, Teachers, Subjects, Exams, Attendance, Payments, Resources, Notices, Messages, Activities, Events, Settings, Video Conferencing**
6. **Sign Out**

Every page and sub-page is designed to be intuitive, secure, and user-friendly. If your client needs more detail on any feature, you can expand the relevant section.
