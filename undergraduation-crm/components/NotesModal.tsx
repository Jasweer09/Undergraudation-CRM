import React, { useEffect, useState } from "react";

type Note = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

const Icons = {
  edit: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M15 3l6 6-12 12H3v-6L15 3z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M19 7l-1 12H6L5 7m5-4h4a1 1 0 011 1v2H9V4a1 1 0 011-1z" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M12 20h9M12 4h9M4 8h16M4 16h16" />
    </svg>
  )
};

export default function NotesModal({
  studentId,
  open,
  onClose,
}: {
  studentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await fetch(`/api/notes/${studentId}`);
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    })();
  }, [open, studentId]);

  async function addNote() {
    if (!newNote.trim()) return;
    await fetch(`/api/notes/${studentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: "Team Member", content: newNote }),
    });
    setNewNote("");
    const res = await fetch(`/api/notes/${studentId}`);
    setNotes(await res.json());
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${studentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: id }),
    });
    setNotes(notes.filter((n) => n.id !== id));
  }

  async function saveEdit(id: string, content: string) {
    await fetch(`/api/notes/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: id, content }),
    });
    setEditing(null);
    const res = await fetch(`/api/notes/${studentId}`);
    setNotes(await res.json());
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-6 rounded-2xl shadow-xl bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 font-semibold">{Icons.note} Team Notes</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Notes timeline */}
        <div className="max-h-[500px] overflow-y-auto px-5 py-4 relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-6">
            {notes.map((n) => (
              <div key={n.id} className="relative flex items-start group">
                {/* Avatar */}
                <div className="flex-shrink-0 mr-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {n.author[0]}
                  </div>
                </div>
                {/* Note card */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{n.author}</span>
                    <span className="text-xs text-gray-500">{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  {editing === n.id ? (
                    <textarea
                      defaultValue={n.content}
                      className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      onBlur={(e) => saveEdit(n.id, e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-gray-800 dark:text-gray-100">{n.content}</p>
                  )}
                  <div className="flex gap-3 justify-end mt-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditing(n.id)} title="Edit" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                      {Icons.edit}
                    </button>
                    <button onClick={() => deleteNote(n.id)} title="Delete" className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-600">
                      {Icons.trash}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {notes.length === 0 && <p className="text-gray-400">No notes yet.</p>}
          </div>
        </div>

        {/* Add note bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
          <textarea
            placeholder="Write a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          />
          <button
            onClick={addNote}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
