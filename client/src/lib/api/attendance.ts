import { databases } from "../appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export async function getTeacherClasses(teacherId: string) {
    const teacher = await databases.getDocument(DATABASE_ID, "teachers", teacherId);
    if (!teacher.classIds || teacher.classIds.length === 0) {
        return [];
    }
    const classQueries = teacher.classIds.map((id: string) => Query.equal("$id", id));
    const classes = await databases.listDocuments(DATABASE_ID, "classes", classQueries);
    return classes.documents;
}

export async function getStudentsByClass(classId: string) {
    const students = await databases.listDocuments(DATABASE_ID, "students", [
        Query.equal("classId", classId)
    ]);
    return students.documents;
}

export async function getAttendance(classId: string, date: string) {
    const attendance = await databases.listDocuments(DATABASE_ID, "attendance", [
        Query.equal("classId", classId),
        Query.equal("date", date)
    ]);
    return attendance.documents[0];
}

export async function saveAttendance(classId: string, date: string, studentAttendances: any) {
    const attendance = await getAttendance(classId, date);
    if (attendance) {
        return await databases.updateDocument(DATABASE_ID, "attendance", attendance.$id, {
            studentAttendances: JSON.stringify(studentAttendances)
        });
    } else {
        return await databases.createDocument(DATABASE_ID, "attendance", "unique()", {
            classId,
            date,
            studentAttendances: JSON.stringify(studentAttendances)
        });
    }
}

export async function getAttendanceByClass(classId: string) {
    const response = await databases.listDocuments(DATABASE_ID, "attendance", [
        Query.equal("classId", classId),
        Query.limit(100) // Fetch up to 100 records for now
    ]);
    return response.documents;
}

export async function getStudentByUserId(userId: string) {
    const response = await databases.listDocuments(DATABASE_ID, "students", [
        Query.equal("userId", userId)
    ]);
    return response.documents[0];
}

export async function getAllAttendanceRecords(limit = 100, offset = 0) {
    const response = await databases.listDocuments(DATABASE_ID, "attendance", [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc("$createdAt"),
    ]);
    return response;
}

export async function getAllClasses() {
    const response = await databases.listDocuments(DATABASE_ID, "classes");
    return response.documents;
}

export async function getStudentByParentEmail(email: string) {
    const response = await databases.listDocuments(DATABASE_ID, "students", [
        Query.equal("parentEmail", email)
    ]);
    return response.documents[0];
}