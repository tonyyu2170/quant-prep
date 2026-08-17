// Canonical number formatting for statements/walkthroughs — the emitter's
// numbers-in-text audit compares against exactly these strings.
export function fmtNum(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toPrecision(4)));
}
