import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { getStudentById, getApplicationsByStudent } from "../../lib/db";
import Header from "../../components/Header";
import InteractionTimeline from "@/components/InteractionTimeline";
import CommunicationLog from "../../components/CommunicationLog";
import NotesModal from "@/components/NotesModal";

export default function StudentDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [student, setStudent] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [notesOpen, setNotesOpen] = useState<Note[]>([]);
  type Interaction = {
    id: string;
    type: "login" | "logout" | "application_submitted" | "question_asked";
    details: string;
    timestamp: string;
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      const s = await getStudentById(id as string);
      const apps = await getApplicationsByStudent(id as string);
      setStudent(s);
      setApplications(apps);
      setLoading(false);
    })();
  }, [id]);

  const addFilter = () => {
    if (input.trim() && !filters.includes(input.trim())) {
      setFilters([...filters, input.trim()]);
      setInput("");
    }
  };

  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/interactions/${id}`);
        const data = await res.json();
        setInteractions(data);
      } catch (err) {
        console.error("Error fetching interactions:", err);
      }
    })();
  }, [id]);

  const filtered = useMemo(() => {
    if (filters.length === 0) return applications;
    return applications.filter((a) =>
      filters.some((f) => {
        const term = f.toLowerCase();

        // date filter
        if (term.startsWith(">") || term.startsWith("<")) {
          const dateStr = term.substring(1);
          const filterDate = new Date(dateStr);
          const appDate = new Date(a.time);
          if (isNaN(filterDate.getTime()) || isNaN(appDate.getTime())) return false;
          return term.startsWith(">") ? appDate > filterDate : appDate < filterDate;
        }

        return (
          a.applicationId?.toLowerCase().includes(term) ||
          a.universityName?.toLowerCase().includes(term) ||
          a.status?.toLowerCase().includes(term)
        );
      })
    );
  }, [filters, applications]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      if (sortConfig.key === "time") {
        return sortConfig.direction === "asc"
          ? new Date(aVal).getTime() - new Date(bVal).getTime()
          : new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found.</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="container mx-auto px-6 py-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="btn-secondary">← Back</button>
          <button onClick={() => setNotesOpen(true)} className="flex items-center gap-1 px-3 py-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800">
            📝 Notes
          </button>
        </div>

        <NotesModal studentId={id as string} open={notesOpen} onClose={() => setNotesOpen(false)} />

        {/* Info card (1/4) + Progress (2/4) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-stretch">
          {/* Info Card */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{student.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {student.id}</p>
              </div>
            </div>

            {/* Key Info */}
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center justify-between">
                <span className="font-medium">Email:</span>
                <span className="truncate text-gray-600 dark:text-gray-400">{student.email}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-medium">Phone:</span>
                <span className="text-gray-600 dark:text-gray-400">{student.phone || "—"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-medium">Grade:</span>
                <span className="text-gray-600 dark:text-gray-400">{student.grade || "—"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-medium">Country:</span>
                <span className="text-gray-600 dark:text-gray-400">{student.country}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-medium">Last Login:</span>
                <span className="text-gray-600 dark:text-gray-400">{formatDate(student.lastLogin)}</span>
              </li>
            </ul>
          </div>

          {/* Application Progress Bars */}
          <div className="md:col-span-2 card p-6 shadow rounded-2xl bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4">Application Progress</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {["Shortlisting", "Applying", "Applied", "Selected"].map((stage) => {
                const count = applications.filter((a) => a.status === stage).length;
                const percent = applications.length
                  ? Math.round((count / applications.length) * 100)
                  : 0;

                const colors: Record<string, string> = {
                  Shortlisting: "bg-gray-400",
                  Applying: "bg-yellow-400",
                  Applied: "bg-purple-500",
                  Selected: "bg-green-500",
                };

                return (
                  <div
                    key={stage}
                    className="cursor-pointer"
                    onClick={() => {
                      if (filters.includes(stage)) {
                        setFilters(filters.filter((f) => f !== stage));
                      } else {
                        setFilters([...filters, stage]);
                      }
                    }}
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{stage}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[stage]} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="card p-6 shadow rounded-2xl bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4">Applications</h2>

          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFilter(); } }}
              placeholder="Search by ID, university, status, or date..."
              className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-700 flex-1"
            />
            <button onClick={addFilter} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
              Search
            </button>
            {filters.length > 0 && (
              <button onClick={() => setFilters([])} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-md">
                Clear All
              </button>
            )}
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((f) => (
              <span key={f} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs rounded-md flex items-center gap-1">
                {f}
                <button onClick={() => setFilters(filters.filter((x) => x !== f))} className="text-blue-500 hover:text-blue-700">
                  ✕
                </button>
              </span>
            ))}
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <SortableHeader label="Application ID" column="applicationId" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader label="University" column="universityName" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader label="Status" column="status" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader label="Submitted At" column="time" requestSort={requestSort} sortConfig={sortConfig} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => (
                  <tr
                    key={a.applicationId}
                    className="relative border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                  >
                    {/* Accent bar inside first column */}
                    <td className="relative px-4 py-2">
                      <span
                        className={`absolute left-0 top-0 h-full w-1 rounded-r transition-all duration-300 opacity-60`}
                        style={{ backgroundColor: statusColor(a.status) }}
                      ></span>
                      {a.applicationId}
                    </td>
                    <td className="px-4 py-2">{a.universityName}</td>
                    <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-2">{formatDate(a.time)}</td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <InteractionTimeline interactions={interactions} />
        </div>

        <div className="mt-8">
          <CommunicationLog studentId={id as string} />
        </div>

      </main>
    </div>
  );
}

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────
function SortableHeader({ label, column, requestSort, sortConfig }: any) {
  return (
    <th onClick={() => requestSort(column)} className="py-2 px-4 cursor-pointer select-none">
      {label}{" "}
      {sortConfig?.key === column ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Shortlisting: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    Applying: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Applied: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    Selected: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  };
  return <span className={`px-2 py-1 text-xs rounded-md ${styles[status] || ""}`}>{status}</span>;
}

function statusColor(status: string) {
  switch (status) {
    case "Shortlisting": return "#9ca3af"; // gray
    case "Applying": return "#facc15"; // yellow
    case "Applied": return "#a855f7"; // purple
    case "Selected": return "#22c55e"; // green
    default: return "transparent";
  }
}

function formatDate(val: any) {
  try {
    const d = typeof val === "string" ? new Date(val) : val.toDate();
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  } catch {
    return "—";
  }
}
