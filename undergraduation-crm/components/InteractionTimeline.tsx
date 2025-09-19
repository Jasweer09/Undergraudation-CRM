import React, { useMemo, useState } from "react";

type Interaction = {
  id: string;
  type: "login" | "logout" | "application_submitted" | "question_asked";
  details: string;
  // can be ISO string or Firestore Timestamp-like { toDate(): Date }
  timestamp: any;
};

function asDate(ts: any): Date {
  try {
    if (!ts) return new Date(NaN);
    if (typeof ts === "string") return new Date(ts);
    if (typeof ts?.toDate === "function") return ts.toDate();
    return new Date(ts);
  } catch {
    return new Date(NaN);
  }
}

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function duration(from?: Date | null, to?: Date | null) {
  if (!from || !to) return "";
  const ms = Math.max(0, to.getTime() - from.getTime());
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const TypeStyle: Record<
  Interaction["type"],
  { dotBg: string; icon: JSX.Element; label: string; text: string }
> = {
  login: {
    dotBg: "bg-green-500",
    icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor"><path strokeWidth="2" d="M10 16l-4-4 4-4"/><path strokeWidth="2" d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4"/></svg>,
    label: "Login",
    text: "text-green-700 dark:text-green-300",
  },
  logout: {
    dotBg: "bg-rose-500",
    icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor"><path strokeWidth="2" d="M14 8l4 4-4 4"/><path strokeWidth="2" d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4"/></svg>,
    label: "Logout",
    text: "text-rose-700 dark:text-rose-300",
  },
  application_submitted: {
    dotBg: "bg-blue-500",
    icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor"><path strokeWidth="2" d="M7 8h10M7 12h10M7 16h10"/><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/></svg>,
    label: "Application Submitted",
    text: "text-blue-700 dark:text-blue-300",
  },
  question_asked: {
    dotBg: "bg-purple-500",
    icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor"><path strokeWidth="2" d="M12 18h.01"/><path strokeWidth="2" d="M8 10a4 4 0 118 0c0 2-4 2-4 4"/></svg>,
    label: "AI Question",
    text: "text-purple-700 dark:text-purple-300",
  },
};

type Session = {
  start?: Interaction;     // login or inferred
  items: Interaction[];    // actions between
  end?: Interaction;       // logout
  startTime?: Date;
  endTime?: Date;
  dateKey: string;         // “September 18, 2025”
  isOpen: boolean;         // no logout yet
};

export default function InteractionTimeline({ interactions }: { interactions: Interaction[] }) {
  // Right-aligned date range filter state (above the timeline)
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // Normalize + sort ASC so sessions build correctly (login -> actions -> logout)
  const normalized = useMemo(() => {
    const arr = (Array.isArray(interactions) ? interactions : []).map((i) => ({
      ...i,
      _d: asDate(i.timestamp),
    }));
    return arr
      .filter((i) => !isNaN(i._d.getTime()))
      .sort((a, b) => a._d.getTime() - b._d.getTime());
  }, [interactions]);

  // Apply date filter (inclusive). If no filter → only latest DATE (not all time).
  const dateFiltered = useMemo(() => {
    if (from || to) {
      const fromD = from ? new Date(from) : null;
      const toD = to ? new Date(to) : null;
      // include whole end day
      if (toD) toD.setHours(23, 59, 59, 999);
      return normalized.filter((i) => {
        const t = i._d.getTime();
        if (fromD && t < fromD.getTime()) return false;
        if (toD && t > toD.getTime()) return false;
        return true;
      });
    }
    // default: latest day only
    const last = normalized[normalized.length - 1];
    if (!last) return [];
    const lastKey = fmtDate(last._d);
    return normalized.filter((i) => fmtDate(i._d) === lastKey);
  }, [normalized, from, to]);

  // Group into sessions per day
  const sessions = useMemo<Session[]>(() => {
    const out: Session[] = [];
    let current: Session | null = null;
    let currentDateKey = "";

    for (const ev of dateFiltered) {
      const evDateKey = fmtDate(ev._d);

      // switch day → flush session if open
      if (evDateKey !== currentDateKey) {
        if (current) {
          // close open session without logout
          current.isOpen = !current.end;
          current.endTime = current.end?._d || current.items[current.items.length - 1]?._d || current.startTime;
          out.push(current);
          current = null;
        }
        currentDateKey = evDateKey;
      }

      // start session on login, or infer if first item isn’t login
      if (ev.type === "login") {
        // close previous open session (same day)
        if (current) {
          current.isOpen = !current.end;
          current.endTime = current.end?._d || current.items[current.items.length - 1]?._d || current.startTime;
          out.push(current);
        }
        current = {
          start: ev,
          items: [],
          dateKey: evDateKey,
          startTime: ev._d,
          isOpen: true,
        };
        continue;
      }

      if (ev.type === "logout") {
        if (!current) {
          // logout without known login → make a tiny session
          current = {
            start: undefined,
            items: [],
            end: ev,
            startTime: undefined,
            endTime: ev._d,
            dateKey: evDateKey,
            isOpen: false,
          };
          out.push(current);
          current = null;
        } else {
          current.end = ev;
          current.endTime = ev._d;
          current.isOpen = false;
          out.push(current);
          current = null;
        }
        continue;
      }

      // activity
      if (!current) {
        // infer session start if first thing is an activity
        current = {
          start: undefined,
          items: [ev],
          startTime: ev._d,
          dateKey: evDateKey,
          isOpen: true,
        };
      } else {
        current.items.push(ev);
      }
    }

    // flush last
    if (current) {
      current.isOpen = !current.end;
      current.endTime = current.end?._d || current.items[current.items.length - 1]?._d || current.startTime;
      out.push(current);
    }

    // sort sessions by startTime ASC within the day (already is, but safe)
    return out.sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));
  }, [dateFiltered]);

  // If default latest-day view, show that date label once; if ranged, show each day section
  const daySections = useMemo(() => {
    const byDay: Record<string, Session[]> = {};
    for (const s of sessions) {
      if (!byDay[s.dateKey]) byDay[s.dateKey] = [];
      byDay[s.dateKey].push(s);
    }
    // keep order by date ASC; we’ll render the latest or the filtered range
    return Object.entries(byDay).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  }, [sessions]);

  return (
    <div className="card p-6 shadow rounded-2xl bg-white dark:bg-gray-800">
      {/* Header with right-aligned date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Interaction Timeline</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            aria-label="From date"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            aria-label="To date"
          />
          {(from || to) ? (
            <button
              onClick={() => { setFrom(""); setTo(""); }}
              className="text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Clear range and show latest day"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {daySections.length === 0 ? (
        <p className="text-gray-400">No interactions for the selected period.</p>
      ) : (
        <>
          {daySections.map(([day, sess]) => (
            <section key={day} className="mb-6">
              {/* Date heading */}
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {day}
                </span>
              </div>

              {/* Sessions for the day */}
              <div className="space-y-4">
                {sess.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-4"
                  >
                    {/* Session header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${TypeStyle.login.dotBg} text-white`}>
                          {TypeStyle.login.icon}
                        </span>
                        <div className="text-sm">
                          <span className={`${TypeStyle.login.text} font-medium`}>{s.start ? "Login" : "Session"}</span>
                          {s.startTime && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">{fmtTime(s.startTime)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {s.end
                          ? `Duration: ${duration(s.startTime || null, s.endTime || null)}`
                          : "Active session"}
                      </div>
                    </div>

                    {/* Tree / timeline for items + logout */}
                    <div className="relative pl-6">
                      {/* vertical line */}
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-gray-300/80 to-gray-300/0 dark:from-gray-700/80 dark:to-gray-700/0" />

                      {/* Activities */}
                      {s.items.map((ev) => {
                            const t = TypeStyle[ev.type];
                            return (
                            <div key={ev.id} className="relative mb-3 group">
                                <span
                                className={`absolute left-0 flex items-center justify-center w-8 h-8 rounded-full ${t.dotBg} text-white ring-8 ring-white dark:ring-gray-900 transition-transform duration-200 group-hover:scale-105`}
                                >
                                {t.icon}
                                </span>
                                <div className="ml-10"> {/* ✅ enough space so content never overlaps */}
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {fmtTime(asDate(ev.timestamp))} ·{" "}
                                    <span className={`${t.text}`}>{t.label}</span>
                                </div>
                                <div className="text-sm text-gray-800 dark:text-gray-100">{ev.details}</div>
                                </div>
                            </div>
                            );
                        })}

                      {/* Logout/end row */}
                      {s.end && (
                        <div className="relative mt-2">
                          <span
                            className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ${TypeStyle.logout.dotBg} text-white ring-8 ring-white dark:ring-gray-900`}
                          >
                            {TypeStyle.logout.icon}
                          </span>
                          <div className="ml-6">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {fmtTime(s.endTime!)} · <span className={`${TypeStyle.logout.text}`}>{TypeStyle.logout.label}</span>
                            </div>
                            <div className="text-sm text-gray-800 dark:text-gray-100">{s.end.details}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
