import { databases, ID } from "../appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ATTENDANCE_RECORDS_COLLECTION_ID = 'attendanceRecords';
const TEACHERS_COLLECTION_ID = 'teachers';
const CLASSES_COLLECTION_ID = 'classes';

export async function getTeacherClasses(teacherId: string) {
    const teacher = await databases.getDocument(DATABASE_ID, TEACHERS_COLLECTION_ID, teacherId);
    if (!teacher.classIds || teacher.classIds.length === 0) {
        return [];
    }
    // Use a single equality with array to match any of the ids
    const classes = await databases.listDocuments(DATABASE_ID, CLASSES_COLLECTION_ID, [
        Query.equal("$id", teacher.classIds as string[])
    ]);
    return classes.documents;
}

export async function getAttendanceRecordsForDate(classId: string, date: string) {
    const response = await databases.listDocuments(DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, [
        Query.equal("classId", classId),
        Query.equal("date", date),
        Query.limit(100)
    ]);
    return response.documents;
}

export async function saveAttendanceRecords(classId: string, date: string, studentStatuses: Array<{ studentId: string, status: string }>) {
    const existingRecords = await getAttendanceRecordsForDate(classId, date);
    const existingRecordMap = new Map(existingRecords.map(r => [r.studentId, r.$id]));

    const promises = studentStatuses.map(studentStatus => {
        const recordId = existingRecordMap.get(studentStatus.studentId);
        const data = {
            classId,
            date,
            studentId: studentStatus.studentId,
            status: studentStatus.status
        };

        if (recordId) {
            // Update existing record
            return databases.updateDocument(DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, recordId, data);
        } else {
            // Create new record
            return databases.createDocument(DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, ID.unique(), data);
        }
    });

    return Promise.all(promises);
}


export async function getAttendanceByStudent(studentId: string) {
    const response = await databases.listDocuments(DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, [
        Query.equal("studentId", studentId),
        Query.orderDesc("date"),
        Query.limit(100)
    ]);
    return response.documents;
}

export async function getAllAttendanceRecords(limit = 100, offset = 0) {
    const response = await databases.listDocuments(DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc("date"),
    ]);
    return response;
}

export async function getAllClasses() {
    const response = await databases.listDocuments(DATABASE_ID, CLASSES_COLLECTION_ID);
    return response.documents;
}