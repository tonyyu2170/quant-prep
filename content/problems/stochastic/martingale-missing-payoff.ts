import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const martingaleMissingPayoff: ProblemTemplate = {
  id: "stochastic/martingale-missing-payoff",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "flow", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "inverting a fair game to recover the one payoff that makes it fair" },
  params: {
    pct1: { choices: [20, 25, 30, 35, 40, 45, 50] },
    pct2: { choices: [10, 15, 20, 25, 30, 40] },
    win: { choices: [30, 40, 50, 60, 80, 100, 120, 150] },
    mid: { choices: [8, 10, 12, 15, 18, 20, 24, 30] },
  },
  // Three separate jobs in one line. The divisibility makes the payout an exact integer, so the
  // sanity check can multiply it back out — printing it at four figures and re-multiplying by a
  // percentage amplifies the rounding and misses by a full display digit (non-negotiable 3).
  // The magnitude floor keeps the answer off zero, which no relative perturbation can move: a
  // zero answer ships a mutation check that structurally cannot fail. 1080 tuples survive both.
  constraint: (p) => p.pct1 + p.pct2 <= 80 && p.win > p.mid && (p.mid * 100 - p.pct1 * p.win) % (100 - p.pct1 - p.pct2) === 0 && Math.abs(p.mid * 100 - p.pct1 * p.win) / (100 - p.pct1 - p.pct2) >= 1,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const pct3 = 100 - p.pct1 - p.pct2;
    const winContribution = p.pct1 * p.win;
    return {
      pct3,
      winContribution,
      pooled: p.mid * 100,
      answer: round((p.mid * 100 - winContribution) / pct3),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A settlement contract has exactly three outcomes. It pays ${fmtNum(p.win)} dollars with probability ${fmtNum(p.pct1)} percent, ` +
    `pays nothing with probability ${fmtNum(p.pct2)} percent, and otherwise pays some third amount. ` +
    `The desk marks the contract at ${fmtNum(p.mid)} dollars and insists the mark is fair — holding it is a fair game. ` +
    `What must the third payout be, in dollars, for that to be true? (The remaining probability is ${fmtNum(d.pct3)} percent.)`,
  solution: (p, d) => [
    { title: "Fair means the mark already is the average", body: `A fair game has no drift: the expected payout equals what you pay for it today. Writing $p$ for a branch's probability and $v$ for its payout, the mark is the weighted total $\\text{mark}=\\text{sum of }p\\times v$, and only one $v$ in that total is unknown.` },
    { title: "Clear the percentages before solving", body: `Multiply through by a hundred so nothing is carried as a decimal. The mark contributes $${fmtNum(p.mid)}\\times100=${fmtNum(d.pooled)}$, and the paying branch contributes $${fmtNum(p.pct1)}\\times${fmtNum(p.win)}=${fmtNum(d.winContribution)}$. The middle branch pays nothing, so it contributes nothing at all.` },
    { title: "Answer", body: `What is left must come from the third branch: $\\dfrac{${fmtNum(d.pooled)}-${fmtNum(d.winContribution)}}{${fmtNum(d.pct3)}}=${fmtNum(d.answer)}$ dollars.` },
    { title: "Sanity check", body: `Put it back: $${fmtNum(p.pct1)}\\times${fmtNum(p.win)}+${fmtNum(d.pct3)}\\times${d.answer < 0 ? `(${fmtNum(d.answer)})` : fmtNum(d.answer)}=${fmtNum(d.pooled)}$, which is a hundred times the ${fmtNum(p.mid)} dollar mark. A negative answer is not an error — it says the third branch is where the desk pays out, which is the only way a rich winning branch can average back down to the mark.` },
  ],
  keyInsight: "Fairness is one linear equation, so any single unknown in a payoff table is recoverable from it. That is the whole trick behind reading an implied value out of a market: the price is the constraint, and the missing number is what the constraint forces.",
  commonTrap: "Forgetting that the three probabilities must exhaust the outcomes, and solving with the wrong weight on the unknown branch. The other slip is assuming the third payout must be positive, which fairness does not require.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [100],
};
