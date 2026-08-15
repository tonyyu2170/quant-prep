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
for (const p of Object.values(PRESETS)) Object.freeze(p);

export function getPreset(id: string): Preset | null {
  return Object.hasOwn(PRESETS, id) ? PRESETS[id] : null;
}
