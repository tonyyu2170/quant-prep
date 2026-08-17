import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Three hypotheses, two observations: three data vendors with different bad-tick rates, and
// TWO independent bad ticks observed from whichever vendor was active — squaring each vendor's
// own rate rather than doubling it. Posterior asked on Vendor C, the worst of the three.
export const dataVendorWorstSource: ProblemTemplate = {
  id: "bayes/data-vendor-worst-source",
  version: 1,
  topic: "probability/bayes",
  difficulty: 3,
  firms: [{ firm: "drw", weight: 0.5 }, { firm: "akuna", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: multi-source posterior extended to repeated independent evidence" },
  params: {
    shareA: { choices: [0.2, 0.3, 0.4] },
    shareB: { choices: [0.2, 0.3, 0.4] },
    rateA: { choices: [0.01, 0.02, 0.03] },
    rateB: { choices: [0.02, 0.03, 0.04] },
    rateC: { choices: [0.05, 0.06, 0.08] },
  },
  // rateC's minimum (0.05) exceeds both rateA's and rateB's maximums (0.03 and 0.04), so Vendor
  // C is always the strictly worst of the three, and shareA+shareB never reaches 0.8, leaving
  // Vendor C a positive share on every draw. Also excludes the few combinations where Vendor
  // C's rate so overwhelms the other two that the share-weighted posterior collapses onto the
  // unweighted (equal-prior) trap almost exactly.
  constraint: (p) => {
    if (!(p.rateC > p.rateA && p.rateC > p.rateB)) return false;
    const shareC = 1 - p.shareA - p.shareB;
    const likeA = p.rateA * p.rateA;
    const likeB = p.rateB * p.rateB;
    const likeC = p.rateC * p.rateC;
    const massA = p.shareA * likeA;
    const massB = p.shareB * likeB;
    const massC = shareC * likeC;
    const postC = massC / (massA + massB + massC);
    const trapValue = likeC / (likeA + likeB + likeC);
    return Math.abs(postC - trapValue) > 0.01;
  },
  derived: (p) => {
    const shareC = 1 - p.shareA - p.shareB;
    const likeA = p.rateA * p.rateA;
    const likeB = p.rateB * p.rateB;
    const likeC = p.rateC * p.rateC;
    const massA = p.shareA * likeA;
    const massB = p.shareB * likeB;
    const massC = shareC * likeC;
    const totalMass = massA + massB + massC;
    const postC = massC / totalMass;
    return { shareC, likeA, likeB, likeC, massA, massB, massC, totalMass, postC };
  },
  statement: (p, d) =>
    `A trading system sources market-data ticks from one of three vendors each day, chosen according to historical usage: Vendor A ${pc(p.shareA)}% of days, Vendor B ${pc(p.shareB)}% of days, and Vendor C the remaining ${pc(d.shareC)}%. ` +
    `Each tick arrives corrupted independently of the others, at a rate that depends on the vendor: ${pc(p.rateA)}% for Vendor A, ${pc(p.rateB)}% for Vendor B, and ${pc(p.rateC)}% for Vendor C. ` +
    `Today, two ticks are checked at random and BOTH come back corrupted. What is the probability today's data came from Vendor C, the worst of the three?`,
  answerKey: "postC",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $A,B,C$ = active vendor. Given $P(A)=${p.shareA}$, $P(B)=${p.shareB}$, $P(C)=1-${p.shareA}-${p.shareB}=${fmtNum(d.shareC)}$, and per-tick corruption rates $${p.rateA}$, $${p.rateB}$, $${p.rateC}$ respectively.` },
    { title: "Likelihood of two independent bad ticks", body: `Squaring each vendor's own rate: $P(\\text{2 bad}\\mid A)=${p.rateA}^2=${fmtNum(d.likeA)}$, $P(\\text{2 bad}\\mid B)=${p.rateB}^2=${fmtNum(d.likeB)}$, $P(\\text{2 bad}\\mid C)=${p.rateC}^2=${fmtNum(d.likeC)}$.` },
    { title: "Joint masses", body: `$${p.shareA}\\times${fmtNum(d.likeA)}=${fmtNum(d.massA)}$, $${p.shareB}\\times${fmtNum(d.likeB)}=${fmtNum(d.massB)}$, $${fmtNum(d.shareC)}\\times${fmtNum(d.likeC)}=${fmtNum(d.massC)}$.` },
    { title: "Posterior", body: `$P(\\text{2 bad})=${fmtNum(d.massA)}+${fmtNum(d.massB)}+${fmtNum(d.massC)}=${fmtNum(d.totalMass)}$, so $P(C\\mid\\text{2 bad})=${fmtNum(d.massC)}/${fmtNum(d.totalMass)}=${fmtNum(d.postC)}$.` },
    { title: "Sanity check", body: `Vendor C has the highest bad-tick rate, so squaring only widens its lead over the other two ($${fmtNum(d.likeC)}$ versus $${fmtNum(d.likeA)}$ and $${fmtNum(d.likeB)}$) — strongly enough that two bad ticks in a row must pull Vendor C's posterior above its raw ${fmtNum(d.shareC)} usage share, and $${fmtNum(d.postC)} > ${fmtNum(d.shareC)}$ holds.` },
  ],
  keyInsight: "Independent repeated evidence doesn't add to a hypothesis's single-event rate, it exponentiates it — squaring a bad-tick rate widens the gap between vendors far more than doubling would, which is exactly why two corrupted ticks in a row can overturn a modest prior-share disadvantage that a single bad tick couldn't.",
  commonTrap: "Ranking the three vendors purely by their squared bad-tick likelihoods and picking whichever has the largest one, without ever multiplying in how often each vendor is actually chosen — the posterior needs prior share times likelihood for every hypothesis, not just the biggest likelihood standing alone.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
