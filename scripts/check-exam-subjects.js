#!/usr/bin/env node

/**
 * Diagnostic script to check exam and question availability
 * Run this to see what subjects are available for JAMB/WAEC/NECO
 * 
 * Usage: node scripts/check-exam-subjects.js
 */

const SERVER_URL = 'http://localhost:5000';

async function checkExamSubjects() {
  try {
    console.log('🔍 Fetching exam subjects from server...\n');
    
    const response = await fetch(`${SERVER_URL}/api/debug/exam-subjects`);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('📊 EXAM DATABASE SUMMARY\n');
    console.log('='.repeat(60));
    
    for (const [type, info] of Object.entries(data.summary)) {
      console.log(`\n${type.toUpperCase()}:`);
      console.log(`  Total exams: ${info.totalExams}`);
      console.log(`  Exams with questions: ${info.examsWithQuestions} ✅`);
      console.log(`  Exams without questions: ${info.examsWithoutQuestions} ❌`);
      console.log(`  Available subjects: ${info.uniqueSubjects.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 DETAILED BREAKDOWN\n');
    
    for (const [type, exams] of Object.entries(data.details)) {
      console.log(`\n${type.toUpperCase()} Exams:`);
      for (const exam of exams) {
        const status = exam.hasQuestions ? '✅' : '❌';
        console.log(`  ${status} ${exam.subject} - "${exam.title}" (${exam.questionCount} questions)`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    for (const [type, info] of Object.entries(data.summary)) {
      if (info.examsWithoutQuestions > 0) {
        console.log(`⚠️  ${type.toUpperCase()}: ${info.examsWithoutQuestions} exams have no questions`);
        console.log(`   Fix: Upload questions or link to questions collection\n`);
      }
    }
    
    // Check for JAMB specifically
    if (data.summary.jamb) {
      const jambInfo = data.summary.jamb;
      const requiredSubjects = ['english', 'mathematics', 'physics', 'chemistry', 'biology', 
                                'economics', 'government', 'literature', 'crk', 'geography'];
      const available = jambInfo.uniqueSubjects;
      const missing = requiredSubjects.filter(s => !available.includes(s));
      
      if (missing.length > 0) {
        console.log(`ℹ️  JAMB: Missing common subjects: ${missing.join(', ')}`);
        console.log(`   These subjects are often needed for JAMB practice\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure the dev server is running: npm run dev');
    process.exit(1);
  }
}

checkExamSubjects();
