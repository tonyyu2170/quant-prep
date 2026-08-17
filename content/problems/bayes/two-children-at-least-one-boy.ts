import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// The classic (and famously ambiguous) two-children problem. The sampling model is pinned
// explicitly: a family is drawn uniformly from the subset of two-child families with at
// least one boy — NOT "a specific named child is a boy" (a different, larger answer).
export const twoChildrenAtLeastOneBoy: ProblemTemplate = {
  id: "bayes/two-children-at-least-one-boy",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.5 }, { firm: "hrt", weight: 0.4 }, { firm: "flow", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic: two-children boy/girl paradox (at-least-one-boy sampling)" },
  params: {
    q: { choices: [0.3, 0.35, 0.4, 0.42, 0.45, 0.48, 0.5, 0.52, 0.55, 0.58, 0.6, 0.65, 0.7] },
  },
  derived: (p) => {
    const qComplement = 1 - p.q;
    const pBB = p.q * p.q;
    const pBG = p.q * qComplement;
    const qComplementSq = qComplement * qComplement;
    const pAtLeastOneBoy = 1 - qComplementSq;
    const postBothBoys = pBB / pAtLeastOneBoy;
    const twoMinusQ = 2 - p.q;
    return { qComplement, pBB, pBG, qComplementSq, pAtLeastOneBoy, postBothBoys, twoMinusQ };
  },
  statement: (p) =>
    `Consider the population of all two-child families in a hypothetical society where each child is independently a boy with probability ${p.q}, regardless of birth order or the other child's sex. ` +
    `Restrict attention to the subset of two-child families that have at least one boy, and select one family from that subset uniformly at random. What is the probability that both children in the selected family are boys?`,
  answerKey: "postBothBoys",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Each child is independently a boy (B) with probability ${p.q} or a girl (G) with probability ${fmtNum(d.qComplement)}. A family's birth order gives four equally structured outcomes: BB, BG, GB, GG.` },
    { title: "Outcome probabilities", body: `$P(BB)=${p.q}^2=${fmtNum(d.pBB)}$. $P(BG)=P(GB)=${p.q}\\times${fmtNum(d.qComplement)}=${fmtNum(d.pBG)}$ each. $P(GG)=${fmtNum(d.qComplement)}^2=${fmtNum(d.qComplementSq)}$.` },
    { title: "Restrict to at least one boy", body: `This subset is BB, BG, and GB — BG and GB are two distinct birth orders, both counted separately. Its total mass is $P(\\text{at least one boy})=1-P(GG)=1-${fmtNum(d.qComplementSq)}=${fmtNum(d.pAtLeastOneBoy)}$.` },
    { title: "Conditional probability", body: `$P(BB\\mid\\text{at least one boy})=${fmtNum(d.pBB)}/${fmtNum(d.pAtLeastOneBoy)}=${fmtNum(d.postBothBoys)}$.` },
    { title: "Sanity check", body: `Algebraically this posterior simplifies to $${p.q}/(2-${p.q})=${p.q}/${fmtNum(d.twoMinusQ)}=${fmtNum(d.postBothBoys)}$. Since $2-${p.q}$ always exceeds $1$ for any boy-probability below $1$, dividing ${p.q} by it must pull the result below ${p.q} itself — and $${fmtNum(d.postBothBoys)} < ${p.q}$ holds.` },
  ],
  keyInsight: "The apparent paradox in 'at least one boy' problems dissolves once birth-order outcomes are enumerated explicitly: boy-then-girl and girl-then-boy are two separate outcomes that both satisfy the condition, which is exactly why sampling from 'families with at least one boy' gives a different answer than conditioning on a specific identified child, like 'the older child is a boy'.",
  commonTrap: "Answering with the single-child boy probability directly, as if learning that one child is a boy says nothing about the family composition — 'at least one boy' is satisfied by two distinct birth-order arrangements but only one of them has two boys, which pulls the conditional probability below the raw per-child rate.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
