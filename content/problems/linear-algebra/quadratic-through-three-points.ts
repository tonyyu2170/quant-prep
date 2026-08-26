import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const quadraticThroughThreePoints: ProblemTemplate = {
  id: "linear-algebra/quadratic-through-three-points",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "millennium", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "a three by three Vandermonde system solved by finite differences" },
  // The three heights are drawn at consecutive x, which makes the Vandermonde system solvable
  // by differencing rather than by elimination — and keeps every printed operand an integer.
  params: {
    y1: { choices: [-6, -4, -2, 1, 2, 3, 5, 7, 9] },
    y2: { choices: [-5, -3, 1, 2, 4, 6, 8, 10, 12] },
    y3: { choices: [-8, -2, 3, 5, 7, 11, 14, 18, 22] },
    t:  { choices: [0, 5, 6, 7, 8, 10] },
  },
  // A vanishing second difference is a straight line wearing a quadratic's clothes: the whole
  // teaching point collapses and the linear-extrapolation trap becomes the right answer.
  constraint: (p) => p.y3 - 2 * p.y2 + p.y1 !== 0,
  derived: (p) => {
    const d1 = p.y2 - p.y1;
    const d2 = p.y3 - 2 * p.y2 + p.y1;
    return {
      d1,
      dSecond: p.y3 - p.y2,
      d2,
      steps: p.t - 1,
      stepsLess: p.t - 2,
      pairs: ((p.t - 1) * (p.t - 2)) / 2,
      linearOnly: p.y1 + (p.t - 1) * d1,
      answer: p.y1 + (p.t - 1) * d1 + (((p.t - 1) * (p.t - 2)) / 2) * d2,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A quadratic passes through three points whose x-coordinates are 1, 2 and 3. Its heights there are ` +
    `${fmtNum(p.y1)}, ${fmtNum(p.y2)} and ${fmtNum(p.y3)} in that order. What is its height at x equal to ${fmtNum(p.t)}?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "Three points, three coefficients — but do not solve for them", body: `Fitting $ax^2+bx+c$ through three heights is a three by three system, and it can be run that way. At equally spaced x there is a shorter road: a quadratic has a CONSTANT second difference, so the table of differences carries the same information the coefficients do and needs no elimination.` },
      { title: "Difference the heights once, then twice", body: `Neighbouring heights differ by $${op(p.y2)}-${op(p.y1)}=${fmtNum(d.d1)}$ and then by $${op(p.y3)}-${op(p.y2)}=${fmtNum(d.dSecond)}$. Differencing those two gives $${op(d.dSecond)}-${op(d.d1)}=${fmtNum(d.d2)}$, and for a quadratic that number never changes however far the table is extended.` },
      { title: "Step out to the point asked for", body: `From the first point it is ${fmtNum(d.steps)} steps to the target. Newton's forward formula adds the first difference once per step and the second difference once per PAIR of steps: $${op(p.y1)}+${op(d.steps)}\\times${op(d.d1)}+\\dfrac{${op(d.steps)}\\times${op(d.stepsLess)}}{2}\\times${op(d.d2)}=${fmtNum(d.answer)}$.` },
      { title: "Answer", body: `The height at x equal to ${fmtNum(p.t)} is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `Had the curve been a straight line through the first two points it would have reached only $${op(p.y1)}+${op(d.steps)}\\times${op(d.d1)}=${fmtNum(d.linearOnly)}$. The gap between that and the answer is entirely the curvature term, which is why a vanishing second difference would have made the two agree.` },
    ];
  },
  keyInsight: "Three points at equally spaced x determine a quadratic, and the finite-difference table solves the Vandermonde system for free: the second difference IS twice the leading coefficient. Newton's forward formula then reads off any other height without ever naming a, b or c.",
  commonTrap: "Extrapolating with the first difference alone, which is a straight line and ignores the curvature the three points were given to establish. The other slip is dropping the halving on the second-difference term — it enters once per pair of steps, not once per step.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1, 2, 3],
};
