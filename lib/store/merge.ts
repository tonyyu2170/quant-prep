import type { AttemptRow, TestSessionRow } from "./types";

// Merged local history feeds stats/streaks only — NEVER ranks (spec §7).
export function planMerge(attempts: AttemptRow[], sessions: TestSessionRow[]) {
  return {
    attempts: attempts.map((a) => ({ ...a, mergedFromLocal: true })),
    sessions: sessions.map((s) => ({ ...s, mergedFromLocal: true })),
  };
}
