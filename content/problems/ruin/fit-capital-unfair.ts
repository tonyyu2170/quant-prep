import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Minimum capital for a stated reach chance in an unfair game, inverted through logs:
// i = ceil( ln(1 - c(1 - r^N)) / ln r ). Powers of r beyond what prose prints stay LOCAL
// (plan constraint 8); `constraint` cannot see `derived`, so it asks through this helper.
const successAt = (p: Params, stack: number) => {
  const prob = p.winPct / 100;
  const r = (1 - prob) / prob;
  return (1 - Math.pow(r, stack)) / (1 - Math.pow(r, p.goalChips));
};
const fitStack = (p: Params) => {
  const prob = p.winPct / 100;
  const r = (1 - prob) / prob;
  return Math.ceil(Math.log(1 - (p.targetPct / 100) * (1 - Math.pow(r, p.goalChips))) / Math.log(r));
};
const bandOf = (p: Params) => successAt(p, fitStack(p));

export const fitCapitalUnfair: ProblemTemplate = {
  id: "ruin/fit-capital-unfair",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "citadel-securities", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "log-inversion of the unfair ruin formula for required capital" },
  params: {
    winPct: { range: { min: 42, max: 58, step: 1 } },
    targetPct: { range: { min: 5, max: 60, step: 1 } },
    goalChips: { range: { min: 36, max: 90, step: 6 } },
  },
  constraint: (p) => Math.abs(p.winPct - 50) >= 2 && bandOf(p) >= 0.01 && bandOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const ratio = q / prob;
    const rn = Math.pow(ratio, p.goalChips);
    const rawNeed = Math.log(1 - (p.targetPct / 100) * (1 - rn)) / Math.log(ratio);
    const capital = Math.ceil(rawNeed);
    const achieved = successAt(p, capital);
    const below = successAt(p, capital - 1);
    const oneLess = capital - 1;
    const fairNeed = Math.ceil((p.targetPct / 100) * p.goalChips);
    return { prob, q, ratio, rawNeed, capital, achieved, below, oneLess, fairNeed };
  },
  statement: (p) =>
    `Your edge at a table is negative — hands win ${fmtNum(p.winPct)} percent of the time — but you still want at least a ${fmtNum(p.targetPct)} percent chance of building a buy-in into a stack of ${fmtNum(p.goalChips)} chips before busting. What is the smallest whole number of chips to buy in for?`,
  answerKey: "capital",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The reach chance from $k$ chips follows the exponential form in the odds ratio $r=\\frac{${fmtNum(d.q)}}{${fmtNum(d.prob)}}=${fmtNum(d.ratio)}$, run against the $${fmtNum(p.goalChips)}$-chip goal.` },
    { title: "Invert for the stake", body: `Setting that form equal to ${fmtNum(p.targetPct)} percent and solving for the stack takes a single logarithm; the raw requirement works out to ${fmtNum(d.rawNeed)} chips.` },
    { title: "Round up", body: `Whole chips again: buy ${fmtNum(d.capital)}, which achieves ${fmtNum(d.achieved)} — at or above the promised chance — while ${fmtNum(d.oneLess)} chips would hold only ${fmtNum(d.below)}.` },
    { title: "Answer", body: `Buy in for at least ${fmtNum(d.capital)} chips.` },
    { title: "Sanity check", body: `A fair table would ask only ${fmtNum(d.fairNeed)} chips for the same promise (the linear share); the adverse edge demands ${fmtNum(d.capital)} — every chip must fight the drift as well as buy progress.` },
  ],
  keyInsight: "With an edge against you, required capital grows logarithmically in the target probability but exponentially in the climb length — inverting the ruin form is one logarithm away.",
  commonTrap: "Applying the fair-game linear share and rounding up — under adverse odds the needed stake is strictly larger than any linear reading suggests.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
