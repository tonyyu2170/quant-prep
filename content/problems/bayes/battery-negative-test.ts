import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Negative-evidence update: P(defective | test NEGATIVE) — the direction everyone forgets to
// practice. The sanity check computes the mirror-image positive-test posterior for contrast.
export const batteryNegativeTest: ProblemTemplate = {
  id: "bayes/battery-negative-test",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "akuna", weight: 0.5 }, { firm: "hrt", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: base-rate update on a negative test result" },
  params: {
    prior: { choices: [0.02, 0.05, 0.08, 0.1, 0.15] },
    sens: { choices: [0.85, 0.9, 0.92, 0.95] },
    spec: { choices: [0.9, 0.93, 0.95, 0.97] },
  },
  // sens is always strictly below 1 (a negative result can never be fully conclusive) and
  // sens + spec always exceeds 1 (the test is genuinely informative) — true by choice range.
  constraint: (p) => p.sens < 1 && p.sens + p.spec > 1,
  derived: (p) => {
    const fnr = 1 - p.sens;
    const fpr = 1 - p.spec;
    const goodShare = 1 - p.prior;
    const massDefectiveNeg = p.prior * fnr;
    const massGoodNeg = goodShare * p.spec;
    const totalNeg = massDefectiveNeg + massGoodNeg;
    const postNeg = massDefectiveNeg / totalNeg;
    const massDefectivePos = p.prior * p.sens;
    const massGoodPos = goodShare * fpr;
    const totalPos = massDefectivePos + massGoodPos;
    const postPos = massDefectivePos / totalPos;
    return { fnr, fpr, goodShare, massDefectiveNeg, massGoodNeg, totalNeg, postNeg, massDefectivePos, massGoodPos, totalPos, postPos };
  },
  statement: (p) =>
    `A battery factory's QA line makes cells with a ${pc(p.prior)}% chance any given cell is internally defective. Its test correctly flags ${pc(p.sens)}% of defective cells as positive, and correctly clears ${pc(p.spec)}% of good cells as negative. ` +
    `A newly tested cell comes back NEGATIVE. What is the probability that cell is actually defective?`,
  answerKey: "postNeg",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $D$ = defective, $N$ = test negative. Given $P(D)=${p.prior}$, $P(N\\mid D)=1-${p.sens}=${fmtNum(d.fnr)}$ (false-negative rate), $P(N\\mid \\bar D)=${p.spec}$ (specificity).` },
    { title: "Negative-branch masses", body: `False-negative mass: $${p.prior}\\times${fmtNum(d.fnr)}=${fmtNum(d.massDefectiveNeg)}$. True-negative mass: $${fmtNum(d.goodShare)}\\times${p.spec}=${fmtNum(d.massGoodNeg)}$.` },
    { title: "Posterior", body: `$P(N)=${fmtNum(d.massDefectiveNeg)}+${fmtNum(d.massGoodNeg)}=${fmtNum(d.totalNeg)}$, so $P(D\\mid N)=${fmtNum(d.massDefectiveNeg)}/${fmtNum(d.totalNeg)}=${fmtNum(d.postNeg)}$.` },
    { title: "Sanity check", body: `For contrast, a POSITIVE result would instead use $P(+\\mid D)=${p.sens}$ and $P(+\\mid \\bar D)=${fmtNum(d.fpr)}$, giving masses $${p.prior}\\times${p.sens}=${fmtNum(d.massDefectivePos)}$ and $${fmtNum(d.goodShare)}\\times${fmtNum(d.fpr)}=${fmtNum(d.massGoodPos)}$, so $P(D\\mid +)=${fmtNum(d.postPos)}$. A negative result should push the defect probability below the ${p.prior} base rate while a positive one pushes it above — and $${fmtNum(d.postNeg)} < ${p.prior} < ${fmtNum(d.postPos)}$ holds.` },
  ],
  keyInsight: "A negative result is still evidence, and it moves the posterior in the opposite direction from a positive one — the false-negative rate (not the sensitivity) drives the matching numerator, and specificity (not the false-positive rate) drives the true-negative mass.",
  commonTrap: "Plugging the sensitivity and false-positive rate into the positive-test formula even though the test came back negative — the negative branch needs the false-negative rate and specificity instead, which swaps which numbers belong in the numerator.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1],
};
