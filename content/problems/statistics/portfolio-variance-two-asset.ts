import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Variances and the covariance are given directly as integers rather than as standard
// deviations and a correlation, and the weights are tenths. That is not cosmetic: with
// variances a multiple of 100 and the covariance a multiple of 50, every printed term
// w^2*varA, (1-w)^2*varB and 2w(1-w)cov is an exact integer, so no printed chain ever
// carries a rounded operand into the next step. Math.round only removes float dirt.
export const portfolioVarianceTwoAsset: ProblemTemplate = {
  id: "statistics/portfolio-variance-two-asset",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }, { firm: "millennium", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "variance of a two-asset book from the covariance matrix" },
  params: {
    varA: { choices: [100, 400, 900, 1600, 2500] },
    varB: { choices: [100, 400, 900, 1600, 2500] },
    cov: { choices: [-600, -450, -300, -150, 150, 300, 450, 600] },
    w: { range: { min: 0.1, max: 0.9, step: 0.1 } },
  },
  // Cauchy-Schwarz: a covariance matrix with |cov| >= sd_A sd_B is not positive definite, and
  // the question would be asking about a pair of series that cannot exist.
  constraint: (p) => p.cov * p.cov < p.varA * p.varB,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;   // matches verification/solvers/statistics.py
    const wB = round(1 - p.w);
    const termA = round(p.w ** 2 * p.varA);
    const termB = round(wB ** 2 * p.varB);
    const cross = round(2 * p.w * wB * p.cov);
    return {
      wB, termA, termB, cross,
      sdA: Math.sqrt(p.varA), sdB: Math.sqrt(p.varB),
      rho: round(p.cov / (Math.sqrt(p.varA) * Math.sqrt(p.varB))),
      noCross: round(termA + termB),          // what forgetting the cross term would give
      answer: round(termA + termB + cross),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A book runs two strategies. Daily P&L on A has variance ${fmtNum(p.varA)}, daily P&L on B has variance ${fmtNum(p.varB)}, and the covariance between them is ${fmtNum(p.cov)} — all in squared basis points. ` +
    `You allocate a fraction ${fmtNum(p.w)} of the book to A and the remaining ${fmtNum(d.wB)} to B, so the daily P&L is that weighted blend of the two. ` +
    `What is the variance of the combined book's daily P&L?`,
  solution: (p, d) => [
    { title: "Variance of a weighted sum has three terms, not two", body: `For a blend of two series, $\\text{Var}(aX+bY)=a^2\\text{Var}(X)+b^2\\text{Var}(Y)+2ab\\,\\text{Cov}(X,Y)$ — the two own-variance terms plus twice the weighted covariance. The weights enter the own terms squared and the cross term once each, which is where the factor of two comes from — the covariance is counted once for A against B and once for B against A.` },
    { title: "The two own-variance terms", body: `Weighting A by ${fmtNum(p.w)} scales its variance by that weight squared: $${fmtNum(p.w)}^2\\times${fmtNum(p.varA)}=${fmtNum(d.termA)}$. Likewise for B at weight ${fmtNum(d.wB)}: $${fmtNum(d.wB)}^2\\times${fmtNum(p.varB)}=${fmtNum(d.termB)}$.` },
    { title: "The cross term", body: `Twice the product of the two weights, times the covariance, gives $${fmtNum(2)}\\times${fmtNum(p.w)}\\times${fmtNum(d.wB)}\\times${fmtNum(Math.abs(p.cov))}=${fmtNum(Math.abs(d.cross))}$, and it enters ${p.cov < 0 ? "with a minus sign because the covariance is negative — the two strategies partly offset" : "with a plus sign because the covariance is positive — the two strategies reinforce"}.` },
    { title: "Answer", body: `Adding the three: $${fmtNum(d.termA)}+${fmtNum(d.termB)}${d.cross < 0 ? `-${fmtNum(Math.abs(d.cross))}` : `+${fmtNum(d.cross)}`}=${fmtNum(d.answer)}$ squared basis points.` },
    { title: "Sanity check", body: `Dropping the cross term entirely would give ${fmtNum(d.noCross)}, so the correlation is doing real work here: the two series correlate at ${fmtNum(d.rho)}, and the answer sits ${d.cross < 0 ? "below" : "above"} the no-covariance figure by exactly the size of that term.` },
  ],
  keyInsight: "Adding two random quantities adds their variances only when they are uncorrelated. In general the covariance enters twice, so a book's risk is set as much by how its strategies move together as by how volatile each one is on its own.",
  commonTrap: "Adding the weighted variances and stopping. That is the answer only at zero covariance, and it errs in both directions — it overstates the risk of a hedged book and understates the risk of one whose legs move together.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [2],
};
