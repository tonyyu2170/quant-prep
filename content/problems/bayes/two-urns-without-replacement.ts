import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Compound evidence without replacement: two urns of different composition, an urn chosen by a
// fair coin, then TWO balls drawn from it without replacement — both red. Each urn's likelihood
// has to be computed with the without-replacement (dependent) formula, not squared as if the
// first ball were put back. Urn A is always the red-minority urn, by choice-range separation.
export const twoUrnsWithoutReplacement: ProblemTemplate = {
  id: "bayes/two-urns-without-replacement",
  version: 1,
  topic: "probability/bayes",
  difficulty: 3,
  firms: [{ firm: "imc", weight: 0.5 }, { firm: "flow", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: two-urn posterior extended to compound draws without replacement" },
  params: {
    aRed: { choices: [3, 4, 5] },
    aBlue: { choices: [6, 7, 8] },
    bRed: { choices: [7, 8, 9] },
    bBlue: { choices: [2, 3] },
  },
  // Urn A's red fraction never exceeds 5/11 ≈ 0.455 and Urn B's never falls below 7/12 ≈ 0.583,
  // so Urn A is always the red-minority urn — and both urns hold at least 2 red balls, so the
  // two-red draw is never impossible for either.
  constraint: (p) => {
    const aFrac = p.aRed / (p.aRed + p.aBlue);
    const bFrac = p.bRed / (p.bRed + p.bBlue);
    return aFrac < bFrac && p.aRed >= 2 && p.bRed >= 2;
  },
  derived: (p) => {
    const aTotal = p.aRed + p.aBlue;
    const bTotal = p.bRed + p.bBlue;
    const pTwoRedA = (p.aRed * (p.aRed - 1)) / (aTotal * (aTotal - 1));
    const pTwoRedB = (p.bRed * (p.bRed - 1)) / (bTotal * (bTotal - 1));
    const massA = 0.5 * pTwoRedA;
    const massB = 0.5 * pTwoRedB;
    const denom = massA + massB;
    const postA = massA / denom;
    // Whole-number branch weights: each urn's favourable ordered pairs scaled by the OTHER
    // urn's ordered-pair count, which clears both denominators and lets the posterior be
    // printed from exact integers instead of from two rounded masses.
    const crossA = p.aRed * (p.aRed - 1) * bTotal * (bTotal - 1);
    const crossB = p.bRed * (p.bRed - 1) * aTotal * (aTotal - 1);
    return { aTotal, bTotal, pTwoRedA, pTwoRedB, massA, massB, denom, postA, crossA, crossB };
  },
  statement: (p) =>
    `Urn A holds ${p.aRed} red and ${p.aBlue} blue balls; Urn B holds ${p.bRed} red and ${p.bBlue} blue balls. An urn is chosen with a fair coin flip, then two balls are drawn from it one after another WITHOUT replacement. ` +
    `Both balls drawn are red. What is the probability Urn A was chosen?`,
  answerKey: "postA",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $A$ = Urn A chosen, $RR$ = both draws red. The fair coin gives $P(A)=P(B)=0.5$. Urn A has ${p.aRed} red of ${fmtNum(d.aTotal)} total; Urn B has ${p.bRed} red of ${fmtNum(d.bTotal)} total.` },
    { title: "Without-replacement likelihood per urn", body: `Urn A: $P(RR\\mid A)=\\dfrac{${p.aRed}}{${fmtNum(d.aTotal)}}\\times\\dfrac{${p.aRed}-1}{${fmtNum(d.aTotal)}-1}=${fmtNum(d.pTwoRedA)}$. Urn B: $P(RR\\mid B)=\\dfrac{${p.bRed}}{${fmtNum(d.bTotal)}}\\times\\dfrac{${p.bRed}-1}{${fmtNum(d.bTotal)}-1}=${fmtNum(d.pTwoRedB)}$ — each urn loses one of its own red balls and one of its own total after the first draw, so the two urns' second-draw odds are never interchangeable.` },
    { title: "Combine", body: `The fair coin puts the same $0.5$ on both branches, so it cancels out of the posterior and the two likelihoods weigh against each other on their own. Scale both by $${fmtNum(d.aTotal)}\\times(${fmtNum(d.aTotal)}-1)\\times${fmtNum(d.bTotal)}\\times(${fmtNum(d.bTotal)}-1)$ to clear the denominators, and the weights come out whole: Urn A carries $${p.aRed}\\times(${p.aRed}-1)\\times${fmtNum(d.bTotal)}\\times(${fmtNum(d.bTotal)}-1)=${fmtNum(d.crossA)}$ and Urn B carries $${p.bRed}\\times(${p.bRed}-1)\\times${fmtNum(d.aTotal)}\\times(${fmtNum(d.aTotal)}-1)=${fmtNum(d.crossB)}$.` },
    { title: "Posterior", body: `$P(A\\mid RR)=\\dfrac{${fmtNum(d.crossA)}}{${fmtNum(d.crossA)}+${fmtNum(d.crossB)}}=${fmtNum(d.postA)}$.` },
    { title: "Sanity check", body: `Urn A is the red-minority urn even before any draws happen ($${fmtNum(d.pTwoRedA)} < ${fmtNum(d.pTwoRedB)}$ for two reds in a row), so drawing two reds should pull the posterior toward Urn B, keeping $P(A\\mid RR)$ below $0.5$ — and $${fmtNum(d.postA)} < 0.5$ holds.` },
  ],
  keyInsight: "Compound evidence still combines with the prior exactly as single-draw evidence does — the only change is that each urn's own likelihood of producing that evidence now has to account for its own composition shrinking by one ball between draws.",
  commonTrap: "Squaring the single-draw red fraction for each urn, as if the first ball were replaced before the second draw — ignoring that the draws are without replacement changes each urn's own odds, and not necessarily by the same amount for both urns.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [0.5, 1],
};
