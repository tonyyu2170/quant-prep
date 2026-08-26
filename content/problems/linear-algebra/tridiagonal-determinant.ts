import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const tridiagonalDeterminant: ProblemTemplate = {
  id: "linear-algebra/tridiagonal-determinant",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the continuant recursion for a tridiagonal determinant" },
  params: {
    d: { choices: [-11, -10, -9, -8, -7, -6, -5, -4, -3, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    // Never one: one is its own square, so "forgot to square the off-diagonal" returns the
    // right answer there — 22.6% of draws before this axis started at two.
    b: { choices: [2, 3, 4, 5, 6, 7] },
    n: { choices: [3, 4, 5, 6, 7, 8] },
  },
  // Diagonal dominance keeps the recursion growing rather than folding back through zero,
  // which is what stops a long run of sizes from crowding its answers together.
  constraint: (p) => Math.abs(p.d) > p.b,
  derived: (p) => {
    const bb = p.b * p.b;
    let prev = 1, cur = p.d;
    for (let i = 2; i <= p.n; i++) { const next = p.d * cur - bb * prev; prev = cur; cur = next; }
    return {
      bb,
      two: p.d * p.d - bb,
      three: p.d * (p.d * p.d - bb) - bb * p.d,
      sizeLess: p.n - 1,
      answer: cur,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `${p.n === 8 ? "An" : "A"} ${fmtNum(p.n)} by ${fmtNum(p.n)} matrix has ${fmtNum(p.d)} in every position down its main diagonal, ` +
    `${fmtNum(p.b)} in every position immediately above and immediately below that diagonal, and zero everywhere ` +
    `else. What is its determinant?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "Expand along the first row and a recursion appears", body: `Expanding the determinant along its first row leaves two terms, because the row has only two non-zero entries. The first is the diagonal entry times the same problem one size smaller; the second, after its own expansion, is the off-diagonal SQUARED times the problem two sizes smaller. That is a two-term recursion: $D_n=dD_{n-1}-b^2D_{n-2}$.` },
      { title: "Start it off", body: `At size one the determinant is just the diagonal entry, ${fmtNum(p.d)}. At size two it is the leading diagonal less the other: $${op(p.d)}\\times${op(p.d)}-${op(p.b)}\\times${op(p.b)}=${fmtNum(d.two)}$. Note what the off-diagonal contributes — its square, since it is met once above the diagonal and once below.` },
      { title: "Run it up to the size asked for", body: `The next step is $${op(p.d)}\\times${op(d.two)}-${op(d.bb)}\\times${op(p.d)}=${fmtNum(d.three)}$, and each further size repeats the same two-term step, always rebuilt from the original ${fmtNum(p.d)} and ${fmtNum(p.b)} rather than from a rounded intermediate. Continuing to size ${fmtNum(p.n)} gives ${fmtNum(d.answer)}.` },
      { title: "Answer", body: `The determinant is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `The product down the diagonal alone would be ${fmtNum(p.d)} raised to the power ${fmtNum(p.n)}, and the true answer is smaller in size than that: the off-diagonal band always subtracts. It cannot be ignored, and it cannot be added in linearly either — it enters squared, once per pair of neighbouring rows.` },
    ];
  },
  keyInsight: "A tridiagonal determinant satisfies a two-term recursion, so an n by n problem costs n steps of mental arithmetic rather than an expansion with factorially many terms. The off-diagonal enters squared because it is met twice — once above the diagonal and once below.",
  commonTrap: "Taking the product down the diagonal and stopping, which ignores the band entirely. The other slip is subtracting the off-diagonal rather than its square: the recursion pairs the entry above the diagonal with the one below it, and their product is what appears.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
