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
- adjusted R-squared: a data set is CONSTRUCTED with exactly the given sums of squares over an
  orthonormal design, the regression is actually run, and the answer is read off the fitted
  residuals as a ratio of two variance estimates — never as a correction applied to a share.
- duplicated sample: the doubled design matrix is built and the slope's variance read out of
  s^2 (X'X)^-1, so nothing is ever multiplied or divided by two.
- overlapping windows: the two windows are indicator vectors over the days, and the variance is
  the quadratic form of their sum against the diagonal covariance — no cross-term formula.
- reverse regression: the covariance matrix implied by the quoted slope and correlation is
  built, the reverse slope is read off as covariance over the variance of the NEW regressor, and
  both slopes are checked against fits to a Cholesky-drawn sample.
- sample size: the smallest count is found by SCANNING upward until the standard error clears
  the margin, and the count below it is asserted to fail — the squared formula never appears.
"""

import math

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


def _z_for(conf):
    return 1.645 if int(conf) == 90 else 1.96 if int(conf) == 95 else 2.576


def adjusted_r_squared_from_sums_exact(p):
    ssr, sse, n, k = float(p["ssr"]), float(p["sse"]), int(p["n"]), int(p["k"])
    sst = ssr + sse
    return {
        "sst": sst,
        "r2": _round9(ssr / sst),
        "unexplained": _round9(sse / sst),
        "dfRes": n - k - 1,
        "dfTot": n - 1,
        "answer": _round9(1 - (sse / sst) * ((n - 1) / (n - k - 1))),
    }


def adjusted_r_squared_from_sums_brute(p):
    """Build a data set that HAS these sums of squares and then actually regress it. An
    orthonormal basis makes the construction exact: one direction carries the mean, one carries
    the explained variation, and a direction outside the design carries the residual. The answer
    is then the ratio of two variance estimates read off the fit, not a correction applied to a
    share of sums."""
    ssr, sse, n, k = float(p["ssr"]), float(p["sse"]), int(p["n"]), int(p["k"])
    rng = np.random.default_rng(20260823)
    a = rng.standard_normal((n, k + 2))
    a[:, 0] = 1.0
    q, _ = np.linalg.qr(a)
    y = 10.0 * q[:, 0] + math.sqrt(ssr) * q[:, 1] + math.sqrt(sse) * q[:, k + 1]
    design = np.column_stack([np.ones(n)] + [q[:, j] for j in range(1, k + 1)])
    beta, *_ = np.linalg.lstsq(design, y, rcond=None)
    resid = y - design @ beta
    sse_fit = float(resid @ resid)
    sst_fit = float(((y - y.mean()) ** 2).sum())
    assert abs(sse_fit - sse) < 1e-6, f"construction missed SSE: {sse_fit} vs {sse}"
    assert abs(sst_fit - (ssr + sse)) < 1e-6, f"construction missed SST: {sst_fit} vs {ssr + sse}"
    return _round9(1 - (sse_fit / (n - k - 1)) / (sst_fit / (n - 1)))


def duplicated_sample_slope_variance_exact(p):
    s2, sxx, n = float(p["s2"]), float(p["sxx"]), int(p["n"])
    return {
        "varBefore": _round9(s2 / sxx),
        "sxxNew": 2 * sxx,
        "rowsNew": 2 * n,
        "answer": _round9(s2 / (2 * sxx)),
    }


def duplicated_sample_slope_variance_brute(p):
    """Build the doubled design matrix and read the slope's variance out of s^2 (X'X)^-1. The
    factor of two the template argues for never appears — it arrives, if it is right, inside the
    matrix inverse."""
    s2, sxx, n = float(p["s2"]), float(p["sxx"]), int(p["n"])
    assert n % 2 == 0, "the alternating construction needs an even count to centre exactly"
    step = math.sqrt(sxx / n)
    x = np.array([step if i % 2 == 0 else -step for i in range(n)])
    assert abs(((x - x.mean()) ** 2).sum() - sxx) < 1e-9, "constructed spread is not Sxx"
    doubled = np.concatenate([x, x])
    design = np.column_stack([np.ones(2 * n), doubled])
    cov_beta = s2 * np.linalg.inv(design.T @ design)
    return _round9(float(cov_beta[1, 1]))


def overlapping_window_sums_exact(p):
    v, a, b, ov = float(p["v"]), int(p["a"]), int(p["b"]), int(p["ov"])
    return {
        "varX": v * a,
        "varY": v * b,
        "cov": v * ov,
        "crossTerm": 2 * v * ov,
        "answer": v * (a + b + 2 * ov),
    }


def overlapping_window_sums_brute(p):
    """Write each window as an indicator vector over the days and take the quadratic form of
    their sum against the diagonal covariance. The shared days show up as entries of two in that
    vector rather than as a cross term anyone wrote down."""
    v, a, b, ov = float(p["v"]), int(p["a"]), int(p["b"]), int(p["ov"])
    days = a + b
    first = np.zeros(days)
    first[:a] = 1.0
    second = np.zeros(days)
    second[a - ov:a - ov + b] = 1.0
    assert int((first * second).sum()) == ov, "the two windows do not share the stated days"
    weights = first + second
    sigma = v * np.eye(days)
    return _round9(float(weights @ sigma @ weights))


def reverse_regression_slope_exact(p):
    byx, rho = float(p["byx"]), float(p["rho"])
    return {
        "r2": _round9(rho * rho),
        "reciprocal": _round9(1 / byx),
        "answer": _round9((rho * rho) / byx),
    }


def reverse_regression_slope_brute(p):
    """Rebuild the covariance matrix the quoted slope and correlation imply, then read the other
    regression's slope as covariance over the variance of the variable now being regressed on.
    A Cholesky-drawn sample is fitted both ways as a check; the returned value is exact."""
    byx, rho = float(p["byx"]), float(p["rho"])
    sd_x = 1.0
    sd_y = byx * sd_x / rho
    cov = rho * sd_x * sd_y
    sigma = np.array([[sd_x ** 2, cov], [cov, sd_y ** 2]])
    forward = cov / sd_x ** 2
    reverse = cov / sd_y ** 2
    assert abs(forward - byx) < 1e-9, "the constructed moments do not reproduce the quoted slope"

    rng = np.random.default_rng(20260823)
    # Same spurious SIMD matmul warning the portfolio brute documents above: wholly finite
    # operands, a "divide by zero" that says nothing about the data. The finiteness assert is
    # the real guard.
    with np.errstate(all="ignore"):
        sample = rng.standard_normal((200_000, 2)) @ np.linalg.cholesky(sigma).T
    assert np.isfinite(sample).all(), "the Cholesky draw produced non-finite pairs"
    c = np.cov(sample.T)
    assert abs(c[0, 1] / c[0, 0] - forward) < 0.02 * abs(forward), "sampled forward slope drifted"
    assert abs(c[0, 1] / c[1, 1] - reverse) < 0.02 * abs(reverse), "sampled reverse slope drifted"
    return _round9(reverse)


def sample_size_for_margin_exact(p):
    sd, margin, conf = float(p["sd"]), float(p["margin"]), int(p["conf"])
    z = _z_for(conf)
    return {
        "z": z,
        "zsd": _round9(z * sd),
        "raw": _round9(((z * sd) / margin) ** 2),
        "answer": math.ceil(_round9(((z * sd) / margin) ** 2)),
    }


def sample_size_for_margin_brute(p):
    """Scan upward for the smallest count whose standard error clears the margin, and assert the
    count below it does not. Nothing is squared and nothing is rounded up: the answer is found by
    trying. The relative slack is float noise only — the exact-arithmetic boundary cases are the
    reason the template rounds before its own ceiling."""
    sd, margin, conf = float(p["sd"]), float(p["margin"]), int(p["conf"])
    z = _z_for(conf)
    n = 1
    while z * sd / math.sqrt(n) > margin * (1 + 1e-12):
        n += 1
        assert n <= 100_000, "scan ran away"
    if n > 1:
        assert z * sd / math.sqrt(n - 1) > margin * (1 + 1e-12), "a smaller count would also have done"
    return float(n)


SOLVERS = {
    "statistics/adjusted-r-squared-from-sums": {
        "exact": adjusted_r_squared_from_sums_exact,
        "brute": adjusted_r_squared_from_sums_brute,
    },
    "statistics/duplicated-sample-slope-variance": {
        "exact": duplicated_sample_slope_variance_exact,
        "brute": duplicated_sample_slope_variance_brute,
    },
    "statistics/overlapping-window-sums": {
        "exact": overlapping_window_sums_exact,
        "brute": overlapping_window_sums_brute,
    },
    "statistics/reverse-regression-slope": {
        "exact": reverse_regression_slope_exact,
        "brute": reverse_regression_slope_brute,
    },
    "statistics/sample-size-for-margin": {
        "exact": sample_size_for_margin_exact,
        "brute": sample_size_for_margin_brute,
    },
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
