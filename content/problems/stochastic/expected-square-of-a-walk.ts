import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const expectedSquareOfAWalk: ProblemTemplate = {
  id: "stochastic/expected-square-of-a-walk",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "optiver", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the second moment of a symmetric walk started away from zero" },
  params: {
    start: { choices: [4, 6, 9, 10, 12, 15, 20, 25] },
    steps: { choices: [3, 5, 8, 10, 12, 16, 20, 25] },
    tick: { choices: [1, 2, 3, 4, 5, 6, 8, 10] },
  },
  constraint: (p) => p.steps * p.tick * p.tick <= 2000 && p.tick <= p.start,
  derived: (p) => ({
    variance: p.steps * p.tick * p.tick,
    startSquared: p.start * p.start,
    answer: p.start * p.start + p.steps * p.tick * p.tick,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A quoted mid starts the session at ${fmtNum(p.start)} ticks above its reference and moves once a minute, ` +
    `up or down by ${fmtNum(p.tick)} ticks with equal probability, independently each minute. ` +
    `After ${fmtNum(p.steps)} minutes, what is the expected SQUARE of its distance above the reference?`,
  solution: (p, d) => [
    { title: "Split the square before averaging", body: `Write the level after $n$ minutes as $X=a+S$, with $a$ the starting level and $S$ the total of the moves. Then $E[X^2]=a^2+2aE[S]+E[S^2]$.` },
    { title: "The cross term is what a fair game kills", body: `Each minute is a fair bet, so $E[S]=0$ and the whole middle term goes with it. This is the only place the fairness is used — and it is why the answer does not depend on which way the mid happened to drift.` },
    { title: "Add the variance the moves contribute", body: `Each minute contributes ${fmtNum(p.tick)} squared to the variance, and the minutes are independent, so the variances add: $${fmtNum(p.steps)}\\times${fmtNum(p.tick)}\\times${fmtNum(p.tick)}=${fmtNum(d.variance)}$.` },
    { title: "Answer", body: `Squaring the start gives $${fmtNum(p.start)}\\times${fmtNum(p.start)}=${fmtNum(d.startSquared)}$, so the expected square is $${fmtNum(d.startSquared)}+${fmtNum(d.variance)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The answer has to exceed the starting square of ${fmtNum(d.startSquared)}: a fair walk cannot pull the mid toward its reference on average, while it certainly spreads it out. And it does, at $${fmtNum(d.answer)}>${fmtNum(d.startSquared)}$.` },
  ],
  keyInsight: "A fair game leaves the mean alone and adds to the variance, and those two facts together are why the squared level grows linearly in time while the level itself does not drift. Subtracting that growth is exactly the correction that turns the squared walk back into a fair game of its own.",
  commonTrap: "Averaging the distance rather than its square, which throws away the spread the question is about. The other slip is adding the per-step move rather than its square, which gets the units wrong.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  // Both are real: the 2 in a^2 and E[X^2], and the 0 in E[S]=0.
  constants: [2, 0],
};
