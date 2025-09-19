import React, { useEffect, useState } from "react";
import { getApplications, getStudents } from "../lib/db";
import QuickStatsModal from "./QuickStatsModal";

const STAGES = ["Shortlisting", "Applying", "Applied", "Selected"];

export default function QuickStats() {
  const [apps, setApps] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [stageApps, setStageApps] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const a = await getApplications();
      const s = await getStudents();
      setApps(a);
      setStudents(s);
    })();
  }, []);

  function openStage(stage: string) {
    const enriched = apps
      .filter((a) => a.status === stage)
      .map((a) => {
        const student = students.find((st) => st.id === a.studentId);
        return {
          ...a,
          studentName: student?.name || "Unknown",
          country: student?.country || "—",
        };
      });

    setStageApps(enriched);
    setSelectedStage(stage);
    setModalOpen(true);
  }

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const count = apps.filter((a) => a.status === stage).length;
          return (
            <div
              key={stage}
              onClick={() => openStage(stage)}
              className="cursor-pointer rounded-lg p-4 text-center shadow-md bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:scale-105 transition"
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm mt-1">{stage}</div>
            </div>
          );
        })}
      </div>

      <QuickStatsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Applications in ${selectedStage}`}
        applications={stageApps}
      />
    </div>
  );
}
