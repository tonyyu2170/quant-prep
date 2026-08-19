import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// C(n,k) via the standard multiplicative recurrence — kept module-local; no problem module
// shares code with another (file structure table).
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < kk; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

// The PMF, written once. `constraint` never sees `derived` (packages/engine/src/problem.ts:24),
// so the small-probability floor (constraint 3) has to be asked through this same helper.
const pmfOf = (p: Params) =>
  comb(p.n, p.k) * (p.failPct / 100) ** p.k * (1 - p.failPct / 100) ** (p.n - p.k);

// A k above n makes comb(n,k) = 0, which already fails the floor below — no separate k<=n
// rejection needed. n is capped at 16 so brute() enumerates 2^n <= 65536 sequences.
export const binomialExactCount: ProblemTemplate = {
  id: "distributions/binomial-exact-count",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "jane-street", weight: 0.3 }],
  source: { kind: "original", inspiration: "binomial PMF read directly off stated n, p, k" },
  params: {
    n: { range: { min: 6, max: 16, step: 1 } },
    failPct: { range: { min: 5, max: 65, step: 1 } },
    k: { range: { min: 0, max: 16, step: 1 } },
  },
  constraint: (p) => pmfOf(p) >= 0.01,
  derived: (p) => {
    const prob = p.failPct / 100;
    const q = 1 - prob;
    const combNK = comb(p.n, p.k);
    const nMinusK = p.n - p.k;
    const pmf = combNK * prob ** p.k * q ** nMinusK;
    // qToN = q ** p.n stays a LOCAL, never returned in `derived` — it can be as small as ~5e-8
    // on legal draws (failPct in the high 50s/60s at n=16), well under emit.ts:46's 1e-6 floor
    // (constraint 4). atLeastOne (near 1 whenever qToN is tiny) is the only thing that needs
    // to survive into derived, and it is nowhere near that floor.
    const qToN = q ** p.n;
    const atLeastOne = 1 - qToN;
    return { prob, q, combNK, nMinusK, pmf, atLeastOne };
  },
  statement: (p) =>
    `A component-inspection line tests ${fmtNum(p.n)} circuit boards overnight, each independently of the others. ` +
    `Each board fails inspection with probability ${fmtNum(p.failPct)} percent. What is the probability that exactly ${fmtNum(p.k)} of the ${fmtNum(p.n)} boards fail?`,
  answerKey: "pmf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the per-board fail rate as a probability: $\\frac{${fmtNum(p.failPct)}}{100}=${fmtNum(d.prob)}$, so a board passes with probability ${fmtNum(d.q)}. Each of the ${fmtNum(p.n)} boards behaves independently.` },
    { title: "Count the arrangements", body: `Exactly ${fmtNum(p.k)} failures among ${fmtNum(p.n)} boards can land on any of $\\binom{${fmtNum(p.n)}}{${fmtNum(p.k)}}=${fmtNum(d.combNK)}$ different subsets of boards — one for each choice of which boards are the ones that fail.` },
    { title: "Weight one arrangement", body: `Every such subset has the same probability: ${fmtNum(p.k)} fails at ${fmtNum(d.prob)} each and ${fmtNum(d.nMinusK)} passes at ${fmtNum(d.q)} each, giving $${fmtNum(d.prob)}^{${fmtNum(p.k)}}\\times${fmtNum(d.q)}^{${fmtNum(d.nMinusK)}}$ for any one specific subset.` },
    { title: "Combine", body: `Multiply the count of arrangements by the probability of any one of them: $${fmtNum(d.combNK)}\\times${fmtNum(d.prob)}^{${fmtNum(p.k)}}\\times${fmtNum(d.q)}^{${fmtNum(d.nMinusK)}}=${fmtNum(d.pmf)}$.` },
    { title: "Sanity check", body: p.k === 0
        ? `Zero failures is the complement of at least one failure, so the two probabilities must sum to ${fmtNum(1)}: $${fmtNum(d.pmf)}+${fmtNum(d.atLeastOne)}=${fmtNum(1)}$, and they do — $P(\\text{at least one failure})=1-${fmtNum(d.q)}^{${fmtNum(p.n)}}=${fmtNum(d.atLeastOne)}$.`
        : `Exactly ${fmtNum(p.k)} failures is one particular way for at least one board to fail, so this probability must sit at or below $P(\\text{at least one failure})=1-${fmtNum(d.q)}^{${fmtNum(p.n)}}=${fmtNum(d.atLeastOne)}$ — and it does.` },
  ],
  keyInsight: "A binomial probability weighs how many orderings of successes and failures give the stated count, C(n,k), against the chance any one specific ordering occurs — the exact-count probability is that count times a single ordering's probability, not the per-trial rate read off directly.",
  commonTrap: "Reporting the per-board fail rate itself, or that rate times the trial count, as the answer — both skip counting how many different orderings of the boards produce exactly the stated number of failures.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [1, 100],
};
