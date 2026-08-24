import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const determinantScalingAndPower: ProblemTemplate = {
  id: "linear-algebra/determinant-scaling-and-power",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "jump", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "how scaling and powering a matrix move its determinant" },
  params: {
    n: { choices: [3, 4, 5, 6] },
    scale: { choices: [2, 3, 4, 5] },
    det: { choices: [2, 3, 4, 5, 6, 7, 8, 10, 12] },
    power: { choices: [2, 3] },
  },
  // The bound is on the FINAL determinant, which the power inflates hard: the scale factor is
  // inside the power, not beside it.
  constraint: (p) => Math.pow(Math.pow(p.scale, p.n) * p.det, p.power) < 1e12,
  derived: (p) => ({
    scaleFactor: Math.pow(p.scale, p.n),
    scaledDet: Math.pow(p.scale, p.n) * p.det,
    detPowerAlone: Math.pow(p.det, p.power),
    answer: Math.pow(Math.pow(p.scale, p.n) * p.det, p.power),
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A ${fmtNum(p.n)} by ${fmtNum(p.n)} matrix has determinant ${fmtNum(p.det)}. Every entry of that matrix is then ` +
    `multiplied by ${fmtNum(p.scale)}, and the result is raised to the power ${fmtNum(p.power)}. ` +
    `What is the determinant of the matrix that comes out?`,
  solution: (p, d) => [
    { title: "Two rules, applied in the order the operations happen", body: `Scaling every entry by $c$ scales EACH of the $n$ rows by $c$, and the determinant is linear in each row separately — so it picks up $c$ to the $n$, not $c$ once. Raising to a power multiplies determinants: $\\text{det of a product}=\\text{product of the dets}$. The ORDER matters, because the second rule acts on whatever the first produced.` },
    { title: "Scaling first", body: `Multiplying every entry by ${fmtNum(p.scale)} in ${fmtNum(p.n)} dimensions multiplies the determinant by $${fmtNum(p.scale)}^{${fmtNum(p.n)}}=${fmtNum(d.scaleFactor)}$, taking it to $${fmtNum(d.scaleFactor)}\\times${fmtNum(p.det)}=${fmtNum(d.scaledDet)}$. This is the step where an answer usually goes wrong, because scaling every entry FEELS like a single factor.` },
    { title: "Then the power, applied to all of it", body: `The matrix being raised to the power ${fmtNum(p.power)} is the SCALED one, so what gets raised is ${fmtNum(d.scaledDet)} — not the original ${fmtNum(p.det)}. The scale factor sits inside the power, not beside it.` },
    { title: "Answer", body: `That gives $${fmtNum(d.scaledDet)}^{${fmtNum(p.power)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The dimension and the power compound on one another: the scale is felt ${fmtNum(p.n)} times over for the determinant, and then ${fmtNum(p.power)} times again for the power. Raising only the original determinant would have given ${fmtNum(d.detPowerAlone)}, short by the whole of the scaling: $${fmtNum(d.answer)}>${fmtNum(d.detPowerAlone)}$.` },
  ],
  keyInsight: "The determinant is a signed volume, so scaling every entry stretches all n dimensions at once and the factor compounds n times. That single fact explains why determinants of large matrices are numerically hopeless and why log-determinants are what actually gets computed.",
  commonTrap: "Multiplying the determinant by the scale once rather than raising the scale to the dimension — the error grows with the matrix. The other slip is raising the scale to the POWER as well, double counting an operation that only touches the determinant's exponent.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [],
};
