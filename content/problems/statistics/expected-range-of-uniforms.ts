import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const expectedRangeOfUniforms: ProblemTemplate = {
  id: "statistics/expected-range-of-uniforms",
  version: 1,
  topic: "statistics/moments",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "drw", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the expected range of n independent uniforms" },
  params: {
    n: { choices: [3, 4, 7, 9, 15, 19, 24, 31, 39, 49] },
    top: { choices: [10, 20, 25, 50, 60, 100, 120, 200] },
    desks: { choices: [4, 6, 8, 12] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const nPlusOne = p.n + 1;
    return {
      nPlusOne,
      nLessOne: p.n - 1,
      gap: round(p.top / nPlusOne),
      expectedMax: round((p.top * p.n) / nPlusOne),
      expectedMin: round(p.top / nPlusOne),
      answer: round((p.top * (p.n - 1)) / nPlusOne),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `${fmtNum(p.desks)} desks each watch the same instrument. In one session ${fmtNum(p.n)} independent prints arrive, each equally likely to fall anywhere between 0 and ${fmtNum(p.top)} ticks above the day's low. ` +
    `What is the expected difference between the highest and lowest of the ${fmtNum(p.n)} prints?`,
  solution: (p, d) => [
    { title: "The range is two order statistics, and expectation is linear", body: `The highest and lowest prints are dependent — knowing one constrains the other — but expectation does not care: $E[\\max-\\text{min}]=E[\\max]-E[\\text{min}]$ holds regardless. So the range needs no joint distribution at all.` },
    { title: "Both ends", body: `The ${fmtNum(p.n)} prints cut the range into ${fmtNum(d.nPlusOne)} gaps of equal average length $${fmtNum(p.top)}/${fmtNum(d.nPlusOne)}=${fmtNum(d.gap)}$. The maximum sits one gap below the ceiling at ${fmtNum(d.expectedMax)}, and the minimum one gap above the floor at ${fmtNum(d.expectedMin)}.` },
    { title: "Subtract", body: `The range spans everything except the two outer gaps, so it covers ${fmtNum(d.nLessOne)} of the ${fmtNum(d.nPlusOne)}: $${fmtNum(p.top)}\\times${fmtNum(d.nLessOne)}/${fmtNum(d.nPlusOne)}=${fmtNum(d.answer)}$ ticks.` },
    { title: "Answer", body: `The expected range is ${fmtNum(d.answer)} ticks.` },
    { title: "Sanity check", body: `As prints pile up the range creeps toward ${fmtNum(p.top)} but never arrives, always two average gaps short. With only a handful of prints the shortfall is large, which is why a thin session understates a day's true range — a bias that no amount of averaging over the ${fmtNum(p.desks)} desks removes.` },
  ],
  keyInsight: "Expectation is linear whether or not the quantities are independent, so a range never needs a joint distribution. Combined with the equal-gaps picture, every order statistic of a uniform sample is available by counting gaps rather than integrating.",
  commonTrap: "Trying to build the joint distribution of the maximum and minimum, which is real work and entirely unnecessary for an expectation. The other slip is assuming the observed range estimates the full support, when it is short by two average gaps.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
