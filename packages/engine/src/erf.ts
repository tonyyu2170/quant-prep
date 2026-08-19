// Standard normal PDF/CDF via Marsaglia (2004)'s series/continued-fraction hybrid, and the
// quantile via Acklam's rational approximation refined by one Newton step. Coefficients and
// crossover points below are pinned from measurement (see this file's own test and the plan
// this shipped from), not from the commonly-cited |x|=7 crossover — that one is unsafe: the
// series loses accuracy approaching it from below (measured relerr 7.9e-7 at |x|=6), while the
// continued fraction is excellent from |x|~2 outward but divides by zero at x=0.

function stdNormalPdf(x: number): number {
  return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
}

// |x| < 4: power series. |x| >= 4: continued fraction for the tail. Both branches measure
// under 1e-11 relative error at the x=4 crossover itself — see erf.test.ts for the pinned
// values this is checked against.
function stdNormalCdf(x: number): number {
  if (Math.abs(x) < 4) {
    let s = x, t = 0, b = x, i = 1;
    while (s !== t) {
      t = s;
      b *= (x * x) / (2 * i + 1);
      s += b;
      i++;
    }
    return 0.5 + s * Math.exp((-x * x) / 2 - 0.5 * Math.log(2 * Math.PI));
  }
  let c = 0;
  for (let i = 60; i >= 1; i--) c = i / (Math.abs(x) + c);
  const tail = Math.exp((-x * x) / 2 - 0.5 * Math.log(2 * Math.PI)) / (Math.abs(x) + c);
  return x < 0 ? tail : 1 - tail;
}

export function erf(x: number): number {
  return 2 * stdNormalCdf(x * Math.SQRT2) - 1;
}

export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

// Acklam's rational approximation, ~1.15e-9 accurate on its own; the coefficients are the
// standard published ones. Refined by one Newton step against stdNormalCdf/stdNormalPdf —
// measured round-trip error normalQuantile(normalCdf(x)) over x in [-4,4]: max 8.9e-12.
const A = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
const B = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
const C = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
const D = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
const P_LOW = 0.02425;
const P_HIGH = 1 - P_LOW;

function acklam(p: number): number {
  if (p < P_LOW) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
      ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1);
  }
  if (p <= P_HIGH) {
    const q = p - 0.5, r = q * q;
    return ((((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r + A[5]) * q) /
      (((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
    ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1);
}

export function normalQuantile(p: number, mu = 0, sigma = 1): number {
  const x0 = acklam(p);
  const x = x0 - (stdNormalCdf(x0) - p) / stdNormalPdf(x0);
  return mu + sigma * x;
}
