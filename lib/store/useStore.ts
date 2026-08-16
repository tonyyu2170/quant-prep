import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import { planMerge } from "./merge";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AttemptRow, Store, TestSessionRow } from "./types";
import type { Preset, Summary } from "@qp/engine";

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
    async listAttempts() { return (await resolveStore()).store.listAttempts(); },
    async listSessions() { return (await resolveStore()).store.listSessions(); },
  };
}

export async function saveRun(preset: Preset, summary: Summary): Promise<void> {
  const row: TestSessionRow = {
    id: uuid(), preset: preset.id, score: summary.score,
    correct: summary.correct, wrong: summary.wrong, skipped: summary.skipped,
    durationS: preset.durationS, timings: summary.timings, createdAt: new Date().toISOString(),
  };
  await getStore().saveSession(row);
}
