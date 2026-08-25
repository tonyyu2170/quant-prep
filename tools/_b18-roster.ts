/* Drafting-only probe roster for B18 (statistics/regression). Delete once the twelve ship —
 * the shipped templates carry their own ids. Stubs carry only what probe() reads:
 * params, constraint, derived, answerKey, statement. */
import type { ProblemTemplate } from "@qp/engine";
import { probe } from "./probe";

const round = (x: number) => Math.round(x * 1e9) / 1e9;

/** #3 — R-squared as a share of variation. The ratio is the B16 collapse shape; this is the test. */
const rSquaredFromSums: ProblemTemplate = {
  id: "statistics/r-squared-from-sums-of-squares",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "R-squared as explained share" },
  params: {
    tss: { choices: [120, 150, 180, 200, 240, 250, 300, 320, 360, 400, 450, 500] },
    rss: { range: { min: 20, max: 420, step: 10 } },
  },
  constraint: (p) => {
    const { tss, rss } = p as { tss: number; rss: number };
    return rss >= 0.08 * tss && rss <= 0.92 * tss;
  },
  derived: (p) => ({ answer: round(1 - (p.rss as number) / (p.tss as number)) }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `Total sum of squares ${p.tss}, residual sum of squares ${p.rss}. R-squared?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #8 — SE of a slope, sqrt(RSS/(n-2)) / sqrt(Sxx). RSS is CONSTRUCTED as sVar*(n-2) so every
 *  operand is exact; the first draft gave the residual SD directly and died at 60 texts/100. */
const seOfASlope: ProblemTemplate = {
  id: "statistics/standard-error-of-a-slope",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "slope precision from the spread of x" },
  params: {
    sVar: { choices: [4, 9, 16, 25, 36, 49] },
    n: { choices: [12, 17, 22, 27, 32, 42, 52] },
    sxx: { choices: [16, 25, 36, 64, 100, 144, 196, 225, 256, 400] },
  },
  derived: (p) => {
    const { sVar, n, sxx } = p as { sVar: number; n: number; sxx: number };
    return { rss: sVar * (n - 2), answer: round(Math.sqrt(sVar) / Math.sqrt(sxx)) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) => `n ${p.n}, RSS ${d.rss}, Sxx ${p.sxx}. Standard error of the slope?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #1 — a residual is y - yhat. y0 drawn independently, constrained to sit near the line. */
const fittedValueAndResidual: ProblemTemplate = {
  id: "statistics/fitted-value-and-residual",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "residual versus unobservable error" },
  params: {
    a: { choices: [-8, -5, -2, 3, 6, 10, 12, 15] },
    b: { range: { min: 0.5, max: 3, step: 0.5 } },
    x0: { choices: [4, 6, 7, 9, 11, 12, 14, 16] },
    y0: { choices: [10, 14, 18, 22, 26, 30, 34, 38, 42] },
  },
  constraint: (p) => {
    const { a, b, x0, y0 } = p as { a: number; b: number; x0: number; y0: number };
    const r = y0 - (a + b * x0);
    return Math.abs(r) >= 1.5 && Math.abs(r) <= 14;
  },
  derived: (p) => {
    const { a, b, x0, y0 } = p as { a: number; b: number; x0: number; y0: number };
    return { fitted: round(a + b * x0), answer: round(y0 - (a + b * x0)) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `Fitted line intercept ${p.a}, slope ${p.b}. At x = ${p.x0} the observed y is ${p.y0}. Residual?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #2 — the line passes through (xbar, ybar), so a = ybar - b*xbar. */
const interceptFromMeans: ProblemTemplate = {
  id: "statistics/regression-intercept-from-means",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "the fitted line passes through the point of means" },
  params: {
    xbar: { choices: [8, 12, 15, 20, 24, 30, 36, 40, 45, 50] },
    ybar: { choices: [30, 45, 60, 72, 84, 96, 110, 125, 140] },
    b: { range: { min: 0.4, max: 2.6, step: 0.2 } },
  },
  derived: (p) => {
    const { xbar, ybar, b } = p as { xbar: number; ybar: number; b: number };
    return { answer: round(ybar - b * xbar) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `xbar ${p.xbar}, ybar ${p.ybar}, slope ${p.b}. Intercept?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #4 — rescaling x scales the slope inversely. Asked as the NEW slope, never the factor. */
const slopeAfterRescalingX: ProblemTemplate = {
  id: "statistics/slope-after-rescaling-x",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "units travel through a slope" },
  params: {
    b: { range: { min: 1.2, max: 9.6, step: 0.4 } },
    k: { choices: [4, 5, 8, 10, 12, 16, 20, 25, 40, 50] },
    ybarScale: { choices: [1, 2, 5] },
  },
  derived: (p) => {
    const { b, k, ybarScale } = p as { b: number; k: number; ybarScale: number };
    return { answer: round((b * ybarScale) / k) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `Slope ${p.b} per old unit of x; y is rescaled by ${p.ybarScale} and x by ${p.k}. New slope?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #5 — shifting x moves the intercept by b*c and leaves the slope alone. */
const interceptAfterShiftingX: ProblemTemplate = {
  id: "statistics/intercept-after-shifting-x",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "centring x changes only the intercept" },
  params: {
    a: { choices: [-20, -12, -6, 4, 9, 14, 22, 30] },
    b: { range: { min: 0.6, max: 3.4, step: 0.2 } },
    c: { choices: [5, 8, 10, 12, 15, 18, 20, 25, 30] },
  },
  derived: (p) => {
    const { a, b, c } = p as { a: number; b: number; c: number };
    return { answer: round(a + b * c) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `Intercept ${p.a}, slope ${p.b}. x is re-expressed as x - ${p.c}. New intercept?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #6 — no intercept means sum(xy)/sum(x^2), NOT Sxy/Sxx. */
const slopeThroughTheOrigin: ProblemTemplate = {
  id: "statistics/slope-through-the-origin",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "least squares with the intercept forced to zero" },
  params: {
    sumXY: { choices: [180, 240, 300, 360, 420, 480, 560, 640, 720, 840, 960] },
    sumX2: { choices: [120, 160, 200, 240, 320, 400, 480, 600] },
    n: { choices: [8, 10, 12, 15, 20] },
  },
  constraint: (p) => {
    const { sumXY, sumX2 } = p as { sumXY: number; sumX2: number };
    const b = sumXY / sumX2;
    return b >= 0.4 && b <= 5;
  },
  derived: (p) => ({ answer: round((p.sumXY as number) / (p.sumX2 as number)) }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `n ${p.n}, sum xy ${p.sumXY}, sum x^2 ${p.sumX2}, no intercept. Slope?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #7 — omitted-variable bias: the short coefficient is b1 + b2*delta. */
const omittedVariableBias: ProblemTemplate = {
  id: "statistics/omitted-variable-bias",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "what a dropped correlated regressor does to a coefficient" },
  params: {
    b1: { range: { min: 0.4, max: 2.8, step: 0.2 } },
    b2: { choices: [-2.5, -1.8, -1.2, 0.8, 1.5, 2.2, 3, 3.5] },
    delta: { range: { min: -1.2, max: 1.2, step: 0.2 } },
  },
  constraint: (p) => Math.abs((p as { delta: number }).delta) >= 0.2,
  derived: (p) => {
    const { b1, b2, delta } = p as { b1: number; b2: number; delta: number };
    return { answer: round(b1 + b2 * delta) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `Long regression gives ${p.b1} on x and ${p.b2} on z; z on x has slope ${p.delta}. Short-regression coefficient on x?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #12 — orthogonal regressors: the multiple coefficients ARE the simple ones. */
const orthogonalRegressors: ProblemTemplate = {
  id: "statistics/prediction-with-orthogonal-regressors",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "zero sample correlation decouples the two fits" },
  params: {
    ybar: { choices: [40, 55, 70, 85, 100, 120] },
    b1: { range: { min: 0.5, max: 2.5, step: 0.5 } },
    b2: { choices: [-3, -2, -1.5, 1.5, 2, 3, 4] },
    d1: { choices: [-6, -4, -2, 3, 5, 8] },
    d2: { choices: [-5, -3, 2, 4, 6, 9] },
  },
  derived: (p) => {
    const { ybar, b1, b2, d1, d2 } = p as { ybar: number; b1: number; b2: number; d1: number; d2: number };
    return { answer: round(ybar + b1 * d1 + b2 * d2) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `ybar ${p.ybar}; simple slopes ${p.b1} and ${p.b2}; the two regressors are uncorrelated in sample. Predict at ${p.d1} and ${p.d2} from their means.`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #10 — SE of a fitted value, sigma * sqrt(1/n + d^2/Sxx). Four axes, irrational answer. */
const varianceOfAFittedValue: ProblemTemplate = {
  id: "statistics/variance-of-a-fitted-value",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "a fitted value is least precise far from the mean of x" },
  params: {
    sigma: { choices: [2, 3, 4, 5, 6] },
    n: { choices: [10, 16, 20, 25, 40, 50] },
    d: { choices: [2, 3, 4, 5, 6, 8, 10] },
    sxx: { choices: [100, 144, 196, 225, 400, 625] },
  },
  constraint: (p) => {
    const { d, sxx } = p as { d: number; sxx: number };
    return d * d <= 0.25 * sxx;
  },
  derived: (p) => {
    const { sigma, n, d, sxx } = p as { sigma: number; n: number; d: number; sxx: number };
    return { answer: round(sigma * Math.sqrt(1 / n + (d * d) / sxx)) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `sigma ${p.sigma}, n ${p.n}, x0 is ${p.d} from xbar, Sxx ${p.sxx}. SE of the fitted value?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #11 — rank-one update: the slope after one more point. Exactly rational by construction. */
const slopeAfterAddingAPoint: ProblemTemplate = {
  id: "statistics/slope-after-adding-a-point",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "one high-leverage point moves the fit" },
  params: {
    n: { choices: [9, 11, 14, 19, 24] },
    sxx: { choices: [100, 120, 150, 200, 240, 300] },
    b: { range: { min: 0.4, max: 2.4, step: 0.2 } },
    dx: { choices: [4, 5, 6, 8, 10, 12] },
    dy: { choices: [-12, -8, -6, 6, 8, 12, 16, 20] },
  },
  derived: (p) => {
    const { n, sxx, b, dx, dy } = p as { n: number; sxx: number; b: number; dx: number; dy: number };
    const w = n / (n + 1);                       // the rank-one weight
    const sxy = b * sxx;                         // the old fit's cross-product
    const answer = (sxy + w * dx * dy) / (sxx + w * dx * dx);
    return { answer: round(answer) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `n ${p.n}, Sxx ${p.sxx}, slope ${p.b}. A point ${p.dx} above xbar and ${p.dy} above ybar is added. New slope?`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1],
};

/** #9 as REVISED — one variable over two periods, so sx = sy and the slope IS r. */
const regressionToTheMean: ProblemTemplate = {
  id: "statistics/regression-to-the-mean-prediction",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "predict r of the way out, not all of it" },
  params: {
    mean: { choices: [50, 60, 70, 75, 80, 100, 120] },
    sd: { choices: [4, 5, 6, 8, 10, 12, 15] },
    r: { range: { min: 0.2, max: 0.9, step: 0.1 } },
    z: { choices: [-2.5, -2, -1.5, 1.5, 2, 2.5, 3] },
  },
  derived: (p) => {
    const { mean, sd, r, z } = p as { mean: number; sd: number; r: number; z: number };
    return { answer: round(mean + r * z * sd) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => `Mean ${p.mean}, SD ${p.sd}, year-to-year correlation ${p.r}. A desk scored ${p.z} SDs from the mean. Predict next year.`,
  solution: () => [],
  keyInsight: "",
  commonTrap: "",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};

for (const t of [
  fittedValueAndResidual, interceptFromMeans, rSquaredFromSums,      // d1
  slopeAfterRescalingX, interceptAfterShiftingX, slopeThroughTheOrigin,
  omittedVariableBias, seOfASlope, regressionToTheMean,              // d2
  varianceOfAFittedValue, slopeAfterAddingAPoint, orthogonalRegressors, // d3
]) {
  console.log(probe(t));
}
