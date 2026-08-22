import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import { mergeReviews, planMerge } from "./merge";
import { attemptRowsFromSession } from "./testAttempts";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AttemptRow, ReviewRow, Store, TestSessionRow } from "./types";
import { enqueue, type Preset, type SessionState, type Summary } from "@qp/engine";

const MERGED_FLAG = "qp.merged.v1";
let cached: { store: Store; signedIn: boolean } | null = null;
let resolving: Promise<{ store: Store; signedIn: boolean }> | null = null;

const uuid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

async function mergeLocalIntoRemote(local: LocalStore, remote: SupabaseStore): Promise<void> {
  const plan = planMerge(await local.listAttempts(), await local.listSessions());
  if (plan.attempts.length) await remote.saveAttempts(plan.attempts);
  for (const s of plan.sessions) await remote.saveSession(s);
  for (const r of mergeReviews(await local.listReviews(), await remote.listReviews())) await remote.saveReview(r);
  localStorage.setItem(MERGED_FLAG, "1");
  await local.clear();
}

export async function resolveStore(): Promise<{ store: Store; signedIn: boolean }> {
  if (cached) return cached;
  if (resolving) return resolving; // one auth+merge per page load, even under concurrent writes
  resolving = (async () => {
    const local = new LocalStore();
    try {
      const supa = supabaseBrowser();
      const { data } = await supa.auth.getUser();
      if (!data.user) return (cached = { store: local, signedIn: false });
      const remote = new SupabaseStore(supa, data.user.id);
      if (!localStorage.getItem(MERGED_FLAG)) {
        try {
          await mergeLocalIntoRemote(local, remote);
        } catch { /* partial merge: flag stays unset, retried next load; stay signed in (spec §8) */ }
      }
      return (cached = { store: remote, signedIn: true });
    } catch {
      return { store: local, signedIn: false }; // backend unreachable → local, never block
    } finally {
      resolving = null; // successes served by `cached`; the catch path retries next call
    }
  })();
  return resolving;
}

async function saveWithFallback(fn: (s: Store) => Promise<void>, fallback: (l: LocalStore) => Promise<void>): Promise<void> {
  const { store, signedIn } = await resolveStore();
  try {
    await fn(store);
  } catch {
    if (signedIn) {
      try {
        await fallback(new LocalStore());
        localStorage.removeItem(MERGED_FLAG); // re-merge these rows on next load
      } catch { /* local also failed: drop */ }
    }
  }
}

export function getStore(): Store {
  return {
    saveAttempts: (rows: AttemptRow[]) =>
      saveWithFallback((s) => s.saveAttempts(rows), (l) => l.saveAttempts(rows)),
    saveSession: (row: TestSessionRow) =>
      saveWithFallback((s) => s.saveSession(row), (l) => l.saveSession(row)),
    saveReview: (row: ReviewRow) =>
      saveWithFallback((s) => s.saveReview(row), (l) => l.saveReview({ ...row, pending: true })),
    async removeReview(problemId: string) {
      // Best-effort: a failed delete leaves the row queued, which the next load shows again.
      try { await (await resolveStore()).store.removeReview(problemId); } catch { /* studying never blocks */ }
    },
    async listAttempts() { return (await resolveStore()).store.listAttempts(); },
    async listSessions() { return (await resolveStore()).store.listSessions(); },
    async listReviews() { return (await resolveStore()).store.listReviews(); },
  };
}

/**
 * Intake: due now at interval 1, preserving ease already earned.
 *
 * Content-bank problem ids only. Spec §6 also wants sims and the arithmetic/sequences drills to
 * enqueue on a miss, but generator `Item.id`s are instance-level (`arith-mul-7-13`,
 * `seq-fib-2_3_5_8`) — not the stable per-concept ids §6 assumes when it says reviews
 * "regenerate from their generator ids". Queuing those would store one row per instance and
 * re-ask the identical numbers. Needs a family-key convention before it can be wired.
 */
export async function enqueueReview(problemId: string): Promise<void> {
  const store = getStore();
  const existing = (await store.listReviews()).find((r) => r.problemId === problemId) ?? null;
  await store.saveReview(enqueue(problemId, new Date(), existing));
}

export async function saveRun(preset: Preset, summary: Summary, state: SessionState): Promise<void> {
  const row: TestSessionRow = {
    id: uuid(), preset: preset.id, score: summary.score,
    correct: summary.correct, wrong: summary.wrong, skipped: summary.skipped,
    durationS: preset.durationS, timings: summary.timings, total: preset.count,
    createdAt: new Date().toISOString(),
  };
  const store = getStore();
  await store.saveSession(row);
  const attempts = attemptRowsFromSession(state, row.id, row.createdAt);
  if (attempts.length) await store.saveAttempts(attempts);
}
