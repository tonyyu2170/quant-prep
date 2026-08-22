import type { Preset } from "./types";

export const PRESETS: Record<string, Preset> = {
  "optiver-80in8": {
    id: "optiver-80in8",
    title: "Optiver-style 80 in 8",
    topic: "arithmetic",
    count: 80,
    durationS: 480,
    scoring: { correct: 1, wrong: -2, skip: 0 },
    difficulty: (i) => (i < 20 ? 1 : i < 55 ? 2 : 3),
  },
  // Their real Optiver 80-in-8 is four-way multiple choice with a blanked slot, not free entry —
  // see docs/research/quantprof-2026-08/optiver-80.txt. `optiver-80in8` above is a Zetamac-style
  // sprint that predates that finding; both are kept so stored runs stay comparable.
  "optiver-mc-80in8": {
    id: "optiver-mc-80in8",
    title: "Optiver 80 in 8 (multiple choice)",
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
