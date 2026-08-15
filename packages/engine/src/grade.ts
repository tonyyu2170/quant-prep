import type { Tolerance } from "./types";

export function grade(given: number, expected: number, tol: Tolerance = {}): boolean {
  if (!Number.isFinite(given)) return false;
  if (tol.rel === undefined && tol.abs === undefined) return given === expected;
  const bound = Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(expected));
  return Math.abs(given - expected) <= bound;
}
