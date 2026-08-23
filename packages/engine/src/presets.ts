import type { Preset } from "./types";

export const PRESETS: Record<string, Preset> = {
  "optiver-80in8": {
    id: "optiver-80in8",
    title: "80 in 8 — free-entry numerical sprint",
    topic: "arithmetic",
    count: 80,
    durationS: 480,
    scoring: { correct: 1, wrong: -2, skip: 0 },
    difficulty: (i) => (i < 20 ? 1 : i < 55 ? 2 : 3),
  },
  // Their real Optiver 80-in-8 is four-way multiple choice with a blanked slot, not free entry —
  // see docs/research/quantprof-2026-08/optiver-80.txt. `optiver-80in8` above is a Zetamac-style
  // sprint that predates that finding, and its ID is deliberately NOT being corrected: the slug
  // is an identifier, persisted in test_sessions.preset and in every visitor's localStorage, and
  // renaming it would drop their own sim history off the stats chart to fix something only the
  // URL shows. The titles carry the truth instead — ruled 2026-08-23.
  "optiver-mc-80in8": {
    id: "optiver-mc-80in8",
    title: "Optiver 80 in 8 — their real format",
    topic: "missing-operand",
    count: 80,
    durationS: 480,
    scoring: { correct: 1, wrong: -2, skip: 0 },
    difficulty: (i) => (i < 20 ? 1 : i < 55 ? 2 : 3),
  },
  "sequences-sprint": {
    id: "sequences-sprint",
    title: "Sequences Sprint (20 in 8)",
    topic: "sequences",
    count: 20,
    durationS: 480,
    scoring: { correct: 1, wrong: 0, skip: 0 },
    difficulty: (i) => (i < 7 ? 1 : i < 14 ? 2 : 3),
  },
};

Object.freeze(PRESETS);
for (const p of Object.values(PRESETS)) { Object.freeze(p); Object.freeze(p.scoring); }

export function getPreset(id: string): Preset | null {
  return Object.hasOwn(PRESETS, id) ? PRESETS[id] : null;
}
