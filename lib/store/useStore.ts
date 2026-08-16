import { LocalStore } from "./local";
import type { Store, TestSessionRow } from "./types";
import type { Preset, Summary } from "@qp/engine";

export function getStore(): Store {
  return new LocalStore();
}

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
