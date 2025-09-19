import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import {
  collection, addDoc, getDocs, query, where, orderBy,
  deleteDoc, doc, updateDoc
} from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // studentId
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing student ID" });
  }

  const ref = collection(db, "notes");

  if (req.method === "POST") {
    const { author, content, timestamp } = req.body;
    if (!author || !content) {
      return res.status(400).json({ error: "Missing fields {author, content}" });
    }
    try {
      const docRef = await addDoc(ref, {
        studentId: id,
        author,
        content,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      });
      return res.status(201).json({ success: true, id: docRef.id });
    } catch (e) {
      return res.status(500).json({ error: "Failed to add note" });
    }
  }

  if (req.method === "GET") {
    try {
        const q = query(
        ref,
        where("studentId", "==", id),
        orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate
            ? d.data().timestamp.toDate().toISOString()
            : d.data().timestamp,
        }));
        return res.status(200).json(data);
    } catch (e) {
        console.error("Error fetching notes:", e);
        return res.status(500).json({ error: "Failed to fetch notes" });
    }
    }

  if (req.method === "DELETE") {
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ error: "Missing noteId" });
    try {
      await deleteDoc(doc(db, "notes", noteId));
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: "Failed to delete note" });
    }
  }

  if (req.method === "PUT") {
    const { noteId, content } = req.body;
    if (!noteId || !content) return res.status(400).json({ error: "Missing noteId or content" });
    try {
      await updateDoc(doc(db, "notes", noteId), { content });
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: "Failed to update note" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
