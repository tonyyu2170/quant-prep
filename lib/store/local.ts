import type { AttemptRow, ReviewRow, Store, TestSessionRow } from "./types";

const A_KEY = "qp.attempts.v1";
const S_KEY = "qp.sessions.v1";
const R_KEY = "qp.reviews.v1";
const CAP = 5000;

function read<T>(key: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? (v as T[]) : [];
  } catch { return []; }
}
function write<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

export class LocalStore implements Store {
  async saveAttempts(rows: AttemptRow[]) {
    const all = [...read<AttemptRow>(A_KEY), ...rows];
    write(A_KEY, all.slice(-CAP));
  }
  async saveSession(row: TestSessionRow) {
    write(S_KEY, [...read<TestSessionRow>(S_KEY), row]);
  }
  async listAttempts() { return read<AttemptRow>(A_KEY); }
  async listSessions() { return read<TestSessionRow>(S_KEY); }
  async listReviews() { return read<ReviewRow>(R_KEY); }
  async saveReview(row: ReviewRow) {
    const rest = read<ReviewRow>(R_KEY).filter((r) => r.problemId !== row.problemId);
    write(R_KEY, [...rest, row]);
  }
  async removeReview(problemId: string) {
    write(R_KEY, read<ReviewRow>(R_KEY).filter((r) => r.problemId !== problemId));
  }
  async clear() { localStorage.removeItem(A_KEY); localStorage.removeItem(S_KEY); localStorage.removeItem(R_KEY); }
}
