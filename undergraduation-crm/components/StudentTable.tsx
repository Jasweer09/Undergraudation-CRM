import React, { useEffect, useState, useMemo } from "react";
import { getStudents, getLatestApplicationByStudent } from "../lib/db";
import { useRouter } from "next/router";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  country: string;
  phone?: string;
  grade?: string;
  lastLogin: string;
  latestStatus?: string;
};

const QUICK_FILTERS = [
  { key: "not-contacted-7d", label: "Not contacted 7d" },
  { key: "high-intent", label: "High intent" },
  { key: "needs-essay-help", label: "Needs essay help" },
];

export default function StudentTable() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentRow; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    (async () => {
      const rawStudents = await getStudents();
      const withApps: StudentRow[] = await Promise.all(
        rawStudents.map(async (s: any) => {
          const latestApp = await getLatestApplicationByStudent(s.id);
          return {
            id: s.id,
            name: s.name,
            email: s.email,
            country: s.country,
            phone: s.phone || "-",
            grade: s.grade || "-",
            lastLogin: s.lastLogin || "-",
            latestStatus: latestApp?.status || "—",
          };
        })
      );
      setStudents(withApps);
    })();
  }, []);

  // Add a filter term
  const addFilter = () => {
    if (input.trim() && !filters.includes(input.trim())) {
      setFilters([...filters, input.trim()]);
      setInput("");
    }
  };

  // Apply search + quick filters
  const filtered = useMemo(() => {
    let result = students;

    // Apply search filters (your existing logic)
    if (filters.length > 0) {
      result = result.filter((s) =>
        filters.every((f) => {
          const term = f.toLowerCase();

          if (term.startsWith(">") || term.startsWith("<")) {
            const dateStr = term.substring(1);
            const filterDate = new Date(dateStr);
            const studentDate = new Date(s.lastLogin);

            if (isNaN(filterDate.getTime()) || isNaN(studentDate.getTime())) return false;

            return term.startsWith(">")
              ? studentDate > filterDate
              : studentDate < filterDate;
          }

          return (
            (s.name?.toLowerCase() || "").includes(term) ||
            (s.email?.toLowerCase() || "").includes(term) ||
            (s.country?.toLowerCase() || "").includes(term) ||
            (s.latestStatus?.toLowerCase() || "").includes(term) ||
            (s.lastLogin?.toLowerCase() || "").includes(term)
          );
        })
      );
    }

    // Apply quick filters
    if (quickFilters.length > 0) {
      result = result.filter((s) => {
        return quickFilters.some((f) => {
          if (f === "not-contacted-7d") {
            const cutoff = new Date(Date.now() - 7 * 86400000);
            const lastLogin = new Date(s.lastLogin);
            return isNaN(lastLogin.getTime()) || lastLogin < cutoff;
          }
          if (f === "high-intent") {
            // Example heuristic: students with status "Applying" or "Applied"
            return ["Applying", "Applied"].includes(s.latestStatus || "");
          }
          if (f === "needs-essay-help") {
            // Placeholder: check if grade or name hints at essay help
            return (s.grade || "").toLowerCase().includes("essay");
          }
          return true;
        });
      });
    }

    return result;
  }, [filters, quickFilters, students]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const requestSort = (key: keyof StudentRow) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleQuickFilter = (key: string) => {
    setQuickFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Students</h3>

      {/* Quick filters row */}
      <div className="flex justify-end gap-2 mb-3">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => toggleQuickFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              quickFilters.includes(f.key)
                ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addFilter();
            }
          }}
          placeholder="Search by name, email, country, last login..."
          className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-700 flex-1"
        />
        <button
          onClick={addFilter}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
        >
          Search
        </button>
        {filters.length > 0 && (
          <button
            onClick={() => setFilters([])}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-md"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <span
            key={f}
            className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs rounded-md flex items-center gap-1"
          >
            {f}
            <button
              onClick={() => setFilters(filters.filter((x) => x !== f))}
              className="text-blue-500 hover:text-blue-700"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400">
              <SortableHeader label="Name" column="name" requestSort={requestSort} sortConfig={sortConfig} />
              <SortableHeader label="Email" column="email" requestSort={requestSort} sortConfig={sortConfig} />
              <SortableHeader label="Country" column="country" requestSort={requestSort} sortConfig={sortConfig} />
              <th className="py-2">Latest Application Status</th>
              <SortableHeader label="Last Login" column="lastLogin" requestSort={requestSort} sortConfig={sortConfig} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr
                key={s.id}
                onClick={() => router.push(`/students/${s.id}`)}
                className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition"
              >
                <td className="py-3">{s.name}</td>
                <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{s.email}</td>
                <td className="py-3">{s.country}</td>
                <td className="py-3"><StatusBadge status={s.latestStatus || "—"} /></td>
                <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(s.lastLogin)}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helpers
function SortableHeader({ label, column, requestSort, sortConfig }: any) {
  return (
    <th
      onClick={() => requestSort(column)}
      className="py-2 cursor-pointer select-none"
    >
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

function formatDate(val: any) {
  try {
    const d = typeof val === "string" ? new Date(val) : val.toDate();
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  } catch {
    return "—";
  }
}
