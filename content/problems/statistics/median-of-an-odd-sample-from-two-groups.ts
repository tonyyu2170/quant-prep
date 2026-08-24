import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const medianOfAnOddSampleFromTwoGroups: ProblemTemplate = {
  id: "statistics/median-of-an-odd-sample-from-two-groups",
  version: 1,
  topic: "statistics/moments",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "citadel", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "exchangeability deciding which group supplies the median" },
  params: {
    nA: { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    nB: { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    rounds: { choices: [2, 3, 5, 8, 12, 20] },
  },
  // An odd total is what makes the median a single observation rather than an average of two,
  // and the whole symmetry argument depends on that.
  constraint: (p) => (p.nA + p.nB) % 2 === 1 && p.nA + p.nB >= 5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const total = p.nA + p.nB;
    return {
      total,
      middleRank: (total + 1) / 2,
      fromB: round(p.nB / total),
      answer: round(p.nA / total),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `The exercise below is repeated independently on ${fmtNum(p.rounds)} separate days; consider one of them. Two independent research groups measure the same latency. Group A contributes ${fmtNum(p.nA)} readings and group B contributes ${fmtNum(p.nB)}, for ${fmtNum(d.total)} in total. Every reading, from either group, is an independent draw from the SAME continuous distribution, so no two are ever equal. ` +
    `The ${fmtNum(d.total)} readings are pooled and their median taken. What is the probability that the median reading came from group A?`,
  solution: (p, d) => [
    { title: "Resist the urge to compute anything", body: `The answer is $P(\\text{median from A})=n_A/n$, and it falls out of symmetry alone. The readings are all drawn from one common distribution, so the pooled sample is exchangeable: every assignment of which group supplied which rank is equally likely. The distribution itself never enters, and neither does its shape.` },
    { title: "The median is one particular rank", body: `With ${fmtNum(d.total)} readings and no ties, the median is the single reading of rank ${fmtNum(d.middleRank)} — not an average of two, which is exactly why the total was made odd.` },
    { title: "Every reading is equally likely to hold that rank", body: `By exchangeability each of the ${fmtNum(d.total)} readings is equally likely to be the one at rank ${fmtNum(d.middleRank)}, and ${fmtNum(p.nA)} of them belong to group A. So the probability is $${fmtNum(p.nA)}/${fmtNum(d.total)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The probability is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The complementary chance that group B supplied it is $${fmtNum(p.nB)}/${fmtNum(d.total)}=${fmtNum(d.fromB)}$, and the two add to one as they must — no third possibility exists when there are no ties. The larger group is more likely to own the median for the same reason it owns any other rank: it simply brought more readings.` },
  ],
  keyInsight: "When every observation comes from the same distribution, questions about which one lands where are questions about labelling, not about the distribution. Exchangeability makes each observation equally likely to hold any given rank, so the answer is a count over a count and the distribution cancels entirely.",
  commonTrap: "Trying to integrate the joint density of the order statistics, which is a great deal of work for an answer symmetry hands over immediately. The other slip is assuming the median must come from the larger group, when the larger group only has proportionally better odds.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [1],
};
