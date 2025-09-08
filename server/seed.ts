import { storage } from "./storage";

export async function seedDemoUsers() {
  console.log("Seeding demo users...");

  try {
    // Check if demo users already exist and create them if they don't
    const existingAdmin = await storage.getUserByEmail("admin@edumanage.school");
    if (!existingAdmin) {
      await storage.upsertUser({
        email: "admin@edumanage.school",
        firstName: "John",
        lastName: "Administrator",
        role: "admin",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      });
      console.log("Created demo admin user");
    }

    const existingTeacher = await storage.getUserByEmail("teacher@edumanage.school");
    if (!existingTeacher) {
      await storage.upsertUser({
        email: "teacher@edumanage.school",
        firstName: "Sarah",
        lastName: "Wilson",
        role: "teacher",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b2e8983c?w=100&h=100&fit=crop&crop=face"
      });
      console.log("Created demo teacher user");
    }

    const existingStudent = await storage.getUserByEmail("student@edumanage.school");
    if (!existingStudent) {
      await storage.upsertUser({
        email: "student@edumanage.school", 
        firstName: "Michael",
        lastName: "Johnson",
        role: "student",
        profileImageUrl: "https://images.unsplash.com/photo-1539571696358-61e2a4c7763d?w=100&h=100&fit=crop&crop=face"
      });
      console.log("Created demo student user");
    }

    const existingParent = await storage.getUserByEmail("parent@edumanage.school");
    if (!existingParent) {
      await storage.upsertUser({
        email: "parent@edumanage.school",
        firstName: "Maria",
        lastName: "Garcia", 
        role: "parent",
        profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
      });
      console.log("Created demo parent user");
    }

    // Create demo teacher record
    const teacherUser = await storage.getUserByEmail("teacher@edumanage.school");
    if (teacherUser) {
      const existingTeachers = await storage.getTeachers();
      const teacherExists = existingTeachers.find(t => t.userId === teacherUser.id);
      if (!teacherExists) {
        await storage.createTeacher({
          userId: teacherUser.id,
          employeeId: "T001",
          firstName: "Sarah",
          lastName: "Wilson",
          email: "teacher@edumanage.school",
          phone: "+1-555-0123",
          subjects: ["Mathematics", "Physics"],
          qualification: "M.Sc. Mathematics",
          experience: 8,
          status: "active"
        });
        console.log("Created demo teacher record");
      }
    }

    // Create demo student record
    const studentUser = await storage.getUserByEmail("student@edumanage.school");
    if (studentUser) {
      const existingStudents = await storage.getStudents();
      const studentExists = existingStudents.find(s => s.userId === studentUser.id);
      if (!studentExists) {
        await storage.createStudent({
          userId: studentUser.id,
          studentId: "S001",
          firstName: "Michael",
          lastName: "Johnson",
          email: "student@edumanage.school",
          phone: "+1-555-0124",
          dateOfBirth: new Date("2005-03-15"),
          address: "123 Student Street, Education City",
          parentName: "Maria Garcia",
          parentPhone: "+1-555-0125",
          parentEmail: "parent@edumanage.school",
          class: "SS3",
          status: "active"
        });
        console.log("Created demo student record");
      }
    }

    // Create demo exam
    const existingExams = await storage.getExams();
    if (existingExams.length === 0) {
      await storage.createExam({
        title: "JAMB Mathematics Practice Test",
        type: "jamb",
        subject: "Mathematics",
        questions: [
          {
            id: 1,
            question: "What is the value of x in the equation 2x + 5 = 15?",
            options: ["A) 5", "B) 10", "C) 7.5", "D) 2.5"],
            correct: 0,
            explanation: "2x + 5 = 15, so 2x = 10, therefore x = 5"
          },
          {
            id: 2,
            question: "If a triangle has angles 60°, 60°, and 60°, what type of triangle is it?",
            options: ["A) Scalene", "B) Isosceles", "C) Equilateral", "D) Right-angled"],
            correct: 2,
            explanation: "All angles are equal (60°), making it an equilateral triangle"
          }
        ],
        duration: 120,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: teacherUser?.id || "system",
        isActive: true
      });
      console.log("Created demo exam");
    }

    // Create demo payment
    const students = await storage.getStudents();
    const payments = await storage.getPayments();
    if (students.length > 0 && payments.length === 0) {
      await storage.createPayment({
        studentId: students[0].id,
        amount: "50000.00",
        purpose: "School Fees - Term 1",
        dueDate: new Date("2024-01-31"),
        status: "pending",
        term: "First Term",
        academicYear: "2023/2024"
      });
      console.log("Created demo payment");
    }

    // Create demo resource
    const resources = await storage.getResources();
    if (resources.length === 0) {
      await storage.createResource({
        title: "Mathematics Formulas Guide",
        description: "Comprehensive guide covering all JAMB mathematics formulas",
        type: "pdf",
        subject: "Mathematics",
        class: "SS3",
        fileUrl: "https://example.com/math-formulas.pdf",
        fileSize: 2048000,
        uploadedBy: teacherUser?.id || "system",
        isPublic: true
      });
      console.log("Created demo resource");
    }

    console.log("Demo users seeded successfully!");
  } catch (error) {
    console.error("Error seeding demo users:", error);
  }
}