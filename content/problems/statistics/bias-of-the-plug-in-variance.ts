import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const biasOfThePlugInVariance: ProblemTemplate = {
  id: "statistics/bias-of-the-plug-in-variance",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "two-sigma", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the downward bias of the 1/n variance estimator" },
  params: {
    sigma2: { choices: [400, 600, 800, 1000, 1200, 1600, 2000, 2400] },
    n: { choices: [4, 5, 8, 10, 16, 20, 25] },
    reps: { choices: [30, 50, 80, 120, 200, 300] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const factor = round((p.n - 1) / p.n);
    return {
      nLessOne: p.n - 1,
      factor,
      shortfall: round(p.sigma2 / p.n),
      answer: round(factor * p.sigma2),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A quantity has a true variance of ${fmtNum(p.sigma2)}. A simulation draws ${fmtNum(p.reps)} independent samples of ${fmtNum(p.n)} observations each, and for every sample it computes the average squared deviation from THAT SAMPLE'S OWN mean — dividing by ${fmtNum(p.n)} rather than by one less. ` +
    `Averaged over the ${fmtNum(p.reps)} samples, what value does this estimator converge to?`,
  solution: (p, d) => [
    { title: "The centre is estimated from the same data", body: `The deviations are measured from the sample mean, and the sample mean is the point that MINIMISES the sum of squared deviations for that sample. Any other centre — including the true mean — would give a larger total, so the plug-in estimator is systematically too small. Its expectation is $E[S^2]=\\dfrac{n-1}{n}\\sigma^2$.` },
    { title: "The shrinkage factor", body: `With ${fmtNum(p.n)} observations that factor is $(${fmtNum(p.n)}-1)/${fmtNum(p.n)}=${fmtNum(d.factor)}$ — one degree of freedom is spent locating the mean, leaving ${fmtNum(d.nLessOne)} of the ${fmtNum(p.n)} to measure spread.` },
    { title: "Apply it", body: `The estimator converges to $${fmtNum(d.factor)}\\times${fmtNum(p.sigma2)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `It converges to ${fmtNum(d.answer)}, not to ${fmtNum(p.sigma2)}.` },
    { title: "Sanity check", body: `The shortfall is $${fmtNum(p.sigma2)}-${fmtNum(d.answer)}=${fmtNum(d.shortfall)}$, which is exactly the true variance over ${fmtNum(p.n)}. More samples do not fix it: ${fmtNum(p.reps)} repetitions or a million, the average still lands on ${fmtNum(d.answer)}. That is what makes this bias rather than noise.` },
  ],
  keyInsight: "Bias and noise fail in different ways, and averaging only cures one of them. The plug-in variance is wrong in the same direction on every sample, because the centre it measures from was chosen to make it small, so no amount of repetition moves the average toward the truth.",
  commonTrap: "Assuming a longer simulation converges to the true variance, which confuses bias with sampling error. The related slip is treating the correction as negligible for any n, when at small samples it removes a substantial fraction of the estimate.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
