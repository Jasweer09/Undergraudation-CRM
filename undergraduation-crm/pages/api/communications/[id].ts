// pages/api/communications/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { updateMetricsForStudent } from "../../../lib/metrics";


const ALLOWED_TYPES = ["email", "sms", "call", "note"];     // UPDATED
const ALLOWED_DIR   = ["inbound", "outbound"];              // optional for call/email/sms

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // studentId
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing student ID in URL" });

  const ref = collection(db, "communications");

  if (req.method === "POST") {
    try {
      const payload = Array.isArray(req.body) ? req.body : [req.body];
      const createdIds: string[] = [];

      for (const c of payload) {
        const { type, direction, timestamp, subject, content, from, to, status } = c;

        if (!type || !ALLOWED_TYPES.includes(type)) {
          return res.status(400).json({ error: `Invalid 'type'. Allowed: ${ALLOWED_TYPES.join(", ")}` });
        }
        // For manual notes/calls we don’t require from/to; for email/sms we do.
        if ((type === "email" || type === "sms") && (!content || !from || !to)) {
          return res.status(400).json({ error: "For email/sms, fields {from, to, content} are required" });
        }
        if ((type === "call" || type === "note") && !content) {
          return res.status(400).json({ error: "For call/note, field {content} is required" });
        }

        const docRef = await addDoc(ref, {
          studentId: id,
          type,                               // email | sms | call | note
          direction: direction || null,       // inbound | outbound | null
          subject: subject || null,           // mainly for emails
          content,                            // required
          from: from || null,
          to: to || null,
          status: status || (type === "email" ? "mocked" : null), // mock send default
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        });
        await updateMetricsForStudent(id);
        createdIds.push(docRef.id);
      }

      return res.status(201).json({ success: true, added: createdIds.length, ids: createdIds });
    } catch (e) {
      console.error("Error adding communications:", e);
      return res.status(500).json({ error: "Failed to add communications" });
    }
  }

  if (req.method === "GET") {
    try {
      const qy = query(
        ref,
        where("studentId", "==", id),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(qy);
      const data = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          ...x,
          timestamp: x.timestamp?.toDate ? x.timestamp.toDate().toISOString() : x.timestamp,
        };
      });
      return res.status(200).json(data);
    } catch (e) {
      console.error("Error fetching communications:", e);
      return res.status(500).json({ error: "Failed to fetch communications" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
