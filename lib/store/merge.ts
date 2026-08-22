import type { AttemptRow, ReviewRow, TestSessionRow } from "./types";

// Merged local history feeds stats/streaks only — NEVER ranks (spec §7).
export function planMerge(attempts: AttemptRow[], sessions: TestSessionRow[]) {
  return {
    attempts: attempts.map((a) => ({ ...a, mergedFromLocal: true })),
    sessions: sessions.map((s) => ({ ...s, mergedFromLocal: true })),
  };
}

// Queue merge on sign-in: dedupe by problemId, keep the EARLIER due date (spec §6).
// Returns only the rows the remote queue needs written; rows it already schedules sooner are left alone.
export function mergeReviews(local: ReviewRow[], remote: ReviewRow[]): ReviewRow[] {
  const byId = new Map(remote.map((r) => [r.problemId, r]));
  return local.filter((l) => {
    const r = byId.get(l.problemId);
    if (!r) return true;
    // A grade parked by a failed remote write is a retry, and its next due date is deliberately
    // LATER than the stale remote row — "earlier wins" would drop it and lose the grade.
    if (l.pending) return true;
    return Date.parse(l.dueAt) < Date.parse(r.dueAt);
  });
}
