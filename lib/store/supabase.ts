import { supabaseBrowser } from "@/lib/supabase/client";
import type { AttemptRow, Store, TestSessionRow } from "./types";

type Client = ReturnType<typeof supabaseBrowser>;

const toAttempt = (r: AttemptRow, userId: string) => ({
  user_id: userId, problem_id: r.problemId, problem_version: r.problemVersion,
  seed: r.seed, mode: r.mode, topic: r.topic, answer: r.answer, correct: r.correct,
  time_ms: r.timeMs, session_id: r.sessionId, merged_from_local: r.mergedFromLocal ?? false,
  created_at: r.createdAt,
});
const toSession = (r: TestSessionRow, userId: string) => ({
  id: r.id, user_id: userId, preset: r.preset, score: r.score, correct: r.correct,
  wrong: r.wrong, skipped: r.skipped, duration_s: r.durationS, timings: r.timings,
  merged_from_local: r.mergedFromLocal ?? false, created_at: r.createdAt,
});

export class SupabaseStore implements Store {
  constructor(private client: Client, private userId: string) {}

  async saveAttempts(rows: AttemptRow[]) {
    const { error } = await this.client.from("attempts").insert(rows.map((r) => toAttempt(r, this.userId)));
    if (error) throw error;
  }
  async saveSession(row: TestSessionRow) {
    const { error } = await this.client.from("test_sessions").upsert(toSession(row, this.userId), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }
  async listAttempts(): Promise<AttemptRow[]> {
    const { data, error } = await this.client.from("attempts").select("*").order("created_at", { ascending: false }).limit(5000);
    if (error) throw error;
    return [...(data ?? [])].reverse().map((d) => ({
      problemId: d.problem_id, problemVersion: d.problem_version, seed: d.seed, mode: d.mode,
      topic: d.topic, answer: d.answer, correct: d.correct, timeMs: d.time_ms,
      sessionId: d.session_id, createdAt: d.created_at, mergedFromLocal: d.merged_from_local,
    }));
  }
  async listSessions(): Promise<TestSessionRow[]> {
    const { data, error } = await this.client.from("test_sessions").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((d) => ({
      id: d.id, preset: d.preset, score: d.score, correct: d.correct, wrong: d.wrong,
      skipped: d.skipped, durationS: d.duration_s, timings: d.timings, createdAt: d.created_at,
      mergedFromLocal: d.merged_from_local,
    }));
  }
}
