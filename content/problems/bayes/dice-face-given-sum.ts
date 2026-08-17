import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Dice conditional: P(at least one die shows a target face | sum equals s) — enumerable event.
export const diceFaceGivenSum: ProblemTemplate = {
  id: "bayes/dice-face-given-sum",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.5 }, { firm: "jump", weight: 0.4 }],
  source: { kind: "free-resource", inspiration: "classic: conditional probability on two dice given the sum" },
  params: {
    face: { choices: [4, 5, 6] },
    s: { choices: [5, 6, 7, 8, 9, 10, 11] },
  },
  constraint: (p) => {
    let total = 0;
    let favorable = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        if (d1 + d2 === p.s) {
          total++;
          if (d1 === p.face || d2 === p.face) favorable++;
        }
      }
    }
    return total > 0 && favorable > 0 && favorable < total;
  },
  derived: (p) => {
    let total = 0;
    let favorable = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        if (d1 + d2 === p.s) {
          total++;
          if (d1 === p.face || d2 === p.face) favorable++;
        }
      }
    }
    const probFace = favorable / total;
    return { total, favorable, probFace };
  },
  statement: (p) =>
    `Two fair six-sided dice are rolled and their sum is ${p.s}. Given this, what is the probability that at least one of the two dice shows a ${p.face}?`,
  answerKey: "probFace",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Condition on the sum being ${p.s}: list every ordered pair of dice values that adds to ${p.s}. That restricted set is the new sample space.` },
    { title: "Count the restricted sample space", body: `There are ${fmtNum(d.total)} ordered pairs that sum to ${p.s}.` },
    { title: "Count the favorable pairs", body: `Of those, ${fmtNum(d.favorable)} pairs include at least one die showing ${p.face}.` },
    { title: "Conditional probability", body: `$P(\\text{shows }${p.face}\\mid \\text{sum}=${p.s})=${fmtNum(d.favorable)}/${fmtNum(d.total)}=${fmtNum(d.probFace)}$.` },
    { title: "Sanity check", body: `Only some, not all, of the pairs summing to ${p.s} include a ${p.face}, so the conditional probability must land strictly between $0$ and $1$ — and $${fmtNum(d.probFace)}$ does.` },
  ],
  keyInsight: "Conditioning on a fixed sum collapses the sample space to just the ordered pairs that make that sum — count favorable outcomes only within that smaller set.",
  commonTrap: "Computing the unconditional probability of showing the given face across all dice rolls instead of restricting to only the pairs that already sum to the given total.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
