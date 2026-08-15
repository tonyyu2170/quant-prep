import { grade } from "./grade";
import type { Item, Preset } from "./types";

export interface SessionState {
  preset: Preset;
  seed: number;
  items: Item[];
  index: number;
  answers: (number | null)[];
  grades: boolean[];   // parallel to progress; a skip records answer=null, grade=false
  timings: number[];   // ms per question, answered or skipped
  finished: boolean;
}

export interface Summary {
  preset: string; seed: number; score: number;
  correct: number; wrong: number; skipped: number;
  timings: number[]; total: number;
}

export function startSession(preset: Preset, items: Item[], seed: number): SessionState {
  const sliced = items.slice(0, preset.count);
  return { preset, seed, items: sliced, index: 0, answers: [], grades: [], timings: [], finished: sliced.length === 0 };
}

function advance(s: SessionState, answer: number | null, ok: boolean, elapsedMs: number): SessionState {
  if (s.finished) return s;
  const next: SessionState = {
    ...s,
    answers: [...s.answers, answer],
    grades: [...s.grades, ok],
    timings: [...s.timings, elapsedMs],
    index: s.index + 1,
    finished: s.index + 1 >= s.items.length,
  };
  return next;
}

export function answerCurrent(s: SessionState, value: number, elapsedMs: number): SessionState {
  if (s.finished) return s;
  return advance(s, value, grade(value, s.items[s.index].answer), elapsedMs);
}

export function skipCurrent(s: SessionState, elapsedMs: number): SessionState {
  if (s.finished) return s;
  return advance(s, null, false, elapsedMs);
}

export function summarize(s: SessionState): Summary {
  let correct = 0, wrong = 0, skipped = 0;
  s.grades.forEach((g, i) => {
    if (s.answers[i] === null) skipped++;
    else if (g) correct++;
    else wrong++;
  });
  const { scoring } = s.preset;
  return {
    preset: s.preset.id, seed: s.seed,
    score: correct * scoring.correct + wrong * scoring.wrong + skipped * scoring.skip,
    correct, wrong, skipped, timings: s.timings, total: s.grades.length,
  };
}
