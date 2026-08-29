import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
// `untripled` is the wrong answer `commonTrap` names second — the cap formula with a bare
// radius where it wants three times it. The constraint needs its value to reject the draws
// where it grades as correct, which is what licenses a second module-level helper here.
const untripled = (p: Params) => (p.depth * p.depth * (p.radius - p.depth)) / (4 * Math.pow(p.radius, 3));
const derive = (p: Params) => {
  const round = (x: number) => Math.round(x * 1e9) / 1e9;
  const capNumer = p.depth * p.depth * (3 * p.radius - p.depth);
  const sphereDenom = 4 * Math.pow(p.radius, 3);
  const frac = round(capNumer / sphereDenom);
  return { tripleRadius: 3 * p.radius, bracket: 3 * p.radius - p.depth, depthSquared: p.depth * p.depth, capNumer, sphereDenom, capFraction: frac, answer: p.wanted === 1 ? frac : round(1 - frac) };
};

export const sphericalCapFraction: ProblemTemplate = {
  id: "solid-geometry/spherical-cap-fraction",
  version: 1,
  topic: "pure-math/solid-geometry",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "drw", weight: 0.2 }, { firm: "imc", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the cap of a sphere as a fraction of the whole, where pi cancels" },
  params: {
    radius: { choices: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 24] },
    depth: { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16] },
    wanted: { choices: [1, 2] },
  },
  // The second conjunct closes the grading band around the slip `commonTrap` names second —
  // using the radius where the formula wants three times it. On a shallow fill both fractions
  // are near zero and the wrong one lands inside 0.5% of the right one (tools/trap-audit.ts).
  constraint: (p) => p.depth < p.radius && Math.abs(derive(p).answer - (p.wanted === 1 ? untripled(p) : 1 - untripled(p))) > 0.005 * derive(p).answer,
  derived: derive,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A spherical tank of radius ${fmtNum(p.radius)} metres is filled to a depth of ` +
    `${fmtNum(p.depth)} metres. ` +
    `${p.wanted === 1 ? `What FRACTION of the tank's capacity is that?` : `What fraction of the capacity remains EMPTY?`}`,
  solution: (p, d) => [
    { title: "Ask for a fraction and the constant disappears", body: `Both the cap and the whole sphere carry the same constant of proportionality, so a ratio of the two never needs it. That is worth doing deliberately: the fraction is exact arithmetic on whole numbers, while either volume alone is not.` },
    { title: "The two pieces, stripped of the constant", body: `A cap of depth $h$ on a sphere of radius $r$ contributes $h^2(3r-h)$, and the whole sphere contributes $4r^3$. Here the cap gives $${fmtNum(d.depthSquared)}\\times${fmtNum(d.bracket)}=${fmtNum(d.capNumer)}$, using $${fmtNum(d.tripleRadius)}-${fmtNum(p.depth)}=${fmtNum(d.bracket)}$.` },
    { title: "And the whole sphere", body: `That contributes $4\\times${fmtNum(p.radius)}\\times${fmtNum(p.radius)}\\times${fmtNum(p.radius)}=${fmtNum(d.sphereDenom)}$.` },
    { title: "Answer", body: `The filled fraction is $\\dfrac{${fmtNum(d.capNumer)}}{${fmtNum(d.sphereDenom)}}=${fmtNum(d.capFraction)}$${p.wanted === 1 ? "" : `, so the empty fraction is ${fmtNum(d.answer)}`}.` },
    { title: "Sanity check", body: `The tank is filled to ${fmtNum(p.depth)} of its ${fmtNum(d.tripleRadius)}-third radius, well short of the halfway mark at ${fmtNum(p.radius)} — and a sphere is narrow at the bottom, so the filled fraction must come in BELOW the depth's share of the diameter. It does. That narrowness is exactly why a spherical tank's gauge cannot be linear.` },
  ],
  keyInsight: "Asking for a fraction rather than a volume cancels the constant and leaves whole-number arithmetic, which is both exact and faster. It also exposes the real content: a sphere's cross-section shrinks toward the poles, so depth and volume are nowhere near proportional.",
  commonTrap: "Treating the filled fraction as the depth over the diameter, which assumes straight sides and badly overstates a shallow fill. The other slip is using the radius where the formula wants three times it.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [2, 3, 4],
};
