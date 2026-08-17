// Canonical number formatting for statements/walkthroughs — the emitter's
// numbers-in-text audit compares against exactly these strings.
// Decimal-safe window ~[1e-6, 1e15]; values outside render exponentially ("5e-7") — emitter flags those.
export function fmtNum(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toPrecision(4)));
}
