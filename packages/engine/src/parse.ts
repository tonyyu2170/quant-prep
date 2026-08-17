const MAX_LEN = 64;

// Recursive-descent evaluator for drill answers (spec §4): numbers, %, + − × / ^, parens.
// No eval; unparseable input returns null so the drill can show a hint instead of grading.
export function parseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/[−‒–—―]/g, "-").replace(/,/g, "").replace(/\s*([+\-*/^×])\s*/g, "$1");
  if (s === "" || s.length > MAX_LEN) return null;
  const p = new Parser(s);
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
