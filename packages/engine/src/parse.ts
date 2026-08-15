const NUM = String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)`;
const FRACTION = new RegExp(`^(${NUM})/(${NUM})$`);
const PLAIN = new RegExp(`^${NUM}$`);

export function parseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/[−‒–—―]/g, "-").replace(/,/g, "").replace(/\s*\/\s*/, "/");
  if (s === "") return null;
  const frac = s.match(FRACTION);
  if (frac) {
    const num = Number(frac[1]), den = Number(frac[2]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  if (!PLAIN.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}
