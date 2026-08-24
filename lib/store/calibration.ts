import type { CalibrationResult } from "@qp/engine";

/** Calibration is a CROSS-SESSION statistic — a hit rate over one 8-question sitting is noise.
 *  Local only in v1: no Supabase, no migration (spec §10). */
export const CAL_KEY = "qp.calibration.v1";

export function readCalibration(): CalibrationResult[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const rows = JSON.parse(localStorage.getItem(CAL_KEY) ?? "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return []; // corrupt storage loses history; it must never break the page
  }
}

export function appendAnswers(rows: readonly CalibrationResult[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CAL_KEY, JSON.stringify([...readCalibration(), ...rows]));
}

export function clearCalibration(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(CAL_KEY);
}
