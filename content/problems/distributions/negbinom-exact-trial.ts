import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < kk; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

const pmfOf = (par: Params) => {
  if (par.k < par.r) return 0;
  const q = 1 - par.succPct / 100;
  return comb(par.k - 1, par.r - 1) * (par.succPct / 100) ** par.r * q ** (par.k - par.r);
};

export const negbinomExactTrial: ProblemTemplate = {
  id: "distributions/negbinom-exact-trial",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "de-shaw", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "negative binomial PMF as arrangements of failures before the r-th success" },
  params: {
    succPct: { range: { min: 16, max: 70, step: 2 } },
    r: { range: { min: 2, max: 6, step: 1 } },
    k: { range: { min: 2, max: 21, step: 1 } },
  },
  constraint: (p) => p.k > p.r && pmfOf(p) >= 0.01,
  derived: (p) => {
    const prob = p.succPct / 100;
    const q = 1 - prob;
    const kMinus1 = p.k - 1;
    const rMinus1 = p.r - 1;
    const combKR = comb(kMinus1, rMinus1);
    const kMinusR = p.k - p.r;
    // q ** kMinusR stays a LOCAL intermediate, same reason as B4's earlier qToN cases — the
    // large combinatorial factor can keep pmf above the 0.01 floor even when this factor alone
    // underflows emit.ts's 1e-6 derived floor.
    const pmf = combKR * prob ** p.r * q ** kMinusR;
    return { prob, q, kMinus1, rMinus1, combKR, kMinusR, pmf };
  },
  statement: (p) =>
    `A recruiter reviews resumes one at a time, each independently qualified with probability ${fmtNum(p.succPct)} percent. What is the probability that the ${fmtNum(p.r)}th qualified candidate is found on exactly the ${fmtNum(p.k)}th resume reviewed?`,
  answerKey: "pmf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the qualification rate as a probability: $\\frac{${fmtNum(p.succPct)}}{100}=${fmtNum(d.prob)}$, so a resume fails to qualify with probability ${fmtNum(d.q)}.` },
    { title: "Count the arrangements", body: `For the ${fmtNum(p.r)}th qualified candidate to land exactly on resume ${fmtNum(p.k)}, the first ${fmtNum(d.kMinus1)} resumes must contain exactly ${fmtNum(d.rMinus1)} qualified ones (in any order), and resume ${fmtNum(p.k)} itself must qualify: $\\binom{k-1}{r-1}=${fmtNum(d.combKR)}$ ways to place the earlier qualifications.` },
    { title: "Weight and combine", body: `Every such arrangement has the same probability, so $P(X=${fmtNum(p.k)})\\approx${fmtNum(d.pmf)}$.` },
    { title: "Sanity check", body: `Every legal draw here has the ${fmtNum(p.r)}th qualification landing no earlier than resume ${fmtNum(p.r)} itself, since ${fmtNum(p.r)} qualifications cannot occur among fewer than ${fmtNum(p.r)} resumes — this problem's own resume ${fmtNum(p.k)} sits at or beyond that floor.` },
  ],
  keyInsight: "A negative binomial exact-trial probability counts every way to arrange the earlier successes among the trials before the last one, which must itself be a success — it is not simply the binomial PMF at the same trial count.",
  commonTrap: "Using the binomial PMF for exactly r successes in k trials, which allows the r-th success to land anywhere among the k trials rather than requiring it to land exactly on the last one.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [1, 100],
};
