import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` must reject draws with no solution at all — a zero
// answer is a fixed point of the mutation check — and it never sees `derived`.
const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b));
const solutionCount = (a: number, b: number, c: number) => {
  let n = 0;
  for (let x = 0; x * a <= c; x++) if ((c - x * a) % b === 0) n++;
  return n;
};

export const diophantineCountSolutions: ProblemTemplate = {
  id: "number-theory/diophantine-count-solutions",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "counting the non-negative solutions of a two-variable linear equation" },
  params: {
    a: { choices: [3, 4, 5, 6, 7, 8, 9, 11] },
    b: { choices: [5, 7, 8, 9, 11, 13, 16, 17] },
    c: { choices: [120, 150, 180, 210, 240, 280, 300, 360, 420, 480] },
  },
  // The last conjunct keeps a boundary solution — none of one size — in the space. Without it,
  // counting only mixed loads landed on the true count for 126 of 409 draws, which is exactly
  // the slip `commonTrap` names (tools/trap-audit.ts).
  constraint: (p) => p.a < p.b && gcdOf(p.a, p.b) === 1 && solutionCount(p.a, p.b, p.c) >= 1 && (p.c % p.a === 0 || p.c % p.b === 0),
  derived: (p) => ({
    // Both the true quotient and its floor. The gate reconciles a printed chain against what is
    // actually on the page, and `c/a = floor` is simply false — 180/11 is 16.36, not 16. There
    // is no \lfloor in the allowlist either, so the division is printed honestly and the
    // flooring is done in words.
    exactQuotient: Math.round((p.c / p.a) * 1e9) / 1e9,
    maxFirst: Math.floor(p.c / p.a),
    stride: p.a * p.b,
    span: Math.floor(p.c / (p.a * p.b)),
    answer: solutionCount(p.a, p.b, p.c),
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `A shipper packs a load using crates holding ${fmtNum(p.a)} units and crates holding ` +
    `${fmtNum(p.b)} units, with every crate filled completely and no partial crates. The load ` +
    `is exactly ${fmtNum(p.c)} units. In how many different ways can the two crate sizes be combined?`,
  solution: (p, d) => [
    { title: "Fix one count and the other is forced", body: `Choose how many small crates to use. What remains must be filled by large crates alone, so it must divide evenly by the large size — there is no freedom left. Every solution is therefore named by its small-crate count, and the question is how many of those counts work. In symbols the load reads $ax+by=c$, with $x$ and $y$ the two crate counts.` },
    { title: "Solutions come at a regular spacing", body: `Once one solution is found, trading ${fmtNum(p.b)} small crates for ${fmtNum(p.a)} large ones moves the load by nothing at all and gives another. So the working counts sit ${fmtNum(p.b)} apart, and because the two sizes share no factor above one, nothing closer than that ever works.` },
    { title: "How many fit in range", body: `The small-crate count runs from none upward, and cannot pass $\\dfrac{${fmtNum(p.c)}}{${fmtNum(p.a)}}=${fmtNum(d.exactQuotient)}$ — so at most ${fmtNum(d.maxFirst)} whole crates. Solutions ${fmtNum(p.b)} apart inside that range number ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `There are ${fmtNum(d.answer)} ways.` },
    { title: "Sanity check", body: `The count cannot exceed the ${fmtNum(d.maxFirst)} candidate small-crate counts, and does not: $${fmtNum(d.answer)}<${fmtNum(d.maxFirst)}$. Roughly one candidate in ${fmtNum(p.b)} works, which is what the regular spacing predicts — and had the two sizes shared a factor that did not divide the load, none would have worked at all.` },
  ],
  keyInsight: "A two-variable linear equation in whole numbers has its solutions evenly spaced, at a stride set by the two coefficients. So counting them is a range divided by that stride rather than a search, and the whole question turns on whether the coefficients share a factor.",
  commonTrap: "Dividing the load by the sum of the two crate sizes, which answers a different question entirely. The other slip is forgetting that using none of one size is a legitimate combination.",
  expectedPaceS: 125,
  verify: { method: "brute-force" },
  constants: [1],
};
