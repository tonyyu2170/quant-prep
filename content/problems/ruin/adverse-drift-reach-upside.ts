import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// One-sided upside reach under adverse drift: P(ever reach +a | start -s) = (p/q)^(s+a).
// The drift guard (winPct <= 45) keeps p/q bounded, and the Monte Carlo cutoff at a deep
// negative level is unbiased by the mirror argument of plan constraint 5.
const reachOf = (p: Params) => {
  const prob = p.winPct / 100;
  return Math.pow(prob / (1 - prob), p.hole + p.height);
};

export const adverseDriftReachUpside: ProblemTemplate = {
  id: "ruin/adverse-drift-reach-upside",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "millennium", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "original", inspiration: "longshot goal probability against adverse drift" },
  params: {
    winPct: { range: { min: 20, max: 45, step: 1 } },
    hole: { range: { min: 0, max: 5, step: 1 } },
    height: { range: { min: 1, max: 10, step: 1 } },
  },
  constraint: (p) => reachOf(p) >= 0.1 && reachOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const ratio = q / prob;
    const answer = Math.pow(prob / q, p.hole + p.height);
    const oneLower = Math.pow(prob / q, p.hole + p.height - 1);
    return { prob, q, ratio, answer, oneLower };
  },
  statement: (p) =>
    `A day trader's account ticks up one unit with probability ${fmtNum(p.winPct)} percent per trade and down one otherwise — the strategy has a genuine negative edge. The account currently sits ${fmtNum(p.hole)} units underwater. What is the probability it ever touches ${fmtNum(p.height)} units of profit?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $h(k)$ be the chance of ever reaching $+${fmtNum(p.height)}$ from level $k$, with $h(${fmtNum(p.height)})=1$. Since the walk drifts downward, $h(k)$ must fade to zero far below the origin.` },
    { title: "Solve with a vanishing exponential", body: `The recursion $h(k)=${fmtNum(d.prob)}\\,h(k+1)+${fmtNum(d.q)}\\,h(k-1)$ admits powers of $r=q/p=${fmtNum(d.ratio)}$; the branch that survives the far-down boundary gives $h(k)=(p/q)^{k-${fmtNum(p.height)}}$.` },
    { title: "Evaluate at today's balance", body: `From $-${fmtNum(p.hole)}$: $h(-${fmtNum(p.hole)})=(p/q)^{-${fmtNum(p.hole)}-${fmtNum(p.height)}}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The probability of ever banking that target is $${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `A target one unit lower would give ${fmtNum(d.oneLower)}, larger than ${fmtNum(d.answer)} — every extra rung of profit multiplies the odds ratio against the climb once more.` },
  ],
  keyInsight: "Against adverse drift the chance of ever climbing to a fixed height decays geometrically in that height — the win/loss odds ratio raised to the target.",
  commonTrap: "Trusting that enough trades eventually guarantee touching any level — a negative edge makes high targets unreachable in exactly the same measure as it grinds the account down.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
