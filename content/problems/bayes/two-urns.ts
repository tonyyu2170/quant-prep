import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const twoUrns: ProblemTemplate = {
  id: "bayes/two-urns",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.6 }, { firm: "flow", weight: 0.5 }],
  source: { kind: "free-resource", inspiration: "classic: two-urn posterior" },
  params: {
    aRed: { choices: [2, 3, 4] },
    aBlue: { choices: [5, 6, 7] },
    bRed: { choices: [5, 6, 7] },
    bBlue: { choices: [2, 3] },
  },
  constraint: (p) => p.aRed / (p.aRed + p.aBlue) < p.bRed / (p.bRed + p.bBlue),
  derived: (p) => {
    const aTotal = p.aRed + p.aBlue;
    const bTotal = p.bRed + p.bBlue;
    const pRedA = p.aRed / aTotal;
    const pRedB = p.bRed / bTotal;
    const pRed = 0.5 * pRedA + 0.5 * pRedB;
    return { aTotal, bTotal, pRedA, pRedB, pRed, postA: (0.5 * pRedA) / pRed };
  },
  statement: (p) =>
    `Urn A holds ${p.aRed} red and ${p.aBlue} blue balls; urn B holds ${p.bRed} red and ${p.bBlue} blue. ` +
    `You choose an urn with a fair coin flip and draw one ball at random: it is red. ` +
    `What is the probability it came from urn A?`,
  answerKey: "postA",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $A$ = chose urn A, $R$ = drew red. The fair coin gives $P(A)=P(B)=0.5$.` },
    { title: "Likelihoods", body: `$P(R\\mid A)=${p.aRed}/${d.aTotal}=${fmtNum(d.pRedA)}$ and $P(R\\mid B)=${p.bRed}/${d.bTotal}=${fmtNum(d.pRedB)}$.` },
    { title: "Total red probability", body: `$P(R)=0.5\\times\\frac{${p.aRed}}{${d.aTotal}}+0.5\\times\\frac{${p.bRed}}{${d.bTotal}}=${fmtNum(d.pRed)}$.` },
    { title: "Posterior", body: `Both branches carry the same $0.5$, so it cancels out of the ratio and the two red fractions decide it between them: $P(A\\mid R)=\\dfrac{${p.aRed}/${d.aTotal}}{${p.aRed}/${d.aTotal}+${p.bRed}/${d.bTotal}}=${fmtNum(d.postA)}$.` },
    { title: "Sanity check", body: `Urn B is the red-heavy urn, so seeing red should pull the posterior below 0.5 — and $${fmtNum(d.postA)} < 0.5$ holds.` },
  ],
  keyInsight: "Posterior odds are prior odds times the likelihood ratio — with a fair coin, the red-fractions alone decide it.",
  commonTrap: "Comparing red counts instead of red fractions — urn sizes differ, so counts mislead.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [0.5],
};
