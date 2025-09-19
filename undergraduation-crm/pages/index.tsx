import React, { useState } from "react";
import Layout from "../components/Layout";
import QuickStats from "../components/QuickStats";
import StudentTable from "../components/StudentTable";

export default function Home() {
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  return (
    <Layout>
      
      {/* Quick Stats (still clickable for stage filter) */}
      <QuickStats onStageClick={(stage) => setStageFilter(stage)} />

      {/* Student Table */}
      <div className="mt-8">
        <StudentTable stageFilter={stageFilter} quickFilter={quickFilter} />
      </div>
    </Layout>
  );
}
