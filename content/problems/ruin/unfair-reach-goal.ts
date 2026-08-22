import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Unfair-game absorption probability: (1 - r^i) / (1 - r^N) with r = q/p. The powers stay
// module-LOCAL (plan constraint 8): with the drift guard keeping r <= 0.58/0.42, r^N can
// still reach ~1e98 at N=700 — finite in float64 but never a printed or derived quantity.
const successOf = (p: Params) => {
  const prob = p.winPct / 100;
  const r = (1 - prob) / prob;
  const ri = Math.pow(r, p.startChips);
  const rn = Math.pow(r, p.goalChips);
  return (1 - ri) / (1 - rn);
};

export const unfairReachGoal: ProblemTemplate = {
  id: "ruin/unfair-reach-goal",
  version: 1,
  topic: "probability/ruin",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "original", inspiration: "gambler's ruin reach probability with an edge" },
  params: {
    winPct: { range: { min: 42, max: 58, step: 1 } },
    // Small stacks are structural here: legality inside the [0.01, 0.99] band needs
    // i*|ln r| <= ~4.6, so stacks beyond ~30 have no legal edge on this grid.
    startChips: { range: { min: 5, max: 30, step: 5 } },
    goalChips: { range: { min: 36, max: 90, step: 6 } },
  },
  constraint: (p) => Math.abs(p.winPct - 50) >= 2 && successOf(p) >= 0.01 && successOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const ratio = q / prob;
    const ri = Math.pow(ratio, p.startChips);
    const rn = Math.pow(ratio, p.goalChips);
    const rin = Math.pow(ratio, p.startChips + 1);
    const success = (1 - ri) / (1 - rn);
    const successNext = (1 - rin) / (1 - rn);
    return { prob, q, ratio, success, successNext, nextStack: p.startChips + 1 };
  },
  statement: (p) =>
    `At a casino game your single-hand win chance is ${fmtNum(p.winPct)} percent, and each hand moves your stack one chip up on a win or one chip down on a loss. You buy in for ${fmtNum(p.startChips)} chips and will play until you either hold ${fmtNum(p.goalChips)} chips or go broke. What is the probability you walk away having reached ${fmtNum(p.goalChips)} chips?`,
  answerKey: "success",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $f(k)$ be the chance of reaching $${fmtNum(p.goalChips)}$ chips before busting from stack $k$. One hand gives $f(k)=${fmtNum(d.prob)}\\,f(k+1)+${fmtNum(d.q)}\\,f(k-1)$, with $f(0)=0$ and $f(${fmtNum(p.goalChips)})=1$.` },
    { title: "Solve the recursion", body: `With an unequal split the solution is exponential rather than linear: $f(k)=\\frac{1-r^{k}}{1-r^{${fmtNum(p.goalChips)}}}$ where $r=\\frac{q}{p}=\\frac{${fmtNum(d.q)}}{${fmtNum(d.prob)}}=${fmtNum(d.ratio)}$ — plugging in either boundary checks out.` },
    { title: "Evaluate at your buy-in", body: `Substituting $r=${fmtNum(d.ratio)}$, $k=${fmtNum(p.startChips)}$ into the solved form gives $f(${fmtNum(p.startChips)})=${fmtNum(d.success)}$ — evaluating the two powers numerically is the whole computation.` },
    { title: "Answer", body: `The probability of reaching ${fmtNum(p.goalChips)} chips before busting is $${fmtNum(d.success)}$.` },
    { title: "Sanity check", body: `One extra chip strictly helps: from ${fmtNum(d.nextStack)} chips the same formula gives ${fmtNum(d.successNext)}, above the ${fmtNum(d.success)} from ${fmtNum(p.startChips)} — and both sit inside $(0,1)$ as probabilities must.` },
  ],
  keyInsight: "An edge bends the reach probability from a straight line into an exponential in the stack size, which is why a small per-hand disadvantage compounds into a large difference over a long climb.",
  commonTrap: "Reusing the fair-game share-of-the-table ratio when the odds are uneven — with any edge the answer depends on both barriers through the odds ratio, not just on the two stack sizes.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
