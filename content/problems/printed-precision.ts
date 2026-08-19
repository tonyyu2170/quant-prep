// The printed-precision reader: the machinery behind content/problems/printed-precision.test.ts,
// in a plain module so it can be called from anywhere. It lived inside the test file until the
// third time someone wanted to point it at a subset of the corpus as a diagnostic and found
// that importing it also imported vitest, which only resolves inside a test run.
//
// Contract 6, enforced on the rendered page rather than on the template's floats.
//
// Every "$...=...$" and every "$... > ...$" a learner sees is a claim about printed numbers.
// This reader re-evaluates each one USING ONLY THE PRINTED LITERALS and requires the claim to
// hold at displayed precision. Checking the underlying floats instead is precisely what let a
// real defect ship: the floats reconciled exactly while the rendered decimals did not, on a
// quarter of that template's draws, and a float-based sweep reported all-green.
import { fmtNum } from "@qp/engine";

const factorial = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const choose = (n: number, k: number) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
};

/** Arithmetic left after every recognised construct has been expanded to digits and operators. */
const ARITHMETIC_ONLY = /^[\d\s+\-*/().]*$/;

function evalArith(e: string): number | null {
  if (!ARITHMETIC_ONLY.test(e)) return null;
  try {
    const v = Function(`"use strict";return (${e});`)() as number;
    return Number.isFinite(v) ? v : null;
  } catch { return null; }
}

/** Evaluate one side of a printed chain from its printed literals. `null` = not evaluable. */
export function evalTex(expr: string): number | null {
  let e = expr.trim();
  // "1+2+\cdots+N" is one of two elided forms in the corpus: the Nth triangular number.
  const tri = e.match(/^1\+2\+\\cdots\+(\d+)$/);
  if (tri) { const n = Number(tri[1]); return (n * (n + 1)) / 2; }
  // "n x (n-1) x \\cdots x m" — a falling product, the other elided form. The middle factor is
  // required to be n-1 so a run that does not actually descend by one is left unreadable.
  const fall = e.match(/^(\d+)\\times(\d+)\\times\\cdots\\times(\d+)$/);
  if (fall) {
    const [n, mid, m] = fall.slice(1).map(Number);
    if (mid === n - 1 && m <= mid) { let r = 1; for (let i = m; i <= n; i++) r *= i; return r; }
    return null;
  }
  if (e.includes("\\cdots")) return null;
  // \frac, \binom, \sqrt and ^ are expanded in ONE interleaved loop, innermost-first. Running
  // them as sequential passes instead resolves a fraction under a root but NOT a root under a
  // fraction: the outer \frac's [^{}]* group cannot span the inner \sqrt's braces, so the
  // fraction is still unexpanded by the time the \sqrt pass ends and the segment reports
  // unevaluable. \sqrt and ^ are written as ** rather than Math.pow so the expression stays
  // inside ARITHMETIC_ONLY — letters are what mark an unrecognised form.
  let prev = "";
  while (e !== prev) {
    prev = e;
    e = e
      .replace(/\\(?:dfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g, "(($1)/($2))")
      .replace(/\\sqrt\{([^{}]*)\}/g, "(($1)**0.5)")
      // \binom is folded to its integer value rather than to an operator expression, so both
      // arguments must already be whole numbers; a symbolic \binom{n}{k} is left standing and
      // is then read as notation, not silently dropped.
      .replace(/\\binom\{([^{}]*)\}\{([^{}]*)\}/g, (m, a: string, b: string) => {
        const n = evalArith(a), k = evalArith(b);
        if (n === null || k === null || !Number.isInteger(n) || !Number.isInteger(k)) return m;
        return `(${choose(n, k)})`;
      })
      .replace(/\^\{([^{}]*)\}/g, "**($1)")
      .replace(/\^(\d)/g, "**($1)");
  }
  e = e.replace(/\\times/g, "*").replace(/\\left|\\right/g, "");
  e = e.replace(/(\d+)!/g, (_m, n: string) => String(factorial(Number(n))));
  return evalArith(e); // an unrecognised form is a coverage hole, not a pass
}

// The LaTeX commands this corpus uses, and only those. A side that still carries a command
// outside this set is reported unevaluable rather than assumed inert: an unfamiliar command
// could be wrapping arithmetic the reader never saw. Adding one here is a deliberate act.
//
// BEFORE YOU ADD ONE: this set holds two kinds of command, and only one of them is safe to
// extend by name alone. Most are inert — removing "\mid" or "\cap" can only take away
// structure, never the letters that decide whether isLabel calls a side notation. "\text" is
// not: its letters come from its own braces, so left unguarded it lets prose vouch for
// operands printed beside it, and "0.4\text{ of }0.5=0.25" reads as notation while printing
// two real numbers. isLabel handles that with TEXT_GROUP. Any command that likewise carries
// arbitrary prose — \mathrm, \operatorname, \mbox — needs the same treatment before it goes
// in here, or it reopens that hole. Today they are absent and so fail loud, which is the
// behaviour to preserve until one is deliberately admitted.
//
// "\leq" is deliberately absent even though splitClaim reads it as a relation: the corpus
// prints none, and a nested one should fail loud rather than be quietly excused.
const RECOGNISED_CMD = /\\(?:dfrac|frac|binom|sqrt|times|cdots|left|right|mid|text|bar|cap|max|geq|sigma|,)/g;

/** Prose set in \text{...}, the one recognised command whose own content supplies letters. */
const TEXT_GROUP = /\\text\{[^{}]*\}/g;

/**
 * True when a side names a quantity instead of printing one — "P(D\mid +)", "\text{odds}(S)",
 * "\dfrac{P(+\mid D)\,P(D)}{P(+)}". Such a side asserts no arithmetic over printed literals, so
 * there is nothing for a learner to recompute and nothing for this gate to reconcile.
 *
 * The test is a surviving letter, not an absence of digits: "\binom{52}{5}" reduces to braces
 * and digits and so is NOT a label (it is arithmetic the reader must actually read), while
 * "\binom{n}{k}" keeps its letters and is. Any unrecognised command disqualifies the side
 * outright, whatever letters it holds.
 *
 * \text{...} needs a guard the other commands do not, because its letters come from its own
 * content rather than from the expression around it. Left to vouch for a side, prose in braces
 * would carry real operands past this gate unread: "0.4\text{ of }0.5=0.25" would count as
 * notation, and so would "12\text{ cm}\times2=25\text{ cm}", which is false. So the group is
 * transparent exactly when a numeral survives OUTSIDE it — the side is then printing an operand
 * and the prose may not speak for it — and opaque otherwise, which is what leaves "\text{LR}",
 * "\text{odds}(\text{win})" and "P(\text{2 bad}\mid A)" reading as the pure notation they are.
 * Letters outside the braces still count either way: "2\times P(\text{win})" stays a label on
 * the strength of its P.
 */
export function isLabel(side: string): boolean {
  const outsideText = side.replace(TEXT_GROUP, " ");
  const printsAnOperand = /\d/.test(outsideText);
  const rest = (printsAnOperand ? outsideText : side).replace(RECOGNISED_CMD, " ");
  if (rest.includes("\\")) return false;
  return /[A-Za-z]/.test(rest);
}

/** What a relation asserts between the value on its left and the value on its right. */
export type Rel = "EQ" | "GT" | "GE" | "LT" | "LE";

// "\propto" relates the same two values up to a shared factor, so the arithmetic printed on
// either side of it still has to reconcile — it is a relation, not decoration.
const RELATIONS: [string, Rel][] = [
  ["=", "EQ"], ["\\propto", "EQ"], ["\\geq", "GE"], ["\\leq", "LE"], [">", "GT"], ["<", "LT"],
];

export interface Claim {
  /** the expressions between the relations, one more of these than there are relations */
  sides: string[];
  /** relations[i] is asserted between sides[i] and sides[i+1] */
  relations: Rel[];
}

/**
 * Split a segment at the relations that assert something about value, ignoring any inside a
 * brace or paren group: the "=" in "P(\max=3\mid\ldots)" names an event, it does not join two
 * expressions, and splitting there tears the notation into two unreadable halves. `null`
 * means the delimiters do not balance, which is reported rather than guessed at.
 *
 * A direction claim is the same machinery as an equality claim, not new machinery: both sides
 * of "$0.6667 > 0.2$" are printed literals, and a learner reads them off the page exactly as
 * they read "$0.1391\times0.85=0.1182$".
 */
export function splitClaim(seg: string): Claim | null {
  const sides: string[] = [];
  const relations: Rel[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < seg.length; i++) {
    const c = seg[i];
    if (c === "{" || c === "(") { depth++; continue; }
    if (c === "}" || c === ")") { depth--; if (depth < 0) return null; continue; }
    if (depth !== 0) continue;
    const hit = RELATIONS.find(([tok]) => seg.startsWith(tok, i));
    if (!hit) continue;
    sides.push(seg.slice(start, i));
    relations.push(hit[1]);
    i += hit[0].length - 1;
    start = i + 1;
  }
  if (depth !== 0) return null;
  sides.push(seg.slice(start));
  return { sides, relations };
}

/**
 * The relation implied by following one relation with another, so a label standing between two
 * printed numbers does not hide the claim they make about each other: in
 * "$P(A\mid RR)=0.08551<0.5$" the "=" and the "<" compose to "<" between 0.08551 and 0.5.
 * `null` where nothing follows — "$a>b<c$" says nothing about a against c.
 */
export function compose(a: Rel, b: Rel): Rel | null {
  if (a === "EQ") return b;
  if (b === "EQ") return a;
  const rising = (r: Rel) => r === "GT" || r === "GE";
  if (rising(a) !== rising(b)) return null;
  if (rising(a)) return a === "GT" || b === "GT" ? "GT" : "GE";
  return a === "LT" || b === "LT" ? "LT" : "LE";
}

export interface ChainAudit {
  /** a chain whose sides do not render to the same string — a false claim on the page */
  mismatches: string[];
  /** a chain the evaluator could not read: never counts as a pass, always reported */
  unevaluable: string[];
  /** segments asserting no arithmetic over printed literals, so there is nothing to reconcile */
  claimFree: number;
  checked: number;
  segments: number;
}

/** Every rendering a value could legitimately take, allowing for a rounding boundary. */
function atBoundaryEitherWay(v: number): Set<string> {
  // fmtNum prints an integer in full and everything else at four significant figures, so a
  // whole number has exactly one rendering and must never be nudged off it — perturbing
  // 2598960 would offer "2599000" as an alternative and let 2598961 pass against it.
  if (Number.isInteger(v)) return new Set([fmtNum(v)]);
  const eps = 1e-11;
  const out = new Set([fmtNum(v)]);
  for (const w of [v * (1 + eps), v * (1 - eps)]) if (!Number.isInteger(w)) out.add(fmtNum(w));
  return out;
}

const intersects = (sets: Set<string>[]) =>
  [...sets[0]].some((s) => sets.every((other) => other.has(s)));

/**
 * Whether a direction claim holds between two values AS THE PAGE PRINTS THEM. The comparison is
 * on the rendered numbers, not the underlying floats, because the rendered numbers are what a
 * learner reads: two values a hair apart that both print 0.3333 make "$0.3333 > 0.3333$" a
 * false line on the page whatever the floats say. That is why a strict claim gets no boundary
 * allowance — where the "=" case forgives two readings of one number, here rendering equal IS
 * the defect. A non-strict claim is the mirror image: rendering equal makes it true.
 */
function directionHolds(a: number, rel: Rel, b: number): boolean {
  const x = Number(fmtNum(a)), y = Number(fmtNum(b));
  return rel === "GT" ? x > y : rel === "GE" ? x >= y : rel === "LT" ? x < y : x <= y;
}

export function auditChains(texts: string[], label: string): ChainAudit {
  const out: ChainAudit = { mismatches: [], unevaluable: [], claimFree: 0, checked: 0, segments: 0 };
  for (const text of texts) {
    const parts = text.split(/\$([^$]+)\$/g);
    for (let i = 1; i < parts.length; i += 2) {
      const seg = parts[i];
      out.segments++;
      const claim = splitClaim(seg);
      if (claim === null) { out.unevaluable.push(`${label}: $${seg}$ — unbalanced delimiters`); continue; }
      const { sides, relations } = claim;
      if (relations.length === 0) { out.claimFree++; continue; }
      if (sides.some((side) => side.trim() !== "" && evalTex(side) === null && !isLabel(side))) {
        out.unevaluable.push(`${label}: $${seg}$`);
        continue;
      }
      // Walk the sides left to right. Values joined by "=" accumulate into one group that must
      // all render alike; a direction relation closes that group and is asserted between the
      // group's last value and the next one. Relations compose across labels and across empty
      // sides (a leading "=" prints no operand of its own), so notation standing in the middle
      // of a chain never hides the claim the printed numbers make about each other.
      let group: number[] = [];
      let acc: Rel | null = "EQ";
      let compared = false;
      const failures: string[] = [];
      const closeGroup = () => {
        if (group.length < 2) return;
        compared = true;
        // A value sitting exactly on a 4-significant-figure boundary may render either way, and
        // which way it falls is decided by binary representation rather than by anything on the
        // page: 0.00216/0.00256 is exactly 0.84375, and IEEE754 puts the quotient one ulp under
        // that tie while the template's own float sits on it, so the two render 0.8437 and
        // 0.8438. Neither is wrong. Accepting both readings at a boundary cannot forgive the
        // defect this gate exists for — a 4-significant-figure operand fed into the next step
        // moves the result by about 1e-4 relative, seven orders of magnitude further out.
        if (!intersects(group.map(atBoundaryEitherWay)))
          failures.push(`renders ${group.map((v) => fmtNum(v)).join(" vs ")}`);
      };
      for (let k = 0; k < sides.length; k++) {
        const v = sides[k].trim() === "" ? null : evalTex(sides[k]);
        if (v !== null) {
          if (group.length > 0 && acc !== "EQ") {
            if (acc !== null && !directionHolds(group[group.length - 1], acc, v)) {
              compared = true;
              failures.push(`${fmtNum(group[group.length - 1])} ${acc} ${fmtNum(v)} is false as printed`);
            } else if (acc !== null) compared = true;
            closeGroup();
            group = [];
          }
          group.push(v);
          acc = "EQ";
        }
        const rel = relations[k];
        if (rel !== undefined && acc !== null) acc = compose(acc, rel);
      }
      closeGroup();
      if (!compared) { out.claimFree++; continue; } // one value and some labels is a definition
      out.checked++;
      for (const f of failures) out.mismatches.push(`${label}: $${seg}$ ${f}`);
    }
  }
  return out;
}
