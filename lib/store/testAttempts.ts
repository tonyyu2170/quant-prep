import type { SessionState } from "@qp/engine";
import type { AttemptRow } from "./types";

// Answered questions only: a skip is strategy in a penalty-scored sim, not a miss (spec §3).
export function attemptRowsFromSession(state: SessionState, sessionId: string, nowIso: string): AttemptRow[] {
  const rows: AttemptRow[] = [];
  state.answers.forEach((answer, i) => {
    if (answer === null) return;
    rows.push({
      problemId: state.items[i].id, problemVersion: 1, seed: state.seed, mode: "test",
      topic: state.items[i].topic, answer: String(answer), correct: state.grades[i],
      timeMs: state.timings[i], sessionId, createdAt: nowIso,
    });
  });
  return rows;
}
