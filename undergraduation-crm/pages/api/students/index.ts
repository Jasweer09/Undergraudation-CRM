import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid"; // for unique IDs

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === "POST") {
//     try {
//       const { name, email, country, status, lastActive } = req.body;

//       if (!name || !email || !country || !status) {
//         return res.status(400).json({ error: "Missing required fields" });
//       }

//       // Generate unique student ID
//       const studentId = uuidv4();

//       const docRef = await addDoc(collection(db, "students"), {
//         id: studentId,
//         name,
//         email,
//         country,
//         status,
//         lastActive: lastActive || new Date().toISOString(),
//       });

//       return res.status(201).json({ id: docRef.id, studentId });
//     } catch (err) {
//       console.error("Error adding student:", err);
//       return res.status(500).json({ error: "Failed to add student" });
//     }
//   }

//   return res.status(405).json({ error: "Method not allowed" });
// }


//Bulk adding for testing

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === "POST") {
//     try {
//       const body = Array.isArray(req.body) ? req.body : [req.body];

//       const results: any[] = [];

//       for (const s of body) {
//         // fallback StudentId generator if not provided
//         const studentId = s.studentId || uuidv4();

//         const docRef = await addDoc(collection(db, "students"), {
//             id: s.id,
//             name: s.name,
//             email: s.email,
//             phone: s.phone,
//             grade: s.grade,
//             country: s.country,
//             lastLogin: s.lastLogin || new Date().toISOString()
//             });

//         results.push({ firestoreId: docRef.id, studentId });
//       }

//       return res.status(201).json({ added: results });
//     } catch (err) {
//       console.error("Error bulk adding students:", err);
//       return res.status(500).json({ error: "Failed to add students" });
//     }
//   }

//   return res.status(405).json({ error: "Method not allowed" });
// }


// pages/api/students/index.ts


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "POST") {
      // Create new student
      const { name, email, country, status } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const docRef = await addDoc(collection(db, "students"), {
        name,
        email,
        country,
        status: status || "Shortlisting",
        lastLogin: new Date(),
      });
      return res.status(201).json({ id: docRef.id });
    }

    if (req.method === "GET") {
      // List all students
      const snap = await getDocs(collection(db, "students"));
      const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.status(200).json(students);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Error in /api/students:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
