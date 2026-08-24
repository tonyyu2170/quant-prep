import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const exponentialMartingaleValue: ProblemTemplate = {
  id: "stochastic/exponential-martingale-value",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "optiver", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "constructing the exponential martingale for a biased walk" },
  params: {
    winPct: { choices: [40, 44, 45, 48, 52, 55, 56, 60] },
    start: { choices: [0, 1, 2, 3, 4, 5, 6, 8] },
    target: { choices: [4, 5, 6, 8, 10, 12, 14, 16] },
  },
  // The value is exponential in a drawn axis, so it needs a decimal-safe bound of its own:
  // emit.ts rejects any derived value below 1e-6 or at/above 1e15, and a probe cannot see it.
  constraint: (p) => {
    const gap = p.target - p.start;
    if (gap < 2) return false;
    const value = Math.pow((100 - p.winPct) / p.winPct, gap);
    return value >= 1e-4 && value <= 1e4;
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const lossPct = 100 - p.winPct;
    const ratio = round(lossPct / p.winPct);
    return {
      lossPct,
      ratio,
      gap: p.target - p.start,
      answer: round(Math.pow(lossPct / p.winPct, p.target - p.start)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A position moves one unit up with probability ${fmtNum(p.winPct)} percent and one unit down with probability ` +
    `${fmtNum(d.lossPct)} percent on every trade, independently. The walk is NOT fair, so tracking the position itself ` +
    `gives a drifting quantity. There is, however, a number $r$ for which tracking $r$ raised to the position IS a fair ` +
    `game. Taking that $r$, what is its value when the position has climbed from ${fmtNum(p.start)} to ` +
    `${fmtNum(p.target)} units?`,
  solution: (p, d) => [
    { title: "Ask what fairness demands of one step", body: `A quantity is a fair game when one step changes nothing on average. One step multiplies $r$ raised to the position by either $r$ or by one over $r$, so fairness reads: $p$ times $r$ plus $q$ times one over $r$ equals one, with $p$ and $q$ the two step probabilities.` },
    { title: "Solve it, and discard the useless root", body: `Multiplying through by $r$ gives a quadratic whose two roots are $r=1$ and $r=q/p$. The first is the constant quantity, which is fair but says nothing. The second is the one worth having.` },
    { title: "Put the numbers in", body: `Here that ratio is $\\dfrac{${fmtNum(d.lossPct)}}{${fmtNum(p.winPct)}}=${fmtNum(d.ratio)}$.` },
    { title: "Answer", body: `The position has climbed $${fmtNum(p.target)}-${fmtNum(p.start)}=${fmtNum(d.gap)}$ units, so the quantity now stands at $\\left(\\dfrac{${fmtNum(d.lossPct)}}{${fmtNum(p.winPct)}}\\right)^{${fmtNum(d.gap)}}=${fmtNum(d.answer)}$. The power is taken on the FRACTION, not on its rounded value — raising ${fmtNum(d.ratio)} instead would drift a digit.` },
    { title: "Sanity check", body: `${p.winPct > 50 ? `Because the up move is the likelier one, the ratio ${fmtNum(d.ratio)} is below one and climbing drives the quantity DOWN` : `Because the down move is the likelier one, the ratio ${fmtNum(d.ratio)} is above one and climbing drives the quantity UP`} — which is what lets it stay fair while the position itself drifts. The two effects cancel exactly, and that cancellation is the construction.` },
  ],
  keyInsight: "A drifting walk has no fair quantity built from it directly, but exponentiating it does: the multiplicative form turns the drift into a factor that fairness can cancel. That single trick is what makes biased-walk problems tractable at all.",
  commonTrap: "Taking the root as the ratio of the up probability to the down one, which inverts it and makes the quantity drift twice as fast rather than not at all. The other slip is keeping the root of one, which is fair and useless.",
  expectedPaceS: 125,
  verify: { method: "brute-force" },
  constants: [1],
};
