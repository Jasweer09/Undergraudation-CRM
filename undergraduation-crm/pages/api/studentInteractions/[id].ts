import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing student ID" });
  }

  const ref = collection(db, "students", id, "interactions");

  if (req.method === "POST") {
    try {
      const { type, details, timestamp } = req.body;

      await addDoc(ref, {
        type,
        details,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      });

      return res.status(201).json({ success: true });
    } catch (e) {
      console.error("Error adding interaction:", e);
      return res.status(500).json({ error: "Failed to add interaction" });
    }
  }

  if (req.method === "GET") {
    try {
      const q = query(ref, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.status(200).json(data);
    } catch (e) {
      console.error("Error fetching interactions:", e);
      return res.status(500).json({ error: "Failed to fetch interactions" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
