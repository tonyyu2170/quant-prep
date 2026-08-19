import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// P(r-th success exactly on trial r) means the first r trials are ALL successes: p^r=c, so
// p=c^(1/r) — a direct closed-form inverse, matching the plan's k=r pin. No root-finder needed.
const fittedPOf = (par: Params) => par.c ** (1 / par.r);

export const negbinomFitP: ProblemTemplate = {
  id: "distributions/negbinom-fit-p",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "millennium", weight: 0.3 }],
  source: { kind: "original", inspiration: "fitting a per-trial rate from the probability that every trial up to the r-th succeeds" },
  params: {
    r: { range: { min: 2, max: 6, step: 1 } },
    c: { range: { min: 0.05, max: 0.85, step: 0.02 } },
  },
  constraint: (p) => fittedPOf(p) > 0 && fittedPOf(p) < 1,
  derived: (p) => {
    const fittedP = fittedPOf(p);
    return { fittedP };
  },
  statement: (p) =>
    `A recruiter reviews resumes one at a time, each independently qualified with the same probability. The probability that the ${fmtNum(p.r)}th qualified candidate is found on exactly the ${fmtNum(p.r)}th resume reviewed — meaning every one of the first ${fmtNum(p.r)} resumes qualifies — is ${fmtNum(p.c)}. What is the implied per-resume qualification probability?`,
  answerKey: "fittedP",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Set up the all-success equation", body: `The ${fmtNum(p.r)}th qualification landing exactly on resume ${fmtNum(p.r)} forces all ${fmtNum(p.r)} of the first resumes to qualify: $p^r=${fmtNum(p.c)}$.` },
    { title: "Solve for p", body: `Taking the ${fmtNum(p.r)}th root of both sides: $p\\approx${fmtNum(p.c)}^{1/${fmtNum(p.r)}}\\approx${fmtNum(d.fittedP)}$.` },
    { title: "Sanity check", body: `Since ${fmtNum(p.c)} is a probability strictly between $0$ and $1$ and ${fmtNum(p.r)}th roots pull such values toward $1$, the fitted rate should sit above ${fmtNum(p.c)} itself — and it does.` },
  ],
  keyInsight: "\"The r-th success lands exactly on trial r\" forces all r trials to succeed, collapsing the general negative binomial PMF to a single power — p^r=c inverts with an r-th root, no root-finder needed.",
  commonTrap: "Treating the stated probability c as the per-resume rate itself, rather than as the probability that r independent resumes ALL qualify.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
