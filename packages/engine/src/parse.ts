const NUM = String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)`;
const FRACTION = new RegExp(`^(${NUM})/(${NUM})$`);
const PLAIN = new RegExp(`^${NUM}$`);

// Plain answer parser: numbers and simple fractions only. Used by timed drills to prevent
// typed-expression cheating (e.g. typing "17*23" for a timed problem asking "17 × 23").
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

const MAX_LEN = 64;

// Expression evaluator for drill answers (spec §4): numbers, %, + − × / ^, parens.
// Full arithmetic expressions with operator precedence. No eval; unparseable input
// returns null so the drill can show a hint instead of grading.
export function parseAnswerExpr(raw: string): number | null {
  const s = raw.trim().replace(/[−‒–—―]/g, "-").replace(/,/g, "");
  // Whitespace is stripped only adjacent to operators/parens, so junk like "1 2" stays rejected while spaced expressions work.
  const t = s.replace(/\s*([()+\-*/^×%])\s*/g, "$1");
  if (t === "" || t.length > MAX_LEN) return null;
  const p = new Parser(t);
  const v = p.parseExpr();
  return v !== null && p.done() && Number.isFinite(v) ? v : null;
}

class Parser {
  private i = 0;
  constructor(private s: string) {}
  done() { return this.i >= this.s.length; }
  private peek() { return this.s[this.i]; }
  parseExpr(): number | null {
    let v = this.parseTerm();
    if (v === null) return null;
    while (this.peek() === "+" || this.peek() === "-") {
      const op = this.s[this.i++];
      const r = this.parseTerm();
      if (r === null) return null;
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  private parseTerm(): number | null {
    let v = this.parseFactor();
    if (v === null) return null;
    while (this.peek() === "*" || this.peek() === "/" || this.peek() === "×") {
      const op = this.s[this.i++];
      const r = this.parseFactor();
      if (r === null) return null;
      if (op === "/") {
        if (r === 0) return null;
        v = v / r;
      } else v = v * r;
    }
    return v;
  }
  private parseFactor(): number | null {
    const v = this.parseUnary();
    if (v === null) return null;
    if (this.peek() === "^") {
      this.i++;
      const e = this.parseFactor(); // right-associative
      return e === null ? null : Math.pow(v, e);
    }
    return v;
  }
  private parseUnary(): number | null {
    // Unary minus binds tighter than ^ (Excel convention): -2^2 = (-2)^2 = 4, not -(2^2) = -4.
    if (this.peek() === "-") { this.i++; const v = this.parseUnary(); return v === null ? null : -v; }
    if (this.peek() === "+") { this.i++; return this.parseUnary(); }
    return this.parseBase();
  }
  private parseBase(): number | null {
    if (this.peek() === "(") {
      this.i++;
      const v = this.parseExpr();
      if (v === null || this.peek() !== ")") return null;
      this.i++;
      return this.percent(v);
    }
    const m = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(this.s.slice(this.i));
    if (!m) return null;
    this.i += m[0].length;
    return this.percent(Number(m[0]));
  }
  private percent(v: number): number {
    if (this.peek() === "%") { this.i++; return v / 100; }
    return v;
  }
}
