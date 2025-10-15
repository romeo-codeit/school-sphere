# SchoolSphere Feature Guide

This document walks your client through the product end‑to‑end, in the order a typical user would experience it, covering all roles (Admin, Teacher, Student, Parent, Guest). Screens and actions vary by role via RBAC. Where a section is role‑specific, it’s marked accordingly.

## 1) Landing and Access
- URL loads the Landing page with a brief overview and access to Sign Up or Login.
- Unauthenticated users can browse the landing content but cannot access protected features until they sign in.

## 2) Sign Up (All new users)
- Navigate: Sign Up
- Provide full name, email, password, select intended role (Student/Teacher/Parent or Guest for practice exams).
- On submission:
  - An account is created in the system.
  - For non‑guest roles, admin approval may be required before full access. Guests can proceed immediately (limited to practice exams).
- After successful sign up, you may be redirected to Login or signed in automatically.

## 3) Login (All users)
- Navigate: Login
- Enter email and password. Optional: Remember email (for convenience).
- On success:
  - You are authenticated and redirected to your Dashboard based on your role.
  - The system establishes a secure session for protected features.

## 4) Dashboard (Role‑based)
- Navigate: Home ("/")
- Admin Dashboard
  - Welcome banner with profile name.
  - Key stats: Total Students, Active Teachers, Pending Payments, Avg. Attendance.
  - Weekly Attendance chart.
  - Students Progress donut.
  - Event Calendar.
  - Notices panel (school announcements).
  - Recent Activity widget.
  - Management widgets:
    - Subscription Manager (manage users’ subscriptions; Admin only)
    - Account Approval Manager (approve/reject newly registered users; Admin only)
- Teacher Dashboard
  - Tailored overview for classes, attendance, and recent activities (teacher capabilities described in relevant sections below).
- Student/Parent Dashboard
  - Personalized overview: attendance, messages, notices, and upcoming items.

## 5) Global Navigation
- Sidebar/Top Navigation provides links to major areas. Visibility is role‑dependent via RBAC.

## 6) Students (Admin/Teacher)
- Navigate: Students
- View paginated students list with search and filters.
- Create student: add student details and assign class.
- Update/Delete student: edit or remove student records.
- Student Profile (Admin/Teacher, Student/Parent for own):
  - View student details, grades, attendance history, and related info.

## 7) Teachers (Admin)
- Navigate: Teachers
- View paginated teacher list with search.
- Create/Update/Delete teacher records.
- Teacher Profile (Admin/Teacher):
  - View teacher details, classes, and related metrics.

## 8) Classes (Admin/Teacher)
- Integrated across features:
  - Teachers see their assigned classes.
  - Admins manage class assignments via teacher and student records or exam assignments.

## 9) Attendance
- Attendance Hub (Admin/Teacher):
  - Links to Take Attendance, Historical Attendance, and Attendance Reports.
- Take Attendance (Admin/Teacher)
  - Select a class (teachers auto‑select if only one assigned) and mark each student’s status (Present/Absent/Late/Excused).
  - Submit to save records.
- Historical Attendance (Admin/Teacher)
  - View and manage past attendance records with filters.
- My Attendance (Student/Parent)
  - Personal attendance history in a friendly table/card view.
- Attendance Reports (Admin)
  - Generate and view aggregated attendance analytics.

## 10) Exams (All authenticated; Guest limited)
- Navigate: Exams
- Practice Hub (JAMB/WAEC/NECO)
  - Select exam type, choose subjects (with validations), and start a practice session.
  - Guests can access practice hub after activation (see Subscriptions below).
- School Exams (Internal)
  - Admin/Teacher: Upload questions, manage internal exams.
  - Assigned to Me tab shows exams assigned to the current user (Student/Teacher).
  - Preview exam: see title, subject, duration, and question count.
  - Start exam: begins attempt and navigates to exam-taking.

### Exam Taking (Admin/Student; Guest for practice)
- Navigate: Exams → Start or Practice
- Timer displays duration; questions show options.
- Answers autosave periodically; you can submit when finished.
- On submission, you are redirected to Exam Results.

### Exam Results (Admin/Student/Teacher as allowed)
- Navigate: Exam Results
- View total questions, correct answers, score, and per‑question breakdown.

## 11) Subscriptions (Guests and Admin)
- Guest users must activate to access practice exams fully.
- Activate (Guest)
  - Navigate: Activate
  - Enter activation code to unlock practice exams (JAMB/WAEC/NECO).
- Admin Activation Codes
  - Navigate: Admin → Activation Codes
  - List codes; generate new codes by prefix/count/type.

## 12) Messages (All roles)
- Navigate: Messages
- View and filter messages (Personal/Announcement/Notification).
- Compose new message:
  - Choose recipient group and message type.
  - Send; messages appear in your lists.

## 13) Communications (Forum & Chat)
- Navigate: Communications
- Forum
  - View list of forum threads; open a thread to see content and replies.
  - Post replies (role‑appropriate permissions).
- Chat
  - Create new conversation (select one or more users).
  - View conversation list and message history.
  - Send messages in real time; participant count and last activity update accordingly.

## 14) Video Conferencing (Admin/Teacher; Students/Parents join)
- Navigate: Video Conferencing
- Admin/Teacher can create a meeting (topic, optional class binding). Meetings appear in the list.
- Join meeting:
  - Launches embedded video room; participants can join/leave.
  - Meeting owners can end the meeting; participation counts update.

## 15) Payments (Admin/Student/Parent)
- Navigate: Payments
- View payments list; Admin can manage records; Students/Parents see relevant dues and statuses.

## 16) Resources (All authenticated)
- Navigate: Resources
- Browse and manage learning resources; create/update/delete as permitted by role.

## 17) Notices & Activities (All authenticated)
- Notices
  - Navigate: Notices
  - View school announcements and updates.
- Activities
  - Navigate: Activities
  - Recent activities feed across the system.

## 18) Subjects (Admin)
- Navigate: Subjects
- Manage subjects (for linking to exams and analytics).

## 19) Progress & Grades (Admin/Teacher/Student/Parent)
- Navigate: Progress
- View grades, recent exams and attendance‑based metrics.
- Students/Parents see their own; Admin/Teachers see broader views.

## 20) Notifications (All authenticated)
- Navigate: Notifications
- View system notifications and alerts.

## 21) Settings (All authenticated)
- Navigate: Settings
- Profile Settings: edit first/last name, email, phone, address.
- School Settings (Admin): update school name, address, contact, term, academic year.
- Notifications Preferences: email/SMS/push toggles.
- Appearance: theme (light/dark/system) and primary color.
- Security:
  - Enable 2FA (time‑based app), manage sessions, change password.
  - Export data.
  - Delete Account (irreversible): deletes your account and related profile/subscription data; logs you out.

## 22) Create User (Admin)
- Navigate: Create User
- Admin can create a user account directly with role assignment.

## 23) Admin Tools
- Health (Admin Dashboard card): quick counts per collection.
- Subscription Manager: view and update users’ subscription status.
- Account Approval Manager: approve or reject pending accounts and assign final roles.

## 24) Role‑Based Access Control (RBAC)
- Admin: full access across students, teachers, exams, payments, messages, resources, settings, attendance, grades, video conferencing, forum, chat.
- Teacher: read/update where relevant (students in own classes, exams create/update, attendance create/update, resources/messages/forum/chat create/update, view classes).
- Student: read own data (profile, attendance, grades), practice/internal exams assigned, messages/resources/forum/chat create/read.
- Parent: read dependent student data (attendance, grades), messages/resources/forum read.
- Guest: practice exams only (after activation), read‑only public items.

## 25) Signing Out
- Click Sign Out from the user menu.
- Your session is ended; secure cookies are cleared; you return to the Landing/Login screen.

---

Notes:
- All protected pages require authentication and honor role permissions above.
- Exams include practice hub (JAMB/WAEC/NECO) and internal school exams; results and attempts are tracked per user.
- Attendance supports daily marking, history, and reports.
- Communications offers forum conversations and private chat.
- Settings consolidates personal, school (admin), notification, appearance, and security management.
