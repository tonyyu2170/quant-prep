import { describe, expect, it } from "vitest";
import { drawParams } from "@qp/engine";
import { PROBLEMS } from "./index";
import { type ChainAudit, auditChains } from "./printed-precision";

// The gate itself. Its machinery lives in ./printed-precision so that it can be called outside
// a test run; what stays here is the scope it is pointed at and the cases that prove it fails
// when it should.
//
// Scope is every shipped topic, each audited on its own so a collapse to zero chains in one
// cannot hide under another's volume.

const TOPICS = ["probability/bayes", "probability/counting", "probability/ev-variance", "probability/distributions", "probability/ruin", "probability/geometric", "probability/markov", "probability/symmetry", "brainteasers/logic"];
const SEEDS = 200;
const MIN_CHECKED_PER_TOPIC = 1000; // a silent drop to zero chains in ONE topic must not pass

function auditTopic(topic: string): ChainAudit {
  const total: ChainAudit = { mismatches: [], unevaluable: [], claimFree: 0, checked: 0, segments: 0 };
  for (const t of PROBLEMS.filter((x) => x.topic === topic)) {
    for (let seed = 0; seed < SEEDS; seed++) {
      const p = drawParams(t, seed);
      const d = t.derived(p);
      const texts = [t.statement(p, d), ...t.solution(p, d).map((s) => s.body)];
      const a = auditChains(texts, `${t.id} seed ${seed}`);
      total.mismatches.push(...a.mismatches);
      total.unevaluable.push(...a.unevaluable);
      total.claimFree += a.claimFree;
      total.checked += a.checked;
      total.segments += a.segments;
    }
  }
  return total;
}

describe.each(TOPICS)("printed-precision gate (%s)", (topic) => {
  const audit = auditTopic(topic);

  it("every printed chain reconciles at displayed precision", () => {
    expect(audit.mismatches).toEqual([]);
    expect(audit.checked).toBeGreaterThan(MIN_CHECKED_PER_TOPIC);
  });

  it("no printed chain is unevaluable — an unreadable form is a coverage hole, not a pass", () => {
    expect(audit.unevaluable).toEqual([]);
  });

  it("accounts for every rendered segment exactly once", () => {
    // Claim-free segments assert no arithmetic over printed literals, so they are deliberately
    // not checked. Asserting the partition is what stops a parser bug from quietly shrinking
    // coverage.
    expect(audit.checked + audit.unevaluable.length + audit.claimFree).toBe(audit.segments);
    expect(audit.claimFree).toBeGreaterThan(0);
  });
});

// A checker that has never been seen to fail is not evidence that anything passed.
describe("the printed-precision checker fails when it should", () => {
  const cases: [string, boolean][] = [
    ["\\frac{16}{6}=2.667", false],   // correctly rounded
    ["\\frac{16}{6}=2.668", true],    // off by one in the last printed digit
    ["\\dfrac{16}{6}=2.667", false],  // \dfrac is the same fraction, not an unreadable form
    ["\\dfrac{16}{6}=2.668", true],
    ["3\\times8=24", false],
    ["3\\times8=25", true],
    ["7!=5040", false],
    ["7!=5041", true],
    ["1+2+\\cdots+5=15", false],      // the elided forms are evaluated, not skipped
    ["1+2+\\cdots+5=16", true],
    ["7\\times6\\times\\cdots\\times3=2520", false], // the falling product, the other elided form
    ["7\\times6\\times\\cdots\\times3=2521", true],
    ["\\frac{2\\times20-10\\times3}{10}=1", false],
    ["\\frac{2\\times20-10\\times3}{10}=1.1", true],
    ["\\sqrt{\\frac{25\\times(11\\times11-1)}{12}}=15.81", false], // a radicand over a fraction
    ["\\sqrt{\\frac{25\\times(11\\times11-1)}{12}}=15.82", true],
    ["\\frac{\\sqrt{144}}{4}=3", false],   // and a root INSIDE a fraction, the other nesting
    ["\\frac{\\sqrt{144}}{4}=3.1", true],
    ["5^3=125", false],               // a bare exponent
    ["5^3=126", true],
    ["0.6^{3}=0.216", false],         // and a braced one
    ["0.6^{3}=0.217", true],
    ["0.5\\times0.6^{3}=0.108", false], // precedence: the power binds before the product
    ["0.5\\times0.6^{3}=0.15", true],
    ["\\binom{52}{5}=2598960", false], // a binomial is folded to its integer value
    ["\\binom{52}{5}=2598961", true],
    ["\\binom{6}{2}\\times\\binom{5}{3}=150", false],
    ["\\binom{6}{2}\\times\\binom{5}{3}=151", true],
    // A decimal rounding tie: exactly 0.84375, which IEEE754 lands just under. Not a defect.
    ["0.00216/0.00256=0.8438", false],
    ["0.00216/0.00256=0.8437", false], // and the other reading of the same tie is equally fine
    ["0.00216/0.00256=0.8439", true],  // but a real last-digit error still flags
    ["0.5\\times0.65^{2}=0.2113", false], // exactly 0.21125 — a tie the other way round
    ["0.5\\times0.65^{2}=0.2112", false],
    ["0.5\\times0.65^{2}=0.2114", true],  // one digit past the boundary is still a defect
    ["0.2308/0.6923=0.3334", false],   // 0.33338..., not a tie, correctly rounded
    ["0.2308/0.6923=0.3333", true],    // the rounded-operand drift this gate exists for
    // The \text notation shapes must not swallow the arithmetic standing beside them.
    ["\\text{odds}(S\\mid H)=\\text{odds}(S)\\times\\text{LR}=0.4286\\times6=2.572", false],
    ["\\text{odds}(S\\mid H)=\\text{odds}(S)\\times\\text{LR}=0.4286\\times6=2.571", true],
    // Direction claims. A strict inequality gets no boundary allowance: rendering equal is
    // exactly what makes the printed line false, so it must flag.
    ["0.6667 > 0.2", false],
    ["0.2 > 0.6667", true],
    ["0.2 < 0.6667", false],
    ["0.6667 < 0.2", true],
    ["0.3333 > 0.3333", true],       // a strict claim between two equal printed numbers
    ["1/3 > 0.3333", true],          // and between two values that PRINT equal
    ["0.3333 \\geq 0.3333", false], // the non-strict claim is the mirror image: equal is true
    ["1/3 \\geq 0.3333", false],
    ["0.2 \\geq 0.6667", true],
    ["0.6667 \\leq 0.2", true],
    ["0.2 \\leq 0.2", false],
    // A relation composes across a label standing in the middle of the chain.
    ["P(A\\mid RR)=0.08551<0.5", false],
    ["P(A\\mid RR)=0.08551<0.05", true],
    // ...and across an equality, which is how a Sanity check usually reads.
    ["0.5\\times0.4=0.2<0.6667", false],
    ["0.5\\times0.4=0.2>0.6667", true],
    // Nothing composes across a change of direction, so a>b<c claims nothing about a and c.
    ["0.5>0.2<0.9", false],
    ["0.5>0.9<0.2", true],           // but each adjacent pair is still asserted
    // A label on one side must not excuse the arithmetic on the other two.
    ["P(F\\mid A)=0.1391\\times0.85=0.1182", false],
    ["P(F\\mid A)=0.1391\\times0.85=0.1183", true],
    // An "=" inside a paren group names an event; splitting there would tear the notation.
    ["P(\\max=3\\mid\\text{at least one}\\geq2)=5/35=0.1429", false],
    ["P(\\max=3\\mid\\text{at least one}\\geq2)=5/35=0.143", true],
    // "\propto" asserts equality up to a shared factor, so it is a relation, not notation.
    ["P(\\bar G,M)\\propto1999\\times0.0001=0.1999", false],
    ["P(\\bar G,M)\\propto1999\\times0.0001=0.1998", true],
  ];
  // No literal "$" in the title: vitest reads $<digit> as a positional case reference.
  it.each(cases)("%s -> flags: %s", (seg, shouldFlag) => {
    const a = auditChains([`$${seg}$`], "mutation");
    expect(a.unevaluable).toEqual([]); // every case must be readable, or it proves nothing
    expect(a.mismatches.length > 0).toBe(shouldFlag);
  });

  // Recognising notation is what keeps the unevaluable count honest; it must not become a
  // catch-all that swallows arithmetic. These carry no reconcilable claim at all.
  const claimFree: string[] = [
    "P(D\\mid +)=0.9",                       // a labelled value: one number, nothing recomputed
    "\\text{odds}(S)=P(S)/P(\\bar S)",       // a formula over named quantities
    "\\binom{n}{k}=\\binom{n}{n-k}",         // symbolic, so the reader leaves it standing
    "P(\\text{shows }4\\mid \\text{sum}=5)", // the only "=" is inside the event description
    // Prose in braces still names a quantity when no numeral is printed outside it.
    "\\text{LR}=P(H\\mid S)/P(H\\mid \\bar S)",
    "\\text{odds}(\\text{win}\\mid\\text{signal})=\\text{odds}(\\text{win})\\times\\text{LR}",
    "P(\\text{2 bad}\\mid A)=P(\\text{2 bad}\\mid C)",
    "2\\times P(\\text{win})=P(\\text{signal})", // a letter outside the braces still labels it
  ];
  it.each(claimFree)("%s -> carries no claim", (seg) => {
    const a = auditChains([`$${seg}$`], "mutation");
    expect(a.unevaluable).toEqual([]);
    expect(a.mismatches).toEqual([]);
    expect([a.claimFree, a.checked]).toEqual([1, 0]);
  });

  // The property that makes the gate mean anything: a form the reader cannot read is reported,
  // never counted as a pass and never quietly reclassified as notation.
  const unreadable: string[] = [
    "\\sum_{i=1}^{3}=6",      // an unrecognised command, even though it has letters
    "\\log(100)=2",
    "2+3+\\cdots+9=44",       // an elided sum that is not the triangular form
    "7\\times5\\times\\cdots\\times3=105", // a run that does not descend by one
    "\\binom{4.5}{2}=6",      // a binomial the reader declines to fold
    // Prose in braces must never vouch for an operand printed outside it. The second of these
    // is arithmetically false, and both were silently claim-free before the \text guard.
    "0.4\\text{ of }0.5=0.25",
    "12\\text{ cm}\\times2=25\\text{ cm}",
    // The prose-carrying commands RECOGNISED_CMD warns about are absent from the corpus, and
    // must stay loud while they are: both of these are false, and both are reported.
    "\\mathrm{P}(A)=2\\times3=7",
    "\\operatorname{odds}(S)=0.4\\times6=2.5",
  ];
  it.each(unreadable)("%s -> is reported unreadable", (seg) => {
    const a = auditChains([`$${seg}$`], "mutation");
    expect(a.unevaluable.length).toBe(1);
    expect([a.checked, a.claimFree]).toEqual([0, 0]);
  });
});
