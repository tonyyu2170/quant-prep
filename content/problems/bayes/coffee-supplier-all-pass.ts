import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Evidence from a run of all-pass samples: two suppliers with different (and non-overlapping)
// defect rates, an asymmetric prior, and a sample size n that compounds the likelihood ratio.
export const coffeeSupplierAllPass: ProblemTemplate = {
  id: "bayes/coffee-supplier-all-pass",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "akuna", weight: 0.5 }, { firm: "drw", weight: 0.4 }],
  source: { kind: "free-resource", inspiration: "classic: identifying a data source from a run of matching independent trials" },
  params: {
    priorA: { choices: [0.3, 0.4, 0.5, 0.6, 0.7] },
    defA: { choices: [0.02, 0.05, 0.08] },
    defB: { choices: [0.1, 0.15, 0.2, 0.25] },
    n: { choices: [2, 3, 4, 5] },
  },
  derived: (p) => {
    const priorB = 1 - p.priorA;
    const passA = 1 - p.defA;
    const passB = 1 - p.defB;
    const passAn = Math.pow(passA, p.n);
    const passBn = Math.pow(passB, p.n);
    const numA = p.priorA * passAn;
    const numB = priorB * passBn;
    const denom = numA + numB;
    const postA = numA / denom;
    return { priorB, passA, passB, passAn, passBn, numA, numB, denom, postA };
  },
  statement: (p) =>
    `A roastery buys coffee beans from two suppliers. Historically, ${pc(p.priorA)}% of incoming batches come from Supplier A and the rest from Supplier B. ` +
    `${pc(p.defA)}% of Supplier A's beans are defective, and ${pc(p.defB)}% of Supplier B's beans are defective, each bean independently. ` +
    `A quality inspector doesn't know which supplier a new batch came from and tests ${p.n} randomly selected beans from it — all ${p.n} pass inspection. What is the probability the batch came from Supplier A?`,
  answerKey: "postA",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $A,B$ = supplier, $P$ = all ${p.n} tested beans pass. Given $P(A)=${p.priorA}$, $P(B)=${fmtNum(d.priorB)}$, per-bean pass rates $P(\\text{pass}\\mid A)=1-${p.defA}=${fmtNum(d.passA)}$ and $P(\\text{pass}\\mid B)=1-${p.defB}=${fmtNum(d.passB)}$.` },
    { title: "Likelihood of the whole sample", body: `With ${p.n} beans tested independently, $P(P\\mid A)=${fmtNum(d.passA)}^{${p.n}}=${fmtNum(d.passAn)}$ and $P(P\\mid B)=${fmtNum(d.passB)}^{${p.n}}=${fmtNum(d.passBn)}$.` },
    { title: "Joint masses", body: `$${p.priorA}\\times${fmtNum(d.passA)}^{${p.n}}=${fmtNum(d.numA)}$ for Supplier A, $${fmtNum(d.priorB)}\\times${fmtNum(d.passB)}^{${p.n}}=${fmtNum(d.numB)}$ for Supplier B.` },
    { title: "Posterior", body: `$P(P)=${p.priorA}\\times${fmtNum(d.passA)}^{${p.n}}+${fmtNum(d.priorB)}\\times${fmtNum(d.passB)}^{${p.n}}=${fmtNum(d.denom)}$, so $P(A\\mid P)=\\dfrac{${p.priorA}\\times${fmtNum(d.passA)}^{${p.n}}}{${p.priorA}\\times${fmtNum(d.passA)}^{${p.n}}+${fmtNum(d.priorB)}\\times${fmtNum(d.passB)}^{${p.n}}}=${fmtNum(d.postA)}$.` },
    { title: "Sanity check", body: `Supplier A's per-bean pass rate exceeds Supplier B's in every case here, so a run of all-clean beans can only push the posterior above the raw prior — and $${fmtNum(d.postA)} > ${p.priorA}$ holds.` },
  ],
  keyInsight: "When two hypotheses start with unequal prior weight, a string of matching evidence has to overcome the prior imbalance as well as the likelihood gap — the prior odds and the per-item likelihood ratio raised to the sample size both get multiplied together in one update, not evaluated separately.",
  commonTrap: "Swapping which defect rate belongs to which supplier when computing the two branch likelihoods — since both suppliers' 'all pass' probabilities look structurally identical (a pass rate raised to the sample size), it's easy to plug Supplier B's rate into Supplier A's branch or vice versa.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [1],
};
