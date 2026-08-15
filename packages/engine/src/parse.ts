export function parseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/,/g, "");
  if (s === "") return null;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const num = Number(frac[1]), den = Number(frac[2]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}
