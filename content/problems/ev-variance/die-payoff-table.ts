import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A three-row payout table read off one die. The rows cover one, three and two faces, so
// the plain average of the three figures is never the expectation — that gap is the drill,
// and the Sanity check prices it exactly.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const diePayoffTable: ProblemTemplate = {
  id: "ev-variance/die-payoff-table",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.4 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "original", inspiration: "a payout table whose rows cover unequal numbers of faces" },
  params: {
    lo: { range: { min: 2, max: 20, step: 1 } },  // pays on face 1
    mid: { range: { min: 2, max: 20, step: 1 } }, // pays on faces 2, 3, 4
    hi: { range: { min: 2, max: 20, step: 1 } },  // pays on faces 5, 6
  },
  // ev - plainAvg is exactly (mid - lo)/6, so mid === lo is the one degenerate draw: there
  // the plain average of the three payouts IS the expectation and the problem drills nothing.
  // Payouts start at 2 so no printed amount can render "1 dollars".
  // Constraint 2's floor cannot bind here — every payout is at least 2, so ev >= 2; measured
  // over the whole legal space |answer| runs [2.167, 19.83].
  constraint: (p) => p.mid !== p.lo,
  derived: (p) => ({
    midNum: 3 * p.mid,
    highNum: 2 * p.hi,
    plainNum: 2 * (p.lo + p.mid + p.hi),
    plainAvg: (p.lo + p.mid + p.hi) / 3,
    gapNum: Math.abs(p.mid - p.lo),
    ev: (p.lo + 3 * p.mid + 2 * p.hi) / 6,
  }),
  statement: (p) =>
    `A fair six-sided die is rolled once and pays out according to a table: a roll of 1 pays ${fmtNum(p.lo)} dollars, ` +
    `a roll of 2, 3 or 4 pays ${fmtNum(p.mid)} dollars, and a roll of 5 or 6 pays ${fmtNum(p.hi)} dollars. ` +
    `What is the expected payout, in dollars, from one roll?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `All six faces are equally likely, so each face carries the same weight. The three rows of the table do not: one face pays ${fmtNum(p.lo)}, three faces pay ${fmtNum(p.mid)}, and two faces pay ${fmtNum(p.hi)}. A row covering more faces has to count for more.` },
    // Every chain below keeps the sixths as exact integers over 6. Weighting each row into a
    // rounded decimal first and adding those instead drifts off the printed answer.
    { title: "Put every row over sixths", body: `Measure each row by what it contributes out of six. The single low face contributes ${fmtNum(p.lo)}, the three middle faces contribute $3\\times${fmtNum(p.mid)}=${fmtNum(d.midNum)}$, and the two high faces contribute $2\\times${fmtNum(p.hi)}=${fmtNum(d.highNum)}$.` },
    { title: "Combine", body: `Add the three contributions and divide once by the six faces: $\\frac{${fmtNum(p.lo)}+${fmtNum(d.midNum)}+${fmtNum(d.highNum)}}{6}=${fmtNum(d.ev)}$. That is the expected payout per roll, in dollars.` },
    // The shortcut is reconciled against the true answer in INTEGER numerators over six,
    // never by differencing the two printed decimals: plainAvg and ev are each rounded to
    // four significant figures, and on a quarter of the legal draws those two roundings do
    // not add back to each other at displayed precision. Only the direction is claimed of
    // the decimals, and the gap is at least a sixth, far wider than the printing resolution.
    { title: "Sanity check", body: `Price the shortcut in the same sixths. Averaging the three table figures as though the rows were equally likely hands every row two of the six faces, a numerator of $2\\times(${fmtNum(p.lo)}+${fmtNum(p.mid)}+${fmtNum(p.hi)})=${fmtNum(d.plainNum)}$, so the shortcut answers $\\frac{${fmtNum(d.plainNum)}}{6}=${fmtNum(d.plainAvg)}$. Set that against the true numerator $${fmtNum(p.lo)}+${fmtNum(d.midNum)}+${fmtNum(d.highNum)}$ from the step above: the two differ by exactly $${
      p.mid > p.lo
        ? `${fmtNum(p.mid)}-${fmtNum(p.lo)}`
        : `${fmtNum(p.lo)}-${fmtNum(p.mid)}`
    }=${fmtNum(d.gapNum)}$ out of six, because the middle row covers three faces where the low row covers one. So the shortcut has to land ${p.mid > p.lo ? "below" : "above"} the expectation — and it does.` },
  ],
  keyInsight: "A payout table only becomes an expectation once each row is weighted by how many of the equally likely outcomes fall into it, so the row covering the most outcomes pulls the answer toward its own figure while a row covering a single outcome barely moves it.",
  commonTrap: "Averaging the figures in the table as though its rows were equally likely, which ignores that one row covers a single face while another covers three, and lands on a different number entirely.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [1, 2, 3, 4, 5, 6],
};
