import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A walk of L unit steps ending at height h has u ups and d downs with u+d=L, u-d=h,
// so the count is C(L, u) = C(L, (L+h)/2). Parity is forced: L and h share parity.
export const stepsToHeight: ProblemTemplate = {
  id: "counting/steps-to-height",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.5 }, { firm: "sig", weight: 0.4 }],
  source: { kind: "free-resource", inspiration: "counting plus/minus-one step sequences that end at a fixed level" },
  params: {
    steps: { range: { min: 8, max: 16, step: 1 } },
    height: { range: { min: 2, max: 6, step: 1 } },
  },
  constraint: (p) => (p.steps + p.height) % 2 === 0 && p.height < p.steps,
  derived: (p) => {
    const ups = (p.steps + p.height) / 2;
    const downs = (p.steps - p.height) / 2;
    let count = 1;
    for (let i = 0; i < downs; i++) count = (count * (p.steps - i)) / (i + 1);
    // twiceUps is printed in the solution, so it has to be a derived value: the emitter traces
    // every number in the prose back to a param, a derived key, or a declared constant, and an
    // expression computed inline at the interpolation site traces to nothing.
    return { ups, downs, twiceUps: p.steps + p.height, count: Math.round(count) };
  },
  statement: (p) =>
    `A robot starts on the ground and takes ${fmtNum(p.steps)} unit steps, each chosen independently: one step up or one step down, never sideways. After all ${fmtNum(p.steps)} steps it stands exactly ${fmtNum(p.height)} units above the ground. How many distinct up/down step sequences put it there?`,
  answerKey: "count",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Name the two step types", body: `Suppose the robot takes $u$ steps up and $d$ steps down. The totals must satisfy $u+d=${fmtNum(p.steps)}$ (all steps are taken) and $u-d=${fmtNum(p.height)}$ (net height gained).` },
    { title: "Solve the pair", body: `Adding the equations gives $2u=${fmtNum(d.twiceUps)}$, so $u=${fmtNum(d.ups)}$ and $d=${fmtNum(d.downs)}$.` },
    { title: "Choose the up-steps", body: `A sequence is fixed by choosing which of the ${fmtNum(p.steps)} slots hold the up-steps, so the count is $\\binom{${fmtNum(p.steps)}}{${fmtNum(d.ups)}}=${fmtNum(d.count)}$.` },
    { title: "Sanity check", body: `The count of all walks is dominated by the balanced middle, and a net height of ${fmtNum(p.height)} sits near that middle here, so ${fmtNum(d.count)} is large but stays below $2^{${fmtNum(p.steps)}}$, the count of every possible sequence.` },
  ],
  keyInsight: "An endpoint fixes the split between up-steps and down-steps through two linear equations — after that the question is nothing but choosing which slots get the ups.",
  commonTrap: "Forgetting the parity pairing of steps and height: an endpoint of the wrong parity is unreachable, and forcing a count there signals an arithmetic slip in solving for u and d.",
  expectedPaceS: 75,
  constants: [2],
  verify: { method: "brute-force" },
};
