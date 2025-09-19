import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

const ALLOWED_TYPES = ["login", "logout", "application_submitted", "question_asked"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing student ID in URL" });
  }

  const ref = collection(db, "interactions");

  if (req.method === "POST") {
    try {
      const body = req.body;

      // ✅ Handle both single object and array
      const interactions = Array.isArray(body) ? body : [body];

      const results: string[] = [];

      for (const i of interactions) {
        const { type, details, timestamp } = i;

        // Validation
        if (!type || !details) {
          return res.status(400).json({
            error: "Missing required fields. Each interaction must have { type, details, timestamp? }",
          });
        }
        if (!ALLOWED_TYPES.includes(type)) {
          return res.status(400).json({
            error: `Invalid type '${type}'. Allowed values: ${ALLOWED_TYPES.join(", ")}`,
          });
        }

        const docRef = await addDoc(ref, {
          studentId: id,
          type,
          details,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        });

        results.push(docRef.id);
      }

      return res.status(201).json({ success: true, added: results.length, ids: results });
    } catch (e) {
      console.error("Error adding interactions:", e);
      return res.status(500).json({ error: "Failed to add interactions" });
    }
  }

  if (req.method === "GET") {
    try {
      const q = query(
        ref,
        where("studentId", "==", id),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => {
        const docData = d.data();
        return {
            id: d.id,
            ...docData,
            timestamp: docData.timestamp?.toDate
            ? docData.timestamp.toDate().toISOString()
            : docData.timestamp, // fallback if it's already a string
        };
        });
      return res.status(200).json(data);
    } catch (e) {
      console.error("Error fetching interactions:", e);
      return res.status(500).json({ error: "Failed to fetch interactions" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
