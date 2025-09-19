import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";

type Mode = "log" | "email" | "task";

const Icons = {
  back: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M22 16.92V21a2 2 0 01-2.18 2A19.86 19.86 0 013 5.18 2 2 0 015 3h4.09a2 2 0 012 1.72l.5 3a2 2 0 01-.5 1.57l-1.22 1.22a16 16 0 006.36 6.36l1.22-1.22a2 2 0 011.57-.5l3 .5A2 2 0 0122 16.92z"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
      <path strokeWidth="2" d="M3 7l9 6 9-6" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
      <path strokeWidth="2" d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M20 6L9 17l-5-5" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M10.29 3.86l-8.2 14.2A2 2 0 004 21h16a2 2 0 001.71-2.94l-8.2-14.2a2 2 0 00-3.42 0z" />
      <path strokeWidth="2" d="M12 9v4M12 17h.01" />
    </svg>
  ),
  spinner: (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3A5 5 0 007 12H4z"></path>
    </svg>
  )
};

export default function CommunicationToolsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("log"); // default open: Manual Communication
  const [toast, setToast] = useState<{ type: "ok" | "warn"; msg: string } | null>(null);

  // --- Manual log state ---
  const [mlStudentId, setMlStudentId] = useState("");
  const [mlType, setMlType] = useState<"call" | "note">("call");
  const [mlDirection, setMlDirection] = useState<"inbound" | "outbound">("outbound");
  const [mlContent, setMlContent] = useState("");
  const [mlLoading, setMlLoading] = useState(false);

  // --- Mock email state ---
  const [emStudentId, setEmStudentId] = useState("");
  const [emTo, setEmTo] = useState("");
  const [emSubject, setEmSubject] = useState("");
  const [emBody, setEmBody] = useState("");
  const [emLoading, setEmLoading] = useState(false);
  const emailTemplates = useMemo(
    () => [
      {
        id: "docs-missing",
        name: "Documents Missing",
        subject: "Action required: Missing documents for your application",
        body:
          "Hi {FirstName},\n\nWe’re missing one or more required documents (e.g., transcripts, ID). Please upload them in your portal to avoid delays.\n\nThanks,\nAdmissions Team",
      },
      {
        id: "status-update",
        name: "Status Update",
        subject: "Update on your university application",
        body:
          "Hi {FirstName},\n\nQuick update: your application is currently in the {Stage} stage. We’ll reach out with next steps.\n\nBest,\nAdmissions Team",
      },
      {
        id: "congrats-selected",
        name: "Congratulations",
        subject: "Congratulations — You’ve been selected!",
        body:
          "Hi {FirstName},\n\nGreat news! You’ve been selected. Please review the offer and confirm your acceptance in the portal.\n\nCheers,\nAdmissions Team",
      },
    ],
    []
  );

  // --- Task state ---
  const [tkTitle, setTkTitle] = useState("");
  const [tkDueAt, setTkDueAt] = useState("");
  const [tkAssignee, setTkAssignee] = useState("");
  const [tkStudentId, setTkStudentId] = useState("");
  const [tkNotes, setTkNotes] = useState("");
  const [tkLoading, setTkLoading] = useState(false);

  function showToast(type: "ok" | "warn", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2600);
  }

  async function submitManualLog(e: React.FormEvent) {
    e.preventDefault();
    if (!mlStudentId || !mlContent) {
      showToast("warn", "Student ID and summary are required.");
      return;
    }
    setMlLoading(true);
    try {
      const res = await fetch(`/api/communications/${mlStudentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            type: mlType, // "call" | "note"
            direction: mlType === "call" ? mlDirection : null,
            content: mlContent,
          },
        ]),
      });
      if (!res.ok) throw new Error();
      showToast("ok", "Manual communication logged.");
      setMlContent("");
    } catch {
      showToast("warn", "Failed to log communication.");
    } finally {
      setMlLoading(false);
    }
  }

  function applyTemplate(id: string) {
    const t = emailTemplates.find((x) => x.id === id);
    if (!t) return;
    setEmSubject(t.subject);
    setEmBody(t.body);
  }

  async function submitMockEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emStudentId || !emTo || !emSubject || !emBody) {
      showToast("warn", "All fields are required for mock email.");
      return;
    }
    setEmLoading(true);
    try {
      const res = await fetch(`/api/communications/${emStudentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            type: "email",
            direction: "outbound",
            to: emTo,
            from: "noreply@ug-crm.dev",
            subject: emSubject,
            content: emBody,
            status: "mocked",
          },
        ]),
      });
      if (!res.ok) throw new Error();
      showToast("ok", "Mock email queued.");
      setEmTo("");
      setEmSubject("");
      setEmBody("");
    } catch {
      showToast("warn", "Failed to queue mock email.");
    } finally {
      setEmLoading(false);
    }
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!tkTitle || !tkDueAt) {
      showToast("warn", "Title and due date/time are required.");
      return;
    }
    setTkLoading(true);
    try {
      const res = await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tkTitle,
          dueAt: tkDueAt,
          assignee: tkAssignee || null,
          studentId: tkStudentId || null,
          notes: tkNotes || null,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("ok", "Task scheduled.");
      setTkTitle("");
      setTkDueAt("");
      setTkAssignee("");
      setTkStudentId("");
      setTkNotes("");
    } catch {
      showToast("warn", "Failed to schedule task.");
    } finally {
      setTkLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {Icons.back} Back
          </button>
          <h1 className="text-xl font-semibold">Communication Tools</h1>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Engage smarter.</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Log calls/notes, trigger follow-ups (mock), and schedule tasks — all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow text-sm ${
              toast.type === "ok"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {toast.type === "ok" ? Icons.success : Icons.warn}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Mode selector cards */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModeCard
            active={mode === "log"}
            onClick={() => setMode("log")}
            title="Manual Communication"
            subtitle="Log a call or internal note"
            icon={Icons.phone}
            accent="from-emerald-400/70 to-teal-500/70"
          />
          <ModeCard
            active={mode === "email"}
            onClick={() => setMode("email")}
            title="Trigger Follow-up Email"
            subtitle="Queue a mock email"
            icon={Icons.email}
            accent="from-indigo-400/70 to-blue-500/70"
          />
          <ModeCard
            active={mode === "task"}
            onClick={() => setMode("task")}
            title="Schedule Team Task"
            subtitle="Assign a reminder"
            icon={Icons.calendar}
            accent="from-fuchsia-400/70 to-purple-500/70"
          />
        </div>
      </div>

      {/* Panel container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
          {mode === "log" && (
            <div className="p-6">
              <h3 className="text-base font-semibold mb-4">Manual Communication</h3>
              <form onSubmit={submitManualLog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Student ID</label>
                  <input
                    value={mlStudentId}
                    onChange={(e) => setMlStudentId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="e.g., UG_SAFTHA012"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-500">Type</label>
                    <select
                      value={mlType}
                      onChange={(e) => setMlType(e.target.value as any)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="call">Call</option>
                      <option value="note">Internal Note</option>
                    </select>
                  </div>
                  {mlType === "call" && (
                    <div>
                      <label className="text-sm text-gray-500">Direction</label>
                      <select
                        value={mlDirection}
                        onChange={(e) => setMlDirection(e.target.value as any)}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <option value="outbound">Outbound</option>
                        <option value="inbound">Inbound</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500">Summary / Notes</label>
                  <textarea
                    value={mlContent}
                    onChange={(e) => setMlContent(e.target.value)}
                    rows={5}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder='e.g., "Called student to discuss essays"...'
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    disabled={mlLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 transition"
                  >
                    {mlLoading ? Icons.spinner : null}
                    {mlLoading ? "Saving..." : "Save Log"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {mode === "email" && (
            <div className="p-6">
              <h3 className="text-base font-semibold mb-4">Trigger Follow-up Email (Mock)</h3>
              <form onSubmit={submitMockEmail} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Student ID</label>
                  <input
                    value={emStudentId}
                    onChange={(e) => setEmStudentId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="e.g., UG_USEMI002"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">To (Email)</label>
                  <input
                    value={emTo}
                    onChange={(e) => setEmTo(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="student@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Template</label>
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="" disabled>Select a template…</option>
                    {emailTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Subject</label>
                  <input
                    value={emSubject}
                    onChange={(e) => setEmSubject(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Next steps on your application"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500">Body</label>
                  <textarea
                    value={emBody}
                    onChange={(e) => setEmBody(e.target.value)}
                    rows={8}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Hi {FirstName}, …"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    disabled={emLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 transition"
                  >
                    {emLoading ? Icons.spinner : null}
                    {emLoading ? "Queuing..." : "Queue Mock Email"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {mode === "task" && (
            <div className="p-6">
              <h3 className="text-base font-semibold mb-4">Schedule Team Reminder / Task</h3>
              <form onSubmit={submitTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Title</label>
                  <input
                    value={tkTitle}
                    onChange={(e) => setTkTitle(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder='e.g., "Follow up with Olivia"'
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Due (date & time)</label>
                  <input
                    type="datetime-local"
                    value={tkDueAt}
                    onChange={(e) => setTkDueAt(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Assignee</label>
                  <input
                    value={tkAssignee}
                    onChange={(e) => setTkAssignee(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Team member name"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Student ID (optional)</label>
                  <input
                    value={tkStudentId}
                    onChange={(e) => setTkStudentId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Link to a student"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500">Notes (optional)</label>
                  <textarea
                    value={tkNotes}
                    onChange={(e) => setTkNotes(e.target.value)}
                    rows={4}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    disabled={tkLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 transition"
                  >
                    {tkLoading ? Icons.spinner : null}
                    {tkLoading ? "Scheduling..." : "Schedule Task"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Clickable gradient “mode” card */
function ModeCard({
  active,
  onClick,
  title,
  subtitle,
  icon,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: JSX.Element;
  accent: string; // e.g. "from-emerald-400/70 to-teal-500/70"
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative rounded-2xl p-[1px] transition",
        active ? "shadow-xl" : "shadow",
        "bg-gradient-to-br",
        active ? accent : "from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700",
        "hover:scale-[1.01]"
      ].join(" ")}
      aria-pressed={active}
    >
      <div
        className={[
          "rounded-2xl h-full w-full p-5 text-left",
          "bg-white/90 dark:bg-gray-900/90 backdrop-blur",
          "border border-white/60 dark:border-gray-800/60",
          "transition",
          active ? "" : "group-hover:bg-white dark:group-hover:bg-gray-900"
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div
            className={[
              "flex items-center justify-center w-10 h-10 rounded-xl",
              active ? "bg-gradient-to-br " + accent.replace("/70", "") : "bg-gray-100 dark:bg-gray-800"
            ].join(" ")}
          >
            {icon}
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
          </div>
        </div>
      </div>
    </button>
  );
}
