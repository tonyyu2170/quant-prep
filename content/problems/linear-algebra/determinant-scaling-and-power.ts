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
  constraint: (p) => Math.pow(p.scale, p.n) * Math.pow(p.det, p.power) < 1e12,
  derived: (p) => ({
    scaleFactor: Math.pow(p.scale, p.n),
    detPower: Math.pow(p.det, p.power),
    answer: Math.pow(p.scale, p.n) * Math.pow(p.det, p.power),
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A ${fmtNum(p.n)} by ${fmtNum(p.n)} matrix has determinant ${fmtNum(p.det)}. Every entry of that matrix is then ` +
    `multiplied by ${fmtNum(p.scale)}, and the result is raised to the power ${fmtNum(p.power)}. ` +
    `What is the determinant of the matrix that comes out?`,
  solution: (p, d) => [
    { title: "Two rules, applied in the order the operations happen", body: `Scaling every entry by $c$ scales EACH of the $n$ rows by $c$, and the determinant is linear in each row separately — so it picks up $c$ to the $n$, not $c$ once. Raising to a power multiplies determinants: $\\text{det of a product}=\\text{product of the dets}$.` },
    { title: "Scaling first", body: `Multiplying every entry by ${fmtNum(p.scale)} in ${fmtNum(p.n)} dimensions multiplies the determinant by $${fmtNum(p.scale)}^{${fmtNum(p.n)}}=${fmtNum(d.scaleFactor)}$. This is the step where an answer usually goes wrong, because scaling entries FEELS like a single factor.` },
    { title: "Then the power", body: `Raising to the power ${fmtNum(p.power)} raises the determinant to that power too. Applied to the original ${fmtNum(p.det)}, that is $${fmtNum(p.det)}^{${fmtNum(p.power)}}=${fmtNum(d.detPower)}$.` },
    { title: "Answer", body: `Both factors together give $${fmtNum(d.scaleFactor)}\\times${fmtNum(d.detPower)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Note the asymmetry: the SIZE of the matrix appears in the scaling exponent but nowhere in the power step. Doubling the entries of a big matrix moves its determinant far more than doubling those of a small one, which is why a determinant is a volume rather than a length.` },
  ],
  keyInsight: "The determinant is a signed volume, so scaling every entry stretches all n dimensions at once and the factor compounds n times. That single fact explains why determinants of large matrices are numerically hopeless and why log-determinants are what actually gets computed.",
  commonTrap: "Multiplying the determinant by the scale once rather than raising the scale to the dimension — the error grows with the matrix. The other slip is raising the scale to the POWER as well, double counting an operation that only touches the determinant's exponent.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [],
};
