import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const body = Array.isArray(req.body) ? req.body : [req.body];
      const results: any[] = [];

      for (const a of body) {
        if (!a.applicationId || !a.studentId || !a.universityName || !a.status) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const docRef = await addDoc(collection(db, "applications"), {
          applicationId: a.applicationId,
          studentId: a.studentId,
          universityName: a.universityName,
          status: a.status,
          time: a.time || new Date().toISOString(),
        });

        results.push({ firestoreId: docRef.id, applicationId: a.applicationId });
      }

      return res.status(201).json({ added: results });
    } catch (err) {
      console.error("Error bulk adding applications:", err);
      return res.status(500).json({ error: "Failed to add applications" });
    }
  }

  if (req.method === "GET") {
    try {
      const snapshot = await getDocs(collection(db, "applications"));
      const apps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(apps);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch applications" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
