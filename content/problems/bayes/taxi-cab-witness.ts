import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, pc, complementGrades } from "../util";

// Witness reliability / taxi-cab structure with asymmetric accuracy and a fleet-count base
// rate hop — layered reasoning (L3).
// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
  const total = p.blueCount + p.greenCount;
  const pBlue = p.blueCount / total;
  const pGreen = p.greenCount / total;
  const missBlue = 1 - p.accGreen;
  const numBlue = pBlue * p.accBlue;
  const numGreenAsBlue = pGreen * missBlue;
  const denom = numBlue + numGreenAsBlue;
  const postBlue = numBlue / denom;
  return { total, pBlue, pGreen, missBlue, numBlue, numGreenAsBlue, denom, postBlue };
};

export const taxiCabWitness: ProblemTemplate = {
  id: "bayes/taxi-cab-witness",
  version: 1,
  topic: "probability/bayes",
  difficulty: 3,
  firms: [{ firm: "de-shaw", weight: 0.5 }, { firm: "two-sigma", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: taxicab witness-reliability problem (Kahneman & Tversky)" },
  params: {
    blueCount: { choices: [20, 30, 40] },
    greenCount: { choices: [120, 150, 180] },
    accBlue: { choices: [0.7, 0.75, 0.8, 0.85] },
    accGreen: { choices: [0.65, 0.7, 0.75, 0.8] },
  },
  constraint: (p) => !complementGrades(derive(p).postBlue),
  derived: derive,
  statement: (p) =>
    `A city's cab fleet has ${p.blueCount} Blue cabs and ${p.greenCount} Green cabs. A witness to a hit-and-run says the cab was Blue; the witness always names one of the two colors. ` +
    `Tested under similar conditions, the witness correctly calls a Blue cab "Blue" ${pc(p.accBlue)}% of the time, and correctly calls a Green cab "Green" ${pc(p.accGreen)}% of the time. ` +
    `Given the witness said Blue, what is the probability the cab actually was Blue?`,
  answerKey: "postBlue",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $B$, $G$ = the cab is Blue or Green, $W$ = witness says Blue. Fleet: $${p.blueCount}$ Blue, $${p.greenCount}$ Green, $${fmtNum(d.total)}$ total.` },
    { title: "Base rates from the fleet", body: `$P(B)=${p.blueCount}/${fmtNum(d.total)}=${fmtNum(d.pBlue)}$, $P(G)=${p.greenCount}/${fmtNum(d.total)}=${fmtNum(d.pGreen)}$.` },
    { title: "Likelihoods", body: `$P(W\\mid B)=${p.accBlue}$ (the witness's Blue accuracy). $P(W\\mid G)$ is one minus the witness's Green accuracy $${p.accGreen}$, giving $${fmtNum(d.missBlue)}$.` },
    { title: "Combine", body: `$\\frac{${p.blueCount}}{${fmtNum(d.total)}}\\times${p.accBlue}=${fmtNum(d.numBlue)}$ and $\\frac{${p.greenCount}}{${fmtNum(d.total)}}\\times${fmtNum(d.missBlue)}=${fmtNum(d.numGreenAsBlue)}$, so $P(W)=${fmtNum(d.denom)}$. Every branch carries the same fleet size ${fmtNum(d.total)} underneath, so it cancels and the two cab counts weigh against each other directly: $P(B\\mid W)=\\dfrac{${p.blueCount}\\times${p.accBlue}}{${p.blueCount}\\times${p.accBlue}+${p.greenCount}\\times${fmtNum(d.missBlue)}}=${fmtNum(d.postBlue)}$.` },
    { title: "Sanity check", body: `Both accuracies beat a coin flip and together exceed a full point ($${p.accBlue}+${p.accGreen}$ is above $1$), which is exactly what's needed for the testimony to raise the odds of Blue above the fleet's raw share — and $${fmtNum(d.postBlue)} > ${fmtNum(d.pBlue)}$ holds.` },
  ],
  keyInsight: "When a witness's accuracy differs by color, you need both conditional rates — the rate of a false 'Blue' call isn't one minus the Blue accuracy, it's one minus the OTHER color's accuracy.",
  commonTrap: "Using the same accuracy rate for both 'said Blue given Blue' and 'said Blue given Green' — the second is one minus the Green accuracy, not one minus the Blue accuracy.",
  expectedPaceS: 135,
  verify: { method: "brute-force" },
  constants: [1],
};
