import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid application ID" });
  }

  const ref = doc(db, "applications", id);

  try {
    if (req.method === "GET") {
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Application not found" });
      }
      return res.status(200).json({ id: snapshot.id, ...snapshot.data() });
    }

    if (req.method === "PUT") {
      const data = req.body;
      await updateDoc(ref, data);
      return res.status(200).json({ id, ...data });
    }

    if (req.method === "DELETE") {
      await deleteDoc(ref);
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Error handling application:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
