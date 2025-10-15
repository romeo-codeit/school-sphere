#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '..', 'docs', 'images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

/**
 * Create a simple SVG mock screenshot with a title and optional subtitle.
 */
function svg(title, subtitle) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="60" y="60" width="1160" height="600" rx="16" fill="#ffffff" filter="url(#shadow)"/>
  <text x="640" y="200" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700" text-anchor="middle" fill="#111827">${esc(title)}</text>
  <text x="640" y="260" font-family="Arial, Helvetica, sans-serif" font-size="22" text-anchor="middle" fill="#374151">${esc(subtitle || 'Illustrative screenshot')}</text>
  <rect x="120" y="320" width="1040" height="260" rx="10" fill="#f3f4f6" stroke="#e5e7eb"/>
  <text x="640" y="460" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#6b7280">Content preview</text>
</svg>`;
}

const pages = [
  ['landing', 'Landing Page'],
  ['signup', 'Sign Up'],
  ['login', 'Login'],
  ['dashboard-admin', 'Dashboard — Admin'],
  ['dashboard-teacher', 'Dashboard — Teacher'],
  ['dashboard-student', 'Dashboard — Student/Parent'],
  ['students', 'Students List'],
  ['student-profile', 'Student Profile'],
  ['teachers', 'Teachers List'],
  ['teacher-profile', 'Teacher Profile'],
  ['attendance-hub', 'Attendance Hub'],
  ['attendance-take', 'Take Attendance'],
  ['attendance-history', 'Historical Attendance'],
  ['attendance-reports', 'Attendance Reports'],
  ['exams', 'Exams Overview'],
  ['practice-hub', 'Practice Hub (JAMB/WAEC/NECO)'],
  ['exam-taking', 'Exam Taking'],
  ['exam-results', 'Exam Results'],
  ['admin-activation-codes', 'Admin — Activation Codes'],
  ['activate', 'Activate (Guest)'],
  ['messages', 'Messages'],
  ['communications-forum', 'Communications — Forum'],
  ['communications-chat', 'Communications — Chat'],
  ['video', 'Video Conferencing'],
  ['meeting-room', 'Meeting Room'],
  ['payments', 'Payments'],
  ['resources', 'Resources'],
  ['notices', 'Notices'],
  ['activities', 'Activities'],
  ['subjects', 'Subjects'],
  ['progress', 'Progress & Grades'],
  ['notifications', 'Notifications'],
  ['settings-profile', 'Settings — Profile'],
  ['settings-school', 'Settings — School (Admin)'],
  ['settings-notifications', 'Settings — Notifications'],
  ['settings-appearance', 'Settings — Appearance'],
  ['settings-security', 'Settings — Security'],
  ['create-user', 'Create User (Admin)'],
];

for (const [id, title] of pages) {
  const file = path.join(outDir, `${id}.svg`);
  fs.writeFileSync(file, svg(title, 'For demonstration only'));
}

console.log(`Generated ${pages.length} illustrative screenshots in ${outDir}`);
