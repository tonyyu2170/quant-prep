import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Among k+1 exchangeable competitors each is equally likely to be fastest, so the answer is
// 1/(k+1) whatever the field's absolute times look like.
export const beatEveryRival: ProblemTemplate = {
  id: "symmetry/beat-every-rival",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 2,
  firms: [{ firm: "imc", weight: 0.3 }, { firm: "drw", weight: 0.3 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "original", inspiration: "exchangeability: who is fastest among equals" },
  params: {
    rivals: { choices: [2, 3, 4, 5, 6, 7] },
    rounds: { range: { min: 30, max: 600, step: 10 } },
  },
  derived: (p) => {
    const field = p.rivals + 1;
    return { field, prob: 1 / field, answer: p.rounds / field, rivalWins: (p.rounds * p.rivals) / field };
  },
  statement: (p, d) =>
    `Your desk and ${fmtNum(p.rivals)} rival desks each submit a quote to the same auction. All ${fmtNum(d.field)} response times are drawn independently from one and the same continuous distribution, so ties never occur. Over ${fmtNum(p.rounds)} auctions, in how many should your desk expect to be fastest?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Nobody is distinguished", body: `All ${fmtNum(d.field)} times come from the same distribution and are independent, so relabelling the desks cannot change any probability. The desks are exchangeable.` },
    { title: "Exactly one can be fastest", body: `Ties have probability zero for a continuous distribution, so precisely one desk wins each auction — and by exchangeability each is equally likely to be that one.` },
    { title: "Divide", body: `Your chance is $\\frac{1}{${d.field}}=${fmtNum(d.prob)}$, giving $\\frac{${p.rounds}}{${d.field}}=${fmtNum(d.answer)}$ auctions won.` },
    { title: "Sanity check", body: `The rivals take the other $\\frac{${p.rounds}\\times${p.rivals}}{${d.field}}=${fmtNum(d.rivalWins)}$ between them, and the two counts add back to ${fmtNum(p.rounds)}. Notice the distribution itself never entered the arithmetic.` },
  ],
  keyInsight: "Exchangeability answers 'who is first' without any distribution: if relabelling changes nothing, every competitor holds an equal share of the wins.",
  commonTrap: "Reaching for the distribution to integrate a minimum. It cancels, and any continuous distribution shared by all desks gives the same answer.",
  expectedPaceS: 100,
  constants: [1],
  verify: { method: "brute-force" },
};
