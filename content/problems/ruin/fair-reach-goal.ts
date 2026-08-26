import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// P(reach goal before bust | fair game) = start/goal — the martingale argument.
// `constraint` never sees `derived` (packages/engine/src/problem.ts:24), so the answer band
// is asked through this same helper (constraint 7 of the plan).
const successOf = (p: Params) => p.startChips / p.goalChips;

export const fairReachGoal: ProblemTemplate = {
  id: "ruin/fair-reach-goal",
  version: 1,
  topic: "probability/ruin",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "original", inspiration: "gambler's ruin reach probability under a fair game" },
  params: {
    startChips: { range: { min: 20, max: 280, step: 20 } },
    goalChips: { range: { min: 320, max: 700, step: 20 } },
  },
  constraint: (p) => successOf(p) >= 0.01 && successOf(p) <= 0.99 && !complementGrades(successOf(p)),
  derived: (p) => {
    const frac = p.startChips / p.goalChips;
    const ruinProb = 1 - frac;
    const oppStack = p.goalChips - p.startChips;
    return { frac, ruinProb, oppStack };
  },
  statement: (p) =>
    `You sit down to a heads-up even-money game holding ${fmtNum(p.startChips)} chips against your opponent's ${fmtNum(p.goalChips - p.startChips)}. Every hand risks one chip to win one chip, and neither side has any edge. Play continues until one player holds everything. What is the probability that you are the one who ends up with all ${fmtNum(p.goalChips)} chips?`,
  answerKey: "frac",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Track your stack as it moves up or down one chip per hand between $0$ (bust) and $${fmtNum(p.goalChips)}$ (all the chips). Let $f(k)$ be the probability you eventually reach the top starting from $k$, so $f(0)=0$ and $f(${fmtNum(p.goalChips)})=1$.` },
    { title: "One fair hand", body: `From any intermediate stack $k$ the next hand sends you to $k-1$ or $k+1$ with equal chance, giving $f(k)=\\frac{f(k-1)+f(k+1)}{2}$. A value pinned halfway between its neighbours at every point can only be a straight line.` },
    { title: "Read off the line", body: `The straight line through $(0,0)$ and $(${fmtNum(p.goalChips)},1)$ is $f(k)=\\frac{k}{${fmtNum(p.goalChips)}}$, so from your stack $f=\\frac{${fmtNum(p.startChips)}}{${fmtNum(p.goalChips)}}=${fmtNum(d.frac)}$.` },
    { title: "Answer", body: `The probability you sweep the table is $${fmtNum(d.frac)}$.` },
    { title: "Sanity check", body: `Your opponent sweeps with probability ${fmtNum(d.ruinProb)} — the exact complement of your share: $\\frac{${fmtNum(p.startChips)}}{${fmtNum(p.goalChips)}}+\\frac{${fmtNum(d.oppStack)}}{${fmtNum(p.goalChips)}}=${fmtNum(1)}$. Exactly one of the two endings must happen.` },
  ],
  keyInsight: "In a fair game your expected stack never moves, so the chance of ending up with everything is simply your share of the chips on the table.",
  commonTrap: "Reaching for streak arguments or betting systems — fairness pins the odds at your starting share, and no scheme moves a single digit of it.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [0, 1, 2],
};
