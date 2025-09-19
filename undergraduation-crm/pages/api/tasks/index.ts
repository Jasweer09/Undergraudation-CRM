// pages/api/tasks/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = collection(db, "tasks");

  if (req.method === "POST") {
    const { title, dueAt, assignee, notes, studentId } = req.body || {};
    if (!title || !dueAt) return res.status(400).json({ error: "Missing fields {title, dueAt}" });

    try {
      const docRef = await addDoc(ref, {
        title,
        dueAt: new Date(dueAt),
        assignee: assignee || null,
        notes: notes || null,
        studentId: studentId || null,
        status: "open",
        createdAt: new Date(),
      });
      return res.status(201).json({ success: true, id: docRef.id });
    } catch (e) {
      console.error("Error creating task:", e);
      return res.status(500).json({ error: "Failed to create task" });
    }
  }

  if (req.method === "GET") {
    try {
      const qy = query(ref, orderBy("dueAt", "asc"));
      const snap = await getDocs(qy);
      const data = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          ...x,
          dueAt: x.dueAt?.toDate ? x.dueAt.toDate().toISOString() : x.dueAt,
          createdAt: x.createdAt?.toDate ? x.createdAt.toDate().toISOString() : x.createdAt,
        };
      });
      return res.status(200).json(data);
    } catch (e) {
      console.error("Error fetching tasks:", e);
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
