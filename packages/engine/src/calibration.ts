/**
 * The mathematics of the Fermi / calibration game. Pure: no content, no React, no storage.
 *
 * EVERYTHING IS log10, one base throughout. An earlier draft of the spec fitted in natural log
 * and scored in log10; that mismatch produces a plausible-looking interval wrong by a factor of
 * ln(10) = 2.303. log10 of a lognormal is normal, so the normal quantile below is unchanged and
 * nothing is lost by picking the base the scoring needs.
 */

/** z(0.95). A stated 90% interval spans the median +- Z95 sigmas. */
export const Z95 = 1.6449;

/** Below this many recorded answers a hit rate is noise, not a measurement.
 *  At 50 the standard error on a 90% rate is sqrt(.9*.1/50) = 4.2 points, small enough that a
 *  genuinely overconfident player (70%) separates from a calibrated one. Tuning constant. */
export const CALIBRATION_MIN_ANSWERS = 50;

/** One link in the player's chain: a label and their 90% interval for it. */
export interface Factor { label: string; lo: number; hi: number }

export interface Combined { lo: number; hi: number; muLog10: number; sigmaLog10: number }

/** Logs need a positive, ordered, finite range. Rejected at the input rather than scored. */
export function isValidFactor(lo: number, hi: number): boolean {
  return Number.isFinite(lo) && Number.isFinite(hi) && lo > 0 && hi >= lo;
}

/** Read a stated 90% interval as the parameters of a lognormal, in log10 space. */
export function fitLogNormal(lo: number, hi: number): { mu: number; sigma: number } {
  const a = Math.log10(lo), b = Math.log10(hi);
  return { mu: (a + b) / 2, sigma: (b - a) / (2 * Z95) };
}

/**
 * Combine the chain into one interval.
 *
 * The product of independent lognormals is EXACTLY lognormal, so this is closed form — no
 * simulation and no sampling noise. Means add; variances add. That is the whole reason the game
 * has a lesson in it: uncertainty adds in QUADRATURE, not linearly, so multiplying the endpoints
 * (see naiveProduct) overstates the combined range by a factor of about sqrt(n).
 *
 * Independence is assumed and is stated to the player, not hidden. Correlated factors (a city's
 * population and its household count) break it and make this interval too narrow.
 */
export function combineFactors(factors: readonly Factor[]): Combined {
  let mu = 0, varSum = 0;
  for (const f of factors) {
    const { mu: m, sigma: s } = fitLogNormal(f.lo, f.hi);
    mu += m;
    varSum += s * s;
  }
  const sigma = Math.sqrt(varSum);
  return { lo: 10 ** (mu - Z95 * sigma), hi: 10 ** (mu + Z95 * sigma), muLog10: mu, sigmaLog10: sigma };
}

/** What the player would get by multiplying their endpoints — kept so the reveal can show both. */
export function naiveProduct(factors: readonly Factor[]): { lo: number; hi: number } {
  return {
    lo: factors.reduce((a, f) => a * f.lo, 1),
    hi: factors.reduce((a, f) => a * f.hi, 1),
  };
}

/**
 * The interval (Winkler) score, on log10 values. LOWER IS BETTER.
 *
 * Proper: expected score is minimised by reporting your true 90% interval. That is the whole
 * requirement — a calibration trainer whose optimal strategy is anything but honesty trains the
 * wrong thing, which is why this is not the market game's `CREDIT_CAP - width`.
 *
 * Log space makes questions comparable: Fermi answers span orders of magnitude, and in absolute
 * units one "US GDP" question would swamp fifty others.
 */
export function intervalScore(lo: number, hi: number, truth: number, alpha = 0.1): number {
  const l = Math.log10(lo), h = Math.log10(hi), y = Math.log10(truth);
  let s = h - l;
  if (y < l) s += (2 / alpha) * (l - y);
  else if (y > h) s += (2 / alpha) * (y - h);
  return s;
}

export interface CalibrationResult {
  score: number;
  hit: boolean;
  logWidth: number;
  logCentreError: number;
}

export interface CalibrationSummary {
  answered: number;
  hits: number;
  hitRate: number;
  medianScore: number;
  medianLogWidth: number;
  medianLogCentreError: number;
  /** False until CALIBRATION_MIN_ANSWERS — below that a hit rate cannot mean anything. */
  headlineReady: boolean;
  diagnosis: string;
}

const median = (xs: readonly number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Two failure modes with OPPOSITE fixes, which a bare score distinguishes neither of. The
 * thresholds: 90% is what the player claimed, so a hit rate well under it is overconfidence; and
 * a player who never misses while spanning many decades is buying that record with width.
 */
export function summarizeCalibration(results: readonly CalibrationResult[]): CalibrationSummary {
  const answered = results.length;
  const hits = results.filter((r) => r.hit).length;
  const hitRate = answered === 0 ? 0 : hits / answered;
  const medianLogWidth = median(results.map((r) => r.logWidth));

  let diagnosis = "Well calibrated — your 90% is behaving like 90%. Tighten only if you stop missing entirely.";
  if (answered === 0) {
    diagnosis = "No questions answered yet.";
  } else if (hitRate < 0.75) {
    diagnosis = `You are overconfident: you claimed 90% and were right ${(hitRate * 100).toFixed(0)}% of the time. Your intervals average ${medianLogWidth.toFixed(1)} orders of magnitude — widen them until you are missing about one question in ten.`;
  } else if (hitRate > 0.97 && medianLogWidth > 3) {
    diagnosis = `You are underconfident: you almost never miss, but at ${medianLogWidth.toFixed(1)} orders of magnitude your intervals are too wide to be worth stating. Tighten until you miss about one in ten — you know more than you are admitting.`;
  }

  return {
    answered,
    hits,
    hitRate,
    medianScore: median(results.map((r) => r.score)),
    medianLogWidth,
    medianLogCentreError: median(results.map((r) => r.logCentreError)),
    headlineReady: answered >= CALIBRATION_MIN_ANSWERS,
    diagnosis,
  };
}

/** Score one answered question against the truth. */
export function scoreChain(factors: readonly Factor[], truth: number): CalibrationResult & { combined: Combined } {
  const combined = combineFactors(factors);
  return {
    combined,
    score: intervalScore(combined.lo, combined.hi, truth),
    hit: truth >= combined.lo && truth <= combined.hi,
    logWidth: Math.log10(combined.hi) - Math.log10(combined.lo),
    logCentreError: Math.abs(combined.muLog10 - Math.log10(truth)),
  };
}
