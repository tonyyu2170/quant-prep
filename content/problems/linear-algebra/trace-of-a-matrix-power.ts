import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const traceOfAMatrixPower: ProblemTemplate = {
  id: "linear-algebra/trace-of-a-matrix-power",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "power sums of eigenvalues from trace and determinant" },
  params: {
    trace: { choices: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    det: { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 20, 24] },
    power: { choices: [2, 3, 4] },
  },
  // Real eigenvalues only. A complex pair still has a real trace and the recursion still holds,
  // but "the sum of the eigenvalues each raised to that power" would then be describing two
  // numbers the reader cannot write down, and the sanity check loses its footing.
  constraint: (p) => p.trace * p.trace >= 4 * p.det,
  derived: (p) => {
    const t2 = p.trace * p.trace - 2 * p.det;
    const t3 = p.trace * t2 - p.det * p.trace;
    const t4 = p.trace * t3 - p.det * t2;
    return {
      squareTrace: t2,
      cubeTrace: t3,
      answer: p.power === 2 ? t2 : p.power === 3 ? t3 : t4,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A two by two matrix has trace ${fmtNum(p.trace)} and determinant ${fmtNum(p.det)}. ` +
    `What is the trace of that matrix raised to the power ${fmtNum(p.power)}?`,
  solution: (p, d) => [
    { title: "Powers act on the eigenvalues, not the entries", body: `Raising a matrix to a power raises each of its eigenvalues to that power and leaves the eigenvectors alone. Writing the two eigenvalues as $a$ and $b$, what is wanted is $\\text{trace of the power}=a^k+b^k$ — and none of the matrix's entries appear in it.` },
    { title: "One recursion generates every power", body: `Each eigenvalue satisfies its own characteristic equation, so each power sum is the trace times the previous one less the determinant times the one before that. Starting from the trace itself, everything follows.` },
    { title: "Run it up to the power asked for", body: `The first step gives $${fmtNum(p.trace)}\\times${fmtNum(p.trace)}-2\\times${fmtNum(p.det)}=${fmtNum(d.squareTrace)}$, and the next gives $${fmtNum(p.trace)}\\times${fmtNum(d.squareTrace)}-${fmtNum(p.det)}\\times${fmtNum(p.trace)}=${fmtNum(d.cubeTrace)}$. Each line is recomputed from the original trace and determinant, never from a rounded step.` },
    { title: "Answer", body: `At power ${fmtNum(p.power)} the trace is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The recursion never asked what the entries were, only the trace ${fmtNum(p.trace)} and determinant ${fmtNum(p.det)} — so every matrix sharing those two numbers has the same answer, however different its entries look.` },
  ],
  keyInsight: "The trace of a power is a power sum of the eigenvalues, and power sums obey a recursion driven by the characteristic polynomial. That turns an apparently heavy matrix computation into a two-term recurrence you can run in your head.",
  commonTrap: "Raising the trace itself to the power, which double counts the cross terms — the square of a sum is not the sum of squares. The other slip is dropping the determinant term, which is exactly the correction those cross terms need.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [2, 4],
};
