import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  applications: any[];
};

export default function QuickStatsModal({ open, onClose, title, applications }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-4xl p-6 relative">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ✕
        </button>

        {applications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No applications in this stage.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                  <th className="py-2 px-3">Application ID</th>
                  <th className="py-2 px-3">University</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Country</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr
                    key={a.applicationId}
                    className={`border-t transition ${
                        a.status === "Shortlisting"
                        ? "bg-gray-50 dark:bg-gray-800/40"
                        : a.status === "Applying"
                        ? "bg-yellow-50 dark:bg-yellow-900/20"
                        : a.status === "Applied"
                        ? "bg-purple-50 dark:bg-purple-900/20"
                        : a.status === "Selected"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-3">{a.applicationId}</td>
                    <td className="py-2 px-3">{a.universityName}</td>
                    <td className="py-2 px-3">{a.studentName}</td>
                    <td className="py-2 px-3">{a.country}</td>
                    <td className="py-2 px-3"><StatusBadge status = {a.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Shortlisting: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    Applying: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Applied: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    Selected: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md ${styles[status] || ""}`}
    >
      {status}
    </span>
  );
}