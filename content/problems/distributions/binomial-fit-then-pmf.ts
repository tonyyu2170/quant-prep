import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// P(X=0)=c=(1-p)^n has a direct closed-form inverse — no root-finder needed.
const fittedPOf = (par: Params) => 1 - par.c ** (1 / par.n);
const pmf1Of = (par: Params) => {
  const p = fittedPOf(par);
  return par.n * p * (1 - p) ** (par.n - 1);
};

export const binomialFitThenPmf: ProblemTemplate = {
  id: "distributions/binomial-fit-then-pmf",
  version: 1,
  topic: "probability/distributions",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "original", inspiration: "fitting a binomial rate from P(X=0), then reading off P(X=1)" },
  params: {
    n: { range: { min: 6, max: 16, step: 1 } },
    c: { range: { min: 0.05, max: 0.85, step: 0.02 } },
  },
  constraint: (p) => fittedPOf(p) > 0 && fittedPOf(p) < 1 && pmf1Of(p) >= 0.01 && pmf1Of(p) <= 0.9,
  derived: (p) => {
    const fittedP = fittedPOf(p);
    const q = 1 - fittedP;
    const nMinus1 = p.n - 1;
    const pmf1 = p.n * fittedP * q ** nMinus1;
    return { fittedP, q, nMinus1, pmf1 };
  },
  statement: (p) =>
    `Across ${fmtNum(p.n)} independent trading sessions, a desk's post-mortem shows the probability of a strategy logging zero drawdown days over all ${fmtNum(p.n)} sessions is ${fmtNum(p.c)}. Assuming each session independently has the same per-session drawdown probability, find that probability, then compute the probability of exactly one drawdown day.`,
  answerKey: "pmf1",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Set up the zero-event equation", body: `Write the per-session drawdown probability as $p$, so a session has no drawdown with probability $1-p$. Zero drawdown days across all ${fmtNum(p.n)} sessions means $(1-p)^{${fmtNum(p.n)}}=${fmtNum(p.c)}$.` },
    { title: "Solve for p", body: `Taking the ${fmtNum(p.n)}th root of both sides: $1-p=${fmtNum(p.c)}^{1/${fmtNum(p.n)}}$, so $p=1-${fmtNum(p.c)}^{1/${fmtNum(p.n)}}=${fmtNum(d.fittedP)}$.` },
    { title: "Compute P(exactly one)", body: `With $p=${fmtNum(d.fittedP)}$ fixed, exactly one drawdown day among ${fmtNum(p.n)} sessions can land on any of ${fmtNum(p.n)} different sessions: $P(X=1)=n\\times p\\times q^{n-1}$, which comes out to $${fmtNum(d.pmf1)}$.` },
    { title: "Sanity check", body: `Plugging the fitted $p$ back into the zero-event formula must reproduce the stated ${fmtNum(p.c)}: raising $q=${fmtNum(d.q)}$ to the ${fmtNum(p.n)}th power gives back $${fmtNum(p.c)}$, confirming the fit is self-consistent before it is used for $P(X=1)$.` },
  ],
  keyInsight: "P(X=0)=(1-p)^n inverts to a per-trial rate with no root-finder — raise both sides to the 1/n power — and that fitted rate then drives every other probability for the same binomial.",
  commonTrap: "Solving for p and then plugging it back into the P(X=0) formula again instead of the P(X=1) formula the question actually asks for.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
