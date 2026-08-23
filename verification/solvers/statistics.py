"""Independent Python counterparts for content/problems/statistics/*.

exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).

brute(): recomputes the ANSWER by a route that does not use the closed form the template
teaches. verify.py compares brute() to the emitted answer at 1e-9, so a sampled estimate can
never BE the return value — sampling is used as an extra assertion inside each function and
the value returned comes from an exact but different derivation:

- portfolio variance: the quadratic form w'Sigma w against the covariance matrix, checked
  against the variance of a Cholesky-drawn joint sample.
- minimum-variance weight: three evaluations of the variance function, a parabola fitted
  through them, and its vertex read off — the derivative the template solves never appears.
- correlation bound: three unit vectors are CONSTRUCTED whose pairwise angles realise the two
  given correlations with the residuals aligned, and the answer is their dot product; the Gram
  matrix is checked to be a legal correlation matrix and no swept alternative beats it.
- regression slope: the least-squares OBJECTIVE is evaluated at three candidate slopes and its
  vertex read off, checked against a least-squares fit to a drawn sample.
- Sharpe: the window's mean and standard deviation are built from the summed daily moments and
  then divided, checked against summed sampled windows.
"""

import numpy as np


def _round9(x):
    return round(x * 1e9) / 1e9


def portfolio_variance_two_asset_exact(p):
    varA, varB, cov, w = float(p["varA"]), float(p["varB"]), float(p["cov"]), float(p["w"])
    wB = _round9(1 - w)
    termA = _round9(w * w * varA)
    termB = _round9(wB * wB * varB)
    cross = _round9(2 * w * wB * cov)
    return {
        "wB": wB,
        "termA": termA,
        "termB": termB,
        "cross": cross,
        "sdA": varA ** 0.5,
        "sdB": varB ** 0.5,
        "rho": _round9(cov / (varA ** 0.5 * varB ** 0.5)),
        "noCross": _round9(termA + termB),
        "answer": _round9(termA + termB + cross),
    }


def portfolio_variance_two_asset_brute(p):
    """The quadratic form against the covariance matrix, cross-checked against a real sample
    drawn through the Cholesky factor. The three-term expansion the template walks through
    never appears; the matrix product is what produces the number."""
    varA, varB, cov, w = float(p["varA"]), float(p["varB"]), float(p["cov"]), float(p["w"])
    cmat = np.array([[varA, cov], [cov, varB]], dtype=np.float64)
    weights = np.array([w, 1.0 - w], dtype=np.float64)
    exact = float(weights @ cmat @ weights)

    rng = np.random.default_rng(20260823)
    chol = np.linalg.cholesky(cmat)
    # np.errstate: this numpy build raises a spurious "divide by zero encountered in matmul"
    # from the SIMD path on wholly finite operands — reproduced on a hand-built finite
    # matrix — so the warning says nothing about the data. The finiteness assert below is
    # the real guard.
    with np.errstate(all="ignore"):
        sample = (rng.standard_normal((200_000, 2)) @ chol.T) @ weights
    assert np.isfinite(sample).all(), "the Cholesky draw produced non-finite P&L"
    est = float(sample.var(ddof=0))
    assert abs(est - exact) < 0.05 * exact, f"sampled {est} vs {exact}"
    return _round9(exact)


def min_variance_weight_exact(p):
    varA, varB, cov = float(p["varA"]), float(p["varB"]), float(p["cov"])
    num = varB - cov
    two_cov = 2 * cov
    den = varA + varB - two_cov
    w = num / den
    return {
        "num": num,
        "twoCov": two_cov,
        "den": den,
        "other": _round9(1 - w),
        "minVar": _round9((varA * varB - cov * cov) / den),
        "answer": _round9(w),
    }


def min_variance_weight_brute(p):
    """Fit a parabola through three evaluations of the variance function and read off its
    vertex. The variance of a blend is quadratic in the weight, so three points determine it
    exactly and the vertex is exact too — no derivative and no quoted formula. A grid scan
    over the unit interval is asserted to land in the same place, which is what would catch a
    sign error in the fit itself.

    A golden-section search was tried first and is the reason this note exists: near the
    minimum the parabola is flat enough that the comparison of two nearby values is decided by
    float noise, so the bracket stalls around 1e-8 and verify.py's 1e-9 comparison fails."""
    varA, varB, cov = float(p["varA"]), float(p["varB"]), float(p["cov"])

    def var_at(w):
        return w * w * varA + (1 - w) * (1 - w) * varB + 2 * w * (1 - w) * cov

    v0, vh, v1 = var_at(0.0), var_at(0.5), var_at(1.0)
    quad = 2 * (v1 - 2 * vh + v0)            # the w^2 coefficient
    lin = 2 * vh - 0.5 * quad - 2 * v0       # the w coefficient
    assert quad > 0, "the blend variance must be a convex parabola in the weight"
    vertex = -lin / (2 * quad)

    grid = np.linspace(0.0, 1.0, 20001)
    scanned = float(grid[int(np.argmin([var_at(w) for w in grid]))])
    assert abs(scanned - vertex) < 1e-4, f"scan {scanned} vs vertex {vertex}"
    return _round9(vertex)


def correlation_bound_third_pair_exact(p):
    a, b, want = float(p["rhoXY"]), float(p["rhoYZ"]), int(p["want"])
    sq_xy, sq_yz = _round9(a * a), _round9(b * b)
    resid_xy, resid_yz = _round9(1 - sq_xy), _round9(1 - sq_yz)
    prod = _round9(a * b)
    spread = _round9((resid_xy * resid_yz) ** 0.5)
    return {
        "sqXY": sq_xy,
        "sqYZ": sq_yz,
        "residXY": resid_xy,
        "residYZ": resid_yz,
        "prod": prod,
        "spread": spread,
        "lower": _round9(prod - spread),
        "upper": _round9(prod + spread),
        "answer": _round9(prod + spread if want == 1 else prod - spread),
    }


def correlation_bound_third_pair_brute(p):
    """Build the extreme configuration and measure it, rather than quote an interval.

    Three unit vectors are constructed in the plane: Y along the first axis, X at the angle
    whose cosine is the first correlation, and Z at the angle whose cosine is the second, with
    its residual component aligned with X's (for the largest) or opposed to it (for the
    smallest). The answer is then the dot product of X and Z — a measurement of a configuration
    that exists, not an application of the bound.

    Two checks guard it: the resulting Gram matrix must be a legal correlation matrix, and a
    sweep of every other alignment of the residuals must fail to beat it."""
    a, b, want = float(p["rhoXY"]), float(p["rhoYZ"]), int(p["want"])
    sign = 1.0 if want == 1 else -1.0
    y = np.array([1.0, 0.0])
    x = np.array([a, (1 - a * a) ** 0.5])
    z = np.array([b, sign * (1 - b * b) ** 0.5])
    for v in (x, y, z):
        assert abs(float(v @ v) - 1.0) < 1e-12, "constructed vectors must be unit length"
    assert abs(float(x @ y) - a) < 1e-12 and abs(float(z @ y) - b) < 1e-12
    built = float(x @ z)

    gram = np.array([[1.0, a, built], [a, 1.0, b], [built, b, 1.0]])
    assert np.linalg.eigvalsh(gram)[0] > -1e-9, "the constructed triple is not a legal correlation matrix"

    # No other alignment of the two residuals does better. Vectorised, and PSD-tested by the
    # 3x3 determinant rather than an eigen-decomposition per candidate.
    t = np.linspace(-1.0, 1.0, 20001)
    cand = a * b + ((1 - a * a) * (1 - b * b)) ** 0.5 * t
    det = 1 + 2 * a * b * cand - a * a - b * b - cand * cand
    legal = cand[det >= -1e-12]
    beaten = legal.max() if want == 1 else legal.min()
    assert (beaten <= built + 1e-9) if want == 1 else (beaten >= built - 1e-9), \
        f"sweep found {beaten} beating the construction {built}"
    return _round9(built)


def regression_slope_from_moments_exact(p):
    rho, sd_x, sd_y = float(p["rho"]), float(p["sdX"]), float(p["sdY"])
    return {
        "ratio": _round9(sd_y / sd_x),
        "r2": _round9(rho * rho),
        "unexplained": _round9(1 - rho * rho),
        "reverseSlope": _round9(rho * sd_x / sd_y),
        "answer": _round9(rho * sd_y / sd_x),
    }


def regression_slope_from_moments_brute(p):
    """Minimise the least-squares objective directly. The mean squared error of predicting Y
    by a multiple of X is a parabola in the multiple, so evaluating it at three slopes fixes
    it exactly and its vertex is the least-squares slope — the covariance-over-variance
    formula the template quotes is never used. Cross-checked against an actual least-squares
    fit to a drawn sample."""
    rho, sd_x, sd_y = float(p["rho"]), float(p["sdX"]), float(p["sdY"])
    cov = rho * sd_x * sd_y

    def mse(b):
        return sd_y * sd_y - 2 * b * cov + b * b * sd_x * sd_x

    m0, mh, m1 = mse(0.0), mse(0.5), mse(1.0)
    quad = 2 * (m1 - 2 * mh + m0)
    lin = 2 * mh - 0.5 * quad - 2 * m0
    assert quad > 0, "the squared-error objective must be convex in the slope"
    vertex = -lin / (2 * quad)

    rng = np.random.default_rng(20260823)
    z = rng.standard_normal((300_000, 2))
    xs = sd_x * z[:, 0]
    ys = sd_y * (rho * z[:, 0] + (1 - rho * rho) ** 0.5 * z[:, 1])
    fitted = float(np.polyfit(xs, ys, 1)[0])
    assert abs(fitted - vertex) < 0.02 * abs(vertex), f"fitted {fitted} vs vertex {vertex}"
    return _round9(vertex)


def sharpe_time_scaling_exact(p):
    edge, sd, periods = float(p["edge"]), float(p["sd"]), float(p["periods"])
    return {
        "perDay": _round9(edge / sd),
        "root": _round9(periods ** 0.5),
        "totalEdge": edge * periods,
        "totalVar": sd * sd * periods,
        "totalSd": _round9(sd * periods ** 0.5),
        "answer": _round9((edge / sd) * periods ** 0.5),
    }


def sharpe_time_scaling_brute(p):
    """Build the window's own two moments and divide them. The mean of a sum of independent
    days is the sum of the means and its variance is the sum of the variances; the ratio of
    the resulting mean to the resulting standard deviation is the window Sharpe. No
    square-root-of-time rule is applied — the square root appears only where a variance is
    turned into a deviation. Cross-checked against real summed windows."""
    edge, sd, periods = float(p["edge"]), float(p["sd"]), int(p["periods"])
    window_mean = edge * periods
    window_var = sd * sd * periods
    built = window_mean / window_var ** 0.5

    rng = np.random.default_rng(20260823)
    totals = (rng.standard_normal((120_000, periods)) * sd + edge).sum(axis=1)
    measured = float(totals.mean() / totals.std(ddof=0))
    assert abs(measured - built) < 0.05 * built, f"measured {measured} vs built {built}"
    return _round9(built)


SOLVERS = {
    "statistics/portfolio-variance-two-asset": {
        "exact": portfolio_variance_two_asset_exact,
        "brute": portfolio_variance_two_asset_brute,
    },
    "statistics/min-variance-weight": {
        "exact": min_variance_weight_exact,
        "brute": min_variance_weight_brute,
    },
    "statistics/correlation-bound-third-pair": {
        "exact": correlation_bound_third_pair_exact,
        "brute": correlation_bound_third_pair_brute,
    },
    "statistics/regression-slope-from-moments": {
        "exact": regression_slope_from_moments_exact,
        "brute": regression_slope_from_moments_brute,
    },
    "statistics/sharpe-time-scaling": {
        "exact": sharpe_time_scaling_exact,
        "brute": sharpe_time_scaling_brute,
    },
}
