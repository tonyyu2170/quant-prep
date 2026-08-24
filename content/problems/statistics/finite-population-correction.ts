import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const finitePopulationCorrection: ProblemTemplate = {
  id: "statistics/finite-population-correction",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the finite population correction for sampling without replacement" },
  params: {
    sigma2: { choices: [100, 144, 225, 400, 625, 900, 1225, 1600, 2500] },
    n: { choices: [10, 20, 25, 40, 50, 80, 100] },
    // Each of these is one more than a number of the form 2^a 5^b, so (N-1) divides an integer
    // into a terminating decimal and the correction factor prints exactly.
    bigN: { choices: [51, 101, 201, 401, 501, 801, 1001] },
  },
  constraint: (p) => p.n <= p.bigN / 3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const remaining = p.bigN - p.n;
    const denom = p.bigN - 1;
    const fpc = round(remaining / denom);
    const srsVar = round(p.sigma2 / p.n);
    return {
      remaining,
      denom,
      fpc,
      srsVar,
      answer: round((p.sigma2 / p.n) * (remaining / denom)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A compliance team audits ${fmtNum(p.n)} trades drawn WITHOUT replacement from a population of exactly ${fmtNum(p.bigN)} trades. The trade sizes in that population have variance ${fmtNum(p.sigma2)}. ` +
    `What is the variance of the sample mean trade size?`,
  solution: (p, d) => [
    { title: "Sampling without replacement is not independent", body: `Once a trade is drawn it cannot come again, so the draws are negatively correlated and the sample mean is MORE precise than independence would predict. The usual $\\sigma^2/n$ is multiplied by a correction, $\\dfrac{N-n}{N-1}$, which is below one whenever the sample is a real fraction of the population.` },
    { title: "The correction factor", body: `Here $${fmtNum(p.bigN)}-${fmtNum(p.n)}=${fmtNum(d.remaining)}$ trades remain unaudited out of $${fmtNum(p.bigN)}-1=${fmtNum(d.denom)}$, so the factor is $${fmtNum(d.remaining)}/${fmtNum(d.denom)}=${fmtNum(d.fpc)}$.` },
    { title: "The uncorrected variance", body: `Treating the draws as independent would give $${fmtNum(p.sigma2)}/${fmtNum(p.n)}=${fmtNum(d.srsVar)}$.` },
    { title: "Answer", body: `Applying the correction over the original figures, $\\dfrac{${fmtNum(p.sigma2)}}{${fmtNum(p.n)}}\\times\\dfrac{${fmtNum(d.remaining)}}{${fmtNum(d.denom)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Push the sample to the whole population and the factor becomes zero: audit every trade and the sample mean IS the population mean, with no uncertainty left. That limit is the reason the denominator is $N-1$ and not $N$ — only $N-1$ sends the correction exactly to zero at $n=N$.` },
  ],
  keyInsight: "Sampling without replacement removes uncertainty as it goes, because each draw rules out a possibility rather than merely observing one. The correction is negligible when the population dwarfs the sample and total when the two coincide, which is why survey work quotes it and market sampling usually does not.",
  commonTrap: "Ignoring the correction when the sample is a large share of the population, which overstates the uncertainty. The reverse slip is using N in the denominator instead of N minus one, which leaves a stubborn residue of variance even after every unit has been measured.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
