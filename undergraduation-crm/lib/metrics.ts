// lib/metrics.ts
import {
  collection, query, where, orderBy, limit, getDocs,
  doc, getDoc, setDoc, Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

/** Heuristics you can tweak anytime */
const ESSAY_KEYWORDS = [
  "essay","sop","personal statement","motivation letter","statement of purpose","draft"
];

function ts(d: Date | number) {
  return Timestamp.fromDate(d instanceof Date ? d : new Date(d));
}

export async function updateMetricsForStudent(studentId: string) {
  // Latest communication time
  const commRef = collection(db, "communications");
  const qComm = query(
    commRef,
    where("studentId", "==", studentId),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const commSnap = await getDocs(qComm);
  const lastContactAt: any = commSnap.empty
    ? ts(0)  // 1970-01-01 to let "not contacted" filters catch it
    : commSnap.docs[0].data().timestamp ?? ts(0);

  // Interactions (last 14 days): count AI questions
  const interactionsRef = collection(db, "interactions");
  const since14 = ts(Date.now() - 14 * 86400000);
  const qInter = query(
    interactionsRef,
    where("studentId", "==", studentId),
    where("timestamp", ">=", since14)
  );
  const interSnap = await getDocs(qInter);
  const aiQuestions = interSnap.docs.filter(d => d.data().type === "question_asked").length;

  // Applications (last 30 days)
  const appsRef = collection(db, "applications");
  const since30 = ts(Date.now() - 30 * 86400000);
  const qApps = query(
    appsRef,
    where("studentId", "==", studentId),
    where("time", ">=", since30)
  );
  const appsSnap = await getDocs(qApps);
  const apps30 = appsSnap.size;

  // Latest application status (for the table/insights)
  const qLatestApp = query(
    appsRef,
    where("studentId", "==", studentId),
    orderBy("time", "desc"),
    limit(1)
  );
  const latestAppSnap = await getDocs(qLatestApp);
  const latestApplicationStatus = latestAppSnap.empty
    ? null
    : (latestAppSnap.docs[0].data().status ?? null);

  // Needs essay help? (keywords in recent interactions/communications)
  let needsEssayHelp = false;
  // Check up to 10 recent communications for keywords
  const qComm10 = query(
    commRef,
    where("studentId", "==", studentId),
    orderBy("timestamp", "desc"),
    limit(10)
  );
  const comm10 = await getDocs(qComm10);
  const haystacks: string[] = [];
  interSnap.docs.forEach(d => {
    const s = (d.data().details || "").toString().toLowerCase();
    if (s) haystacks.push(s);
  });
  comm10.docs.forEach(d => {
    const x = d.data() as any;
    const s = `${x.subject ?? ""} ${x.content ?? ""}`.toLowerCase();
    if (s.trim()) haystacks.push(s);
  });
  needsEssayHelp = haystacks.some(s => ESSAY_KEYWORDS.some(k => s.includes(k)));

  // Student lastLogin
  const stuDoc = await getDoc(doc(db, "students", studentId));
  const lastLogin = stuDoc.exists() ? (stuDoc.data().lastLogin ?? null) : null;

  // Intent score (tweak freely)
  // - apps past 30d weighted 3
  // - AI Q past 14d weighted 2
  // - recent login (<7d) +2
  // - recent contact exists +1
  const recentLoginBoost = lastLogin && (Date.now() - lastLogin.toDate().getTime() < 7*86400000) ? 2 : 0;
  const recentContactBoost = commSnap.empty ? 0 : 1;
  const intentScore = apps30 * 3 + aiQuestions * 2 + recentLoginBoost + recentContactBoost;

  await setDoc(doc(db, "student_metrics", studentId), {
    studentId,
    lastContactAt,
    intentScore,
    needsEssayHelp,
    latestApplicationStatus,
    lastLogin: lastLogin ?? null,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

/** Optional: batch rebuild for all current students (one-off) */
export async function rebuildAllMetrics() {
  const snap = await getDocs(collection(db, "students"));
  for (const s of snap.docs) {
    await updateMetricsForStudent(s.id);
  }
}
