import { db } from "./firebase";

import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from "firebase/firestore";

// ---- STUDENTS ----
export async function getStudents() {
  const snapshot = await getDocs(collection(db, "students"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getStudentById(studentId: string) {
  const q = query(
    collection(db, "students"),
    where("id", "==", studentId)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  return null;
}

// ---- APPLICATIONS ----
export async function getApplications() {
  const snapshot = await getDocs(collection(db, "applications"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getApplicationsByStudent(studentId: string) {
  const q = query(
    collection(db, "applications"),
    where("studentId", "==", studentId),
    orderBy("time", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getLatestApplicationByStudent(studentId: string) {
  try {
    const q = query(
      collection(db, "applications"),
      where("studentId", "==", studentId),
      orderBy("time", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (err: any) {
    if (err.code === "failed-precondition") {
      // Firestore index not built yet
      return { indexBuilding: true };
    }
    throw err; // rethrow other errors
  }
}
