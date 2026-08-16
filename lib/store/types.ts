export interface AttemptRow {
  problemId: string; problemVersion: number; seed: number;
  mode: "practice" | "test" | "review";
  topic: string; answer: string; correct: boolean; timeMs: number;
  sessionId: string | null; createdAt: string;
  mergedFromLocal?: boolean;
}

export interface TestSessionRow {
  id: string; preset: string; score: number;
  correct: number; wrong: number; skipped: number;
  durationS: number; timings: number[]; createdAt: string;
  total?: number; // configured question count for the run; absent on rows saved before Phase 1.5
  mergedFromLocal?: boolean;
}

export interface Store {
  saveAttempts(rows: AttemptRow[]): Promise<void>;
  saveSession(row: TestSessionRow): Promise<void>;
  listAttempts(): Promise<AttemptRow[]>;
  listSessions(): Promise<TestSessionRow[]>;
}
