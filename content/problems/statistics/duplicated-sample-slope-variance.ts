import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Duplicating a sample doubles the spread of X about its mean and so halves what the standard
// slope-variance formula REPORTS — the classic "it looks like twice the data" error, which is
// really the same data counted twice.
//
// The question asks for the reported number on purpose. The fitted slope on duplicated rows is
// the same random variable it was, so its true sampling variance does not move at all; only the
// formula's output does, because the formula is being fed rows it wrongly takes as independent.
// An earlier draft asked for "the variance of the fitted slope", which has the OPPOSITE answer
// and would have graded the careful candidate wrong. No gate here could have caught that: the
// Python counterpart inverts the doubled design matrix and so makes the same independence
// assumption the template does, which is verification-gate-lessons species 4 — a checker
// measuring the wrong population. The error variance is stated as KNOWN rather than estimated: an estimated one
// would also shift with the residual degrees of freedom, and the exact factor of two the
// question turns on would stop being exactly two.
//
// Every Sxx choice is a product of twos and fives, so the quotient terminates and both printed
// chains are exact at display precision.
export const duplicatedSampleSlopeVariance: ProblemTemplate = {
  id: "statistics/duplicated-sample-slope-variance",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.3 }, { firm: "two-sigma", weight: 0.25 }, { firm: "akuna", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "what duplicating every observation does to the variance of a least-squares slope" },
  params: {
    s2: { choices: [4, 6, 9, 12, 16, 20, 25, 36] },
    sxx: { choices: [50, 80, 100, 160, 200, 400, 500, 800] },
    n: { choices: [20, 30, 40, 50, 60] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      varBefore: round(p.s2 / p.sxx),
      sxxNew: 2 * p.sxx,
      rowsNew: 2 * p.n,
      answer: round(p.s2 / (2 * p.sxx)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A least-squares line is fitted to ${fmtNum(p.n)} observations. The errors are independent with known variance ${fmtNum(p.s2)}, and the predictor's squared deviations from its own mean sum to ${fmtNum(p.sxx)}. ` +
    `A colleague then appends a second copy of the whole data set, so every observation appears twice, and refits. Taking all ${fmtNum(d.rowsNew)} rows as independent, as the standard formula does, what variance does it report for the slope?`,
  solution: (p, d) => [
    { title: "What sets a slope's variance", body: `For a straight-line fit the slope's variance is the error variance over the predictor's spread about its mean: $\\text{Var}(b)=\\dfrac{\\sigma^2}{S_{xx}}$. Only two things move it — how noisy the response is, and how spread out the predictor is.` },
    { title: "Before the duplication", body: `As given, that is $\\dfrac{${fmtNum(p.s2)}}{${fmtNum(p.sxx)}}=${fmtNum(d.varBefore)}$.` },
    { title: "Duplicating leaves the mean alone and doubles the spread", body: `Every point reappears at the same place, so the predictor's mean does not move and each squared deviation is counted twice: $${fmtNum(2)}\\times${fmtNum(p.sxx)}=${fmtNum(d.sxxNew)}$. The error variance is a property of the noise, not of the row count, so it does not change.` },
    { title: "Answer", body: `$\\dfrac{${fmtNum(p.s2)}}{${fmtNum(d.sxxNew)}}=${fmtNum(d.answer)}$ — exactly half of what it was.` },
    { title: "Sanity check, and the catch", body: `The fitted slope itself does not move at all: every residual is duplicated too, so the same line still minimises the sum of squares. Its true sampling variance therefore does not move either — it is still the same estimator on the same information. Only the REPORTED figure halves, because it now claims the precision of ${fmtNum(d.rowsNew)} independent observations while the data still carry what ${fmtNum(p.n)} of them carried. The arithmetic is right and the independence assumption underneath it is false, which is why the number to distrust here is the one the software prints.` },
  ],
  keyInsight: "A slope's variance falls with the predictor's spread about its mean, and duplicating a sample doubles that spread while leaving the fitted line untouched. The halving is real arithmetic on a false premise: the duplicate rows are not independent observations, so the reported precision is twice what the data support.",
  commonTrap: "Believing the doubled sample genuinely halves the uncertainty. The formula does halve, which is exactly why the mistake survives a check of the algebra — the failure is in the independence assumption, not in the calculation.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [2],
};
