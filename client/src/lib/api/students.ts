import { databases } from "../appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const STUDENTS_COLLECTION_ID = 'students';

export async function getStudentsByClass(classId: string) {
    const students = await databases.listDocuments(DATABASE_ID, STUDENTS_COLLECTION_ID, [
        Query.equal("classId", classId)
    ]);
    return students.documents;
}

export async function getStudentByUserId(userId: string) {
    const response = await databases.listDocuments(DATABASE_ID, STUDENTS_COLLECTION_ID, [
        Query.equal("userId", userId)
    ]);
    return response.documents[0];
}

export async function getStudentByParentEmail(email: string) {
    const response = await databases.listDocuments(DATABASE_ID, STUDENTS_COLLECTION_ID, [
        Query.equal("parentEmail", email)
    ]);
    return response.documents[0];
}