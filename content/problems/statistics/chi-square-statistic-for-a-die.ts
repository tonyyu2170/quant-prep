import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The six counts are the fair expectation plus a scaled deviation pattern, every pattern summing
// to zero so that the counts add back to the number of rolls on every draw. `constraint` reaches
// PATTERNS to keep every count positive, to hold the statistic in a readable range, and to keep
// its four-figure rendering away from the printed critical value — the verdict is a strict
// relation between two printed literals and must be true on the page.
const PATTERNS = [
  [3, -2, 1, -4, 0, 2], [5, -3, 2, -4, 1, -1], [2, 2, -1, -1, -3, 1], [6, -1, -2, -3, 1, -1],
  [-5, 4, 3, -2, -1, 1], [4, -4, 2, -2, 1, -1], [7, -2, -3, 1, -2, -1], [1, -1, 2, -2, 3, -3],
  [8, -5, -1, -2, 2, -2], [2, -3, 4, -1, -2, 0], [-6, 2, 1, 3, -1, 1], [3, 3, -3, -3, 2, -2],
  [10, -4, -3, -2, 0, -1], [1, 2, 3, -1, -2, -3],
];
const statOf = (par: { expected: number; pat: number; scale: number }) =>
  (par.scale * par.scale * PATTERNS[par.pat].reduce((s, d) => s + d * d, 0)) / par.expected;

export const chiSquareStatisticForADie: ProblemTemplate = {
  id: "statistics/chi-square-statistic-for-a-die",
  version: 1,
  topic: "statistics/inference",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "sig", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "Pearson's chi-square statistic for a fair die" },
  params: {
    expected: { choices: [10, 15, 20, 25, 30, 40, 50, 60, 100] },
    pat: { choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
    scale: { choices: [1, 2, 3] },
    alphaPct: { choices: [5, 1] },
  },
  constraint: (p) => PATTERNS[p.pat].every((d) => p.expected + p.scale * d >= 1) && statOf(p as { expected: number; pat: number; scale: number }) >= 0.5 && statOf(p as { expected: number; pat: number; scale: number }) <= 30 && Math.abs(statOf(p as { expected: number; pat: number; scale: number }) - 11.07) > 0.02 && Math.abs(statOf(p as { expected: number; pat: number; scale: number }) - 15.09) > 0.02,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const dev = PATTERNS[p.pat].map((d) => p.scale * d);
    const sumSq = dev.reduce((s, d) => s + d * d, 0);
    return {
      rolls: 6 * p.expected,
      c1: p.expected + dev[0], c2: p.expected + dev[1], c3: p.expected + dev[2],
      c4: p.expected + dev[3], c5: p.expected + dev[4], c6: p.expected + dev[5],
      d1: dev[0], d2: dev[1], d3: dev[2], d4: dev[3], d5: dev[4], d6: dev[5],
      sumSq,
      crit: p.alphaPct === 5 ? 11.07 : 15.09,
      df: 5,
      answer: round(sumSq / p.expected),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A die is rolled ${fmtNum(d.rolls)} times. The faces one to six come up ${fmtNum(d.c1)}, ${fmtNum(d.c2)}, ${fmtNum(d.c3)}, ${fmtNum(d.c4)}, ${fmtNum(d.c5)} and ${fmtNum(d.c6)} times, and a fair die would show each face ${fmtNum(p.expected)} times on average. ` +
    `What is Pearson's chi-square statistic for these counts? At the ${fmtNum(p.alphaPct)} percent level the critical value on ${fmtNum(d.df)} degrees of freedom is ${fmtNum(d.crit)}.`,
  solution: (p, d) => {
    const sq = (v: number) => (v < 0 ? `(${fmtNum(v)})^{2}` : `${fmtNum(v)}^{2}`);
    const verdict = d.answer < d.crit
      ? `$${fmtNum(d.answer)}<${fmtNum(d.crit)}$, so the counts are the kind a fair die produces and the null stands`
      : `$${fmtNum(d.answer)}\\geq${fmtNum(d.crit)}$, so counts this uneven are too rare under fairness and the die is rejected`;
    return [
      // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
      { title: "Pearson's statistic", body: `Each face's count is compared with its expectation, the gap squared and scaled by that expectation, and the six terms added: $X^{2}=\\dfrac{(O_1-E)^{2}+\\cdots+(O_6-E)^{2}}{E}$. Under a fair die this is approximately chi-square on $6-1=${fmtNum(d.df)}$ degrees of freedom — one fewer than the number of faces, because the six counts are tied to the number of rolls.` },
      { title: "The deviations", body: `Face by face the counts miss the expectation of ${fmtNum(p.expected)} by ${fmtNum(d.d1)}, ${fmtNum(d.d2)}, ${fmtNum(d.d3)}, ${fmtNum(d.d4)}, ${fmtNum(d.d5)} and ${fmtNum(d.d6)}. They add to zero, as they must: the counts add to ${fmtNum(d.rolls)} and so does six times the expectation.` },
      { title: "Square and add", body: `Squaring removes the signs: $${sq(d.d1)}+${sq(d.d2)}+${sq(d.d3)}+${sq(d.d4)}+${sq(d.d5)}+${sq(d.d6)}=${fmtNum(d.sumSq)}$.` },
      { title: "Answer", body: `Every face has the same expectation, so one division does the scaling: $\\dfrac{${fmtNum(d.sumSq)}}{${fmtNum(p.expected)}}=${fmtNum(d.answer)}$. Against the critical value, ${verdict}.` },
      { title: "Sanity check", body: `A face that is off by about the square root of its expectation contributes about one to the sum, and with five of the six counts free to vary a fair die runs the statistic near ${fmtNum(d.df)} on average. Larger gaps are penalised by their square, which is why a single face far out of line can carry the whole verdict.` },
    ];
  },
  keyInsight: "A goodness-of-fit statistic is a sum of squared deviations, each scaled by the count that was expected, and its typical size under the null is its degrees of freedom. The scaling is what makes faces with different expectations comparable, and the square is what makes one badly-off face outweigh several slightly-off ones.",
  commonTrap: "Scaling by the observed count instead of the expected one, or forgetting to square so that the deviations cancel to zero. The other slip is counting six degrees of freedom: the counts are constrained to add to the number of rolls, which removes one.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1, 2, 6],
};
