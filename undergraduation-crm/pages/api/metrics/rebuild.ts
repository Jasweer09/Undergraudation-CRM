import type { NextApiRequest, NextApiResponse } from "next";
import { rebuildAllMetrics } from "../../../lib/metrics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await rebuildAllMetrics();
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Rebuild metrics failed:", e);
    return res.status(500).json({ error: "rebuild_failed" });
  }
}
