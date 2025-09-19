import React, { useEffect, useMemo, useState } from "react";

type Comm = {
  id: string;
  type: "email" | "sms";
  direction: "inbound" | "outbound";
  subject?: string | null;
  content: string;
  from: string;
  to: string;
  status?: string | null;
  timestamp: string; // ISO
};

function asDate(ts: string) { return new Date(ts); }
function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

const Icons = {
  email: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M4 4h16v16H4z" />
      <path strokeWidth="2" d="M4 7l8 6 8-6" />
    </svg>
  ),
  sms: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M21 15a2 2 0 01-2 2H8l-5 5V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  chevron: (open: boolean) => (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M14 3h7v7" />
      <path strokeWidth="2" d="M10 14L21 3" />
      <path strokeWidth="2" d="M5 21h14a2 2 0 002-2V9" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
      <path strokeWidth="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
};

export default function CommunicationLog({ studentId }: { studentId: string }) {
  const [comms, setComms] = useState<Comm[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [active, setActive] = useState<Comm | null>(null);
  const [filters, setFilters] = useState<{ type?: "email" | "sms"; dir?: "inbound" | "outbound" }>({});

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      const res = await fetch(`/api/communications/${studentId}`);
      const data = await res.json();
      setComms(Array.isArray(data) ? data : []);
    })();
  }, [studentId]);

  // Filter logic
  const filtered = useMemo(() => {
    let sorted = [...comms].sort((a, b) => +asDate(b.timestamp) - +asDate(a.timestamp));
    if (fromDate || toDate) {
      const fromD = fromDate ? new Date(fromDate) : null;
      const toD = toDate ? new Date(toDate + "T23:59:59") : null;
      sorted = sorted.filter((c) => {
        const d = asDate(c.timestamp);
        if (fromD && d < fromD) return false;
        if (toD && d > toD) return false;
        return true;
      });
    } else {
      const latest = sorted[0];
      if (latest) {
        const key = fmtDate(asDate(latest.timestamp));
        sorted = sorted.filter((c) => fmtDate(asDate(c.timestamp)) === key);
      }
    }
    if (filters.type) sorted = sorted.filter((c) => c.type === filters.type);
    if (filters.dir) sorted = sorted.filter((c) => c.direction === filters.dir);
    return sorted;
  }, [comms, fromDate, toDate, filters]);

  // Group by day
  const byDay = useMemo(() => {
    const m: Record<string, Comm[]> = {};
    for (const c of filtered) {
      const key = fmtDate(asDate(c.timestamp));
      (m[key] ||= []).push(c);
    }
    return m;
  }, [filtered]);

  const toggle = (key: string) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  return (
    <div className="card p-6 shadow rounded-2xl bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Communication Log</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick filters */}
          <button onClick={() => setFilters({ type: "email" })} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">Email</button>
          <button onClick={() => setFilters({ type: "sms" })} className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">SMS</button>
          <button onClick={() => setFilters({ dir: "inbound" })} className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs">Inbound</button>
          <button onClick={() => setFilters({ dir: "outbound" })} className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs">Outbound</button>
          <button onClick={() => setFilters({})} className="px-3 py-1 rounded-full border border-gray-300 text-xs">Clear</button>
        </div>
      </div>

      {/* Day groups */}
      {Object.keys(byDay).length === 0 ? (
        <p className="text-gray-400">No communications.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDay).map(([day, items]) => {
            const open = !!expanded[day];
            return (
              <div key={day} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Day header */}
                <button
                  onClick={() => toggle(day)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900/60 transition"
                >
                  <div className="flex items-center gap-2">
                    {Icons.chevron(open)}
                    <span className="text-sm font-semibold">{day}</span>
                    <span className="text-xs text-gray-500">({items.length})</span>
                  </div>
                </button>
                {/* Items */}
                {open && (
                  <div className="px-4 py-3">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {items.sort((a, b) => +asDate(a.timestamp) - +asDate(b.timestamp)).map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={() => setActive(c)}
                            className="w-full text-left flex items-center gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-md px-2 transition"
                          >
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${c.type === "email" ? "bg-blue-500" : "bg-green-500"} text-white`}>
                              {c.type === "email" ? Icons.email : Icons.sms}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-500">
                                {fmtTime(asDate(c.timestamp))} · {c.type.toUpperCase()} · {c.direction}
                              </div>
                              <div className="truncate text-sm">{c.subject ? `${c.subject} — ` : ""}{c.content}</div>
                            </div>
                            <span className="text-gray-400">{Icons.external}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActive(null)} />
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-xl bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center ${active.type === "email" ? "bg-blue-500" : "bg-green-500"} text-white`}>
                  {active.type === "email" ? Icons.email : Icons.sms}
                </span>
                <div>
                  <div className="font-semibold">{active.type.toUpperCase()} · {active.direction}</div>
                  <div className="text-gray-500 text-sm">{fmtDate(asDate(active.timestamp))} · {fmtTime(asDate(active.timestamp))}</div>
                </div>
              </div>
              <button onClick={() => setActive(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div><strong>From:</strong> {active.from}</div>
              <div><strong>To:</strong> {active.to}</div>
              {active.subject && <div><strong>Subject:</strong> {active.subject}</div>}
              <div><strong>Status:</strong> {active.status || "—"}</div>
              <div className="pt-2">
                <div className="font-semibold">Content</div>
                <div className="whitespace-pre-wrap">{active.content}</div>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-between items-center">
              <button
                onClick={() => navigator.clipboard.writeText(active.content)}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >
                {Icons.copy} Copy
              </button>
              <button onClick={() => setActive(null)} className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
