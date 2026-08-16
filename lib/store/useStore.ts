import { LocalStore } from "./local";
import type { Store, TestSessionRow } from "./types";
import type { Preset, Summary } from "@qp/engine";

export function getStore(): Store {
  return new LocalStore();
}

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function saveRun(preset: Preset, summary: Summary): Promise<void> {
  const row: TestSessionRow = {
    id: uuid(),
    preset: preset.id,
    score: summary.score,
    correct: summary.correct,
    wrong: summary.wrong,
    skipped: summary.skipped,
    durationS: preset.durationS,
    timings: summary.timings,
    createdAt: new Date().toISOString(),
  };
  await getStore().saveSession(row);
}
