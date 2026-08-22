// SM-2-lite spaced repetition over the existing review_queue columns (phase 1.5 spec §6).
export interface ReviewRow {
  problemId: string;
  dueAt: string; // ISO
  intervalDays: number;
  ease: number;
}

export const EASE_START = 2.5;
export const EASE_MAX = 2.8;
export const EASE_MIN = 1.3;
// A problem held for a year is effectively retired; the cap also keeps interval_days inside int4.
export const INTERVAL_MAX_DAYS = 365;

const DAY_MS = 86_400_000;
const clamp = (e: number) => Math.min(EASE_MAX, Math.max(EASE_MIN, Number(e.toFixed(4))));
const dueIn = (days: number, now: Date) => new Date(now.getTime() + days * DAY_MS).toISOString();

/** Intake, auto (missed in a drill or sim) or manual: due now at interval 1, keeping any earned ease. */
export function enqueue(problemId: string, now: Date, existing?: ReviewRow | null): ReviewRow {
  return { problemId, dueAt: now.toISOString(), intervalDays: 1, ease: existing?.ease ?? EASE_START };
}

/** Grading a review: correct stretches the interval by ease, wrong collapses it to a day. */
export function review(row: ReviewRow, correct: boolean, now: Date): ReviewRow {
  // +1 floor because round(1 x 1.3) === 1 — at the ease floor, rounding alone never advances.
  const intervalDays = correct
    ? Math.min(INTERVAL_MAX_DAYS, Math.max(row.intervalDays + 1, Math.round(row.intervalDays * row.ease)))
    : 1;
  const ease = clamp(correct ? row.ease + 0.05 : row.ease - 0.2);
  return { problemId: row.problemId, dueAt: dueIn(intervalDays, now), intervalDays, ease };
}

export const isDue = (row: ReviewRow, now: Date) => Date.parse(row.dueAt) <= now.getTime();
