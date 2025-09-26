import { databases } from "./appwrite";
import { Query } from "appwrite";
import {DB} from "@/lib/db"

export async function getTeacherClasses(teacherId: string) {
    const teacher = await databases.getDocument(DB.id, "teachers", teacherId);
    if (!teacher.classIds || teacher.classIds.length === 0) {
        return [];
    }
    const classQueries = teacher.classIds.map((id: string) => Query.equal("$id", id));
    const classes = await databases.listDocuments(DB.id, "classes", classQueries);
    return classes.documents;
}

export async function getStudentsByClass(classId: string) {
    const students = await databases.listDocuments(DB.id, "students", [
        Query.equal("classId", classId)
    ]);
    return students.documents;
}

export async function getAttendance(classId: string, date: string) {
    const attendance = await databases.listDocuments(DB.id, "attendance", [
        Query.equal("classId", classId),
        Query.equal("date", date)
    ]);
    return attendance.documents[0];
}

export async function saveAttendance(classId: string, date: string, studentAttendances: any) {
    const attendance = await getAttendance(classId, date);
    if (attendance) {
        return await databases.updateDocument(DB.id, "attendance", attendance.$id, {
            studentAttendances: JSON.stringify(studentAttendances)
        });
    } else {
        return await databases.createDocument(DB.id, "attendance", "unique()", {
            classId,
            date,
            studentAttendances: JSON.stringify(studentAttendances)
        });
    }
}