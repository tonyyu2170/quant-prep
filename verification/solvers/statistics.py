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


# --- B13 Task 1: the easy tier -------------------------------------------------------------
#
# The brute route for each of these runs the DEFINITION on constructed data rather than
# re-evaluating the closed form the template teaches. numpy's own mean/var/cov/corrcoef/median
# do the work wherever one exists, which is what keeps the second route from mirroring the
# first — the failure duplicated_sample_slope_variance hit, where the brute inverted the same
# doubled design matrix and so agreed with the same misreading.
#
# The two pattern tables below are the problems' INPUT DATA, not their solution route, so
# duplicating them here shares no assumption about how the answer is reached.

_SMV_PATTERNS = [
    [-4, -1, 0, 2, 3],
    [-3, -2, 1, 1, 3],
    [-5, -2, 0, 3, 4],
    [-2, -2, -1, 2, 3],
    [-6, -1, 0, 3, 4],
]
_COV_PX = [
    [-4, -1, 0, 2, 3], [-3, -2, 1, 1, 3], [-5, -2, 0, 3, 4], [-2, -2, -1, 2, 3], [-6, -1, 0, 3, 4],
]
_COV_PY = [
    [-3, -1, 0, 1, 3], [-4, -2, 1, 2, 3], [-2, -1, 0, 1, 2], [-5, -1, 0, 2, 4], [-3, -3, 1, 2, 3],
]


def _smv_values(p):
    return [p["base"] + p["spread"] * k for k in _SMV_PATTERNS[int(p["pat"])]]


def sample_mean_and_variance_exact(p):
    values = _smv_values(p)
    n = len(values)
    total = sum(values)
    mean = _round9(total / n)
    ss = _round9(sum((v - mean) ** 2 for v in values))
    out = {
        "n": float(n),
        "nLessOne": float(n - 1),
        "total": float(total),
        "mean": mean,
        "ss": ss,
        "largestDev": float(max(abs(v - mean) for v in values)),
        "popVar": _round9(ss / n),
        "answer": _round9(ss / (n - 1)),
    }
    for i, v in enumerate(values, start=1):
        out[f"v{i}"] = float(v)
        out[f"dev{i}"] = _round9(v - mean)
    return out


def sample_mean_and_variance_brute(p):
    """numpy's own Bessel-corrected variance over the literal readings. The template's route is
    mean, then squared deviations, then divide; this hands the whole sample to np.var(ddof=1)
    and never writes a deviation down."""
    values = np.array(_smv_values(p), dtype=float)
    got = float(np.var(values, ddof=1))
    # The computational form is a third route again, and must agree with both.
    n = len(values)
    comp = (float(np.sum(values ** 2)) - float(np.sum(values)) ** 2 / n) / (n - 1)
    assert abs(comp - got) < 1e-9, "the computational form disagrees with numpy"
    assert got > float(np.var(values, ddof=0)), "the n-1 divisor must give the larger figure"
    return got


def variance_of_a_scaled_sum_exact(p):
    answer = float(p["mult"] * p["mult"] * p["varX"])
    return {
        "multSquared": float(p["mult"] * p["mult"]),
        "sdX": _round9(p["varX"] ** 0.5),
        "sd": _round9(answer ** 0.5),
        "naive": float(p["mult"] * p["varX"]),
        "answer": answer,
    }


def variance_of_a_scaled_sum_brute(p):
    """Build a distribution that HAS the quoted one-lot variance, push it through the affine map
    and read the variance off the transformed pmf as E[Y^2] - E[Y]^2. The a^2 Var(X) rule the
    template teaches never appears, so a wrong exponent on the multiplier would show up here."""
    s = p["varX"] ** 0.5
    xs = np.array([-s, s])
    probs = np.array([0.5, 0.5])
    assert abs(float(probs @ (xs ** 2)) - float(probs @ xs) ** 2 - p["varX"]) < 1e-9, "constructed X has the wrong variance"
    ys = p["mult"] * xs - p["fee"]
    got = float(probs @ (ys ** 2)) - float(probs @ ys) ** 2
    # A drawn sample of the same affine transform lands on it too, to a few decimals.
    rng = np.random.default_rng(7)
    draw = p["mult"] * rng.choice(xs, size=400000) - p["fee"]
    assert abs(float(np.var(draw)) - got) < 0.02 * got, "a drawn sample disagrees with the pmf"
    return got


def _cov_columns(p):
    xs = [p["xbase"] + k for k in _COV_PX[int(p["px"])]]
    ys = [p["ybase"] + p["yscale"] * k for k in _COV_PY[int(p["py"])]]
    return xs, ys


def covariance_from_a_table_exact(p):
    xs, ys = _cov_columns(p)
    n = len(xs)
    sum_x, sum_y = sum(xs), sum(ys)
    mean_x, mean_y = _round9(sum_x / n), _round9(sum_y / n)
    cross = _round9(sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys)))
    out = {
        "n": float(n),
        "nLessOne": float(n - 1),
        "sumX": float(sum_x),
        "sumY": float(sum_y),
        "meanX": mean_x,
        "meanY": mean_y,
        "cross": cross,
        "popCov": _round9(cross / n),
        "answer": _round9(cross / (n - 1)),
    }
    for i, (x, y) in enumerate(zip(xs, ys), start=1):
        out[f"x{i}"] = float(x)
        out[f"dx{i}"] = _round9(x - mean_x)
        out[f"y{i}"] = float(y)
        out[f"dy{i}"] = _round9(y - mean_y)
    return out


def covariance_from_a_table_brute(p):
    """numpy's own covariance matrix over the two literal columns. The template pairs deviations
    by hand and divides; this reads the off-diagonal entry of np.cov and never forms a
    deviation."""
    xs, ys = _cov_columns(p)
    got = float(np.cov(np.array(xs, dtype=float), np.array(ys, dtype=float), ddof=1)[0, 1])
    # Covariance is invariant to shifting either column, which the template asserts in prose.
    shifted = float(np.cov(np.array(xs, dtype=float) + 1000.0, np.array(ys, dtype=float) - 7.0, ddof=1)[0, 1])
    assert abs(shifted - got) < 1e-9, "covariance moved under a shift of the columns"
    return got


def correlation_from_covariance_exact(p):
    sd_x = _round9(p["varX"] ** 0.5)
    sd_y = _round9(p["varY"] ** 0.5)
    return {
        "sdX": sd_x,
        "sdY": sd_y,
        "sdProduct": _round9(sd_x * sd_y),
        "answer": _round9(p["cov"] / (sd_x * sd_y)),
    }


def correlation_from_covariance_brute(p):
    """Construct a four-point data set whose two columns REALISE the quoted variances and
    covariance, then run np.corrcoef on it. The answer is measured off real data rather than
    computed by dividing, so a wrong normaliser cannot survive."""
    e1 = np.array([1.0, 1.0, -1.0, -1.0]) / 2.0
    e2 = np.array([1.0, -1.0, 1.0, -1.0]) / 2.0
    a = p["varX"] ** 0.5
    b = p["cov"] / a
    c = (p["varY"] - b * b) ** 0.5
    x, y = a * e1, b * e1 + c * e2
    # The construction must actually have the quoted moments, or it is measuring something else.
    scale = len(x) - 1
    assert abs(float(x @ x) * 1.0 - p["varX"]) < 1e-9 * max(1.0, p["varX"]), "constructed x has the wrong spread"
    assert abs(float(x @ y) * 1.0 - p["cov"]) < 1e-9 * max(1.0, abs(p["cov"])), "constructed pair has the wrong covariance"
    assert abs(float(y @ y) * 1.0 - p["varY"]) < 1e-9 * max(1.0, p["varY"]), "constructed y has the wrong spread"
    assert scale == 3
    return float(np.corrcoef(x, y)[0, 1])


def standard_error_of_the_mean_exact(p):
    root = _round9(math.sqrt(p["n"]))
    return {
        "root": root,
        "quadN": float(4 * p["n"]),
        "quadRoot": _round9(2 * root),
        "quadSe": _round9(p["sd"] / (2 * root)),
        "answer": _round9(p["sd"] / root),
    }


def standard_error_of_the_mean_brute(p):
    """The sample mean is the equally weighted portfolio of n independent readings, so its
    variance is the quadratic form w' Sigma w against the diagonal covariance matrix. The
    sigma/sqrt(n) rule never appears — the square root enters only at the very end, taking the
    root of a variance rather than of a count."""
    n = int(p["n"])
    sigma = float(p["sd"])
    cov = np.eye(n) * sigma ** 2
    w = np.ones(n) / n
    got = float(math.sqrt(np.sum(w * cov.dot(w))))
    rng = np.random.default_rng(11)
    means = rng.normal(0.0, sigma, size=(30000, n)).mean(axis=1)
    assert abs(float(np.std(means)) - got) < 0.05 * got, "drawn sample means disagree with the quadratic form"
    return got


def pooled_mean_of_two_groups_exact(p):
    total = p["nA"] + p["nB"]
    sum_a = p["nA"] * p["mA"]
    sum_b = p["nB"] * p["mB"]
    return {
        "total": float(total),
        "sumA": float(sum_a),
        "sumB": float(sum_b),
        "grand": float(sum_a + sum_b),
        "naive": _round9((p["mA"] + p["mB"]) / 2),
        "answer": _round9((sum_a + sum_b) / total),
    }


def pooled_mean_of_two_groups_brute(p):
    """Lay the trades out one by one and take numpy's mean of the lot. No weight is ever
    written down, so a weighting by the wrong quantity has nothing to hide behind."""
    trades = np.concatenate([np.full(int(p["nA"]), float(p["mA"])), np.full(int(p["nB"]), float(p["mB"]))])
    got = float(np.mean(trades))
    lo, hi = min(p["mA"], p["mB"]), max(p["mA"], p["mB"])
    assert lo < got < hi, "a pooled mean must sit strictly between the two group means"
    return got


def median_vs_mean_with_an_outlier_exact(p):
    total = 5 * p["base"] + 8 * p["step"] + p["out"]
    mean = _round9(total / 5)
    median = p["base"] + 3 * p["step"]
    return {
        "n": 5.0,
        "total": float(total),
        "mean": mean,
        "median": float(median),
        "biggest": float(p["base"] + p["out"]),
        "q1": float(p["base"]),
        "q2": float(p["base"] + p["step"]),
        "q3": float(p["base"] + 3 * p["step"]),
        "q4": float(p["base"] + 4 * p["step"]),
        "answer": _round9(mean - median),
    }


def median_vs_mean_with_an_outlier_brute(p):
    """Hand the five quotes to numpy and subtract its median from its mean. np.median does its
    own sorting, so a template that picked the wrong order statistic would disagree here."""
    quotes = np.array([
        p["base"] + 3 * p["step"], p["base"], p["base"] + p["out"],
        p["base"] + 4 * p["step"], p["base"] + p["step"],
    ], dtype=float)
    got = float(np.mean(quotes) - np.median(quotes))
    # Pushing the outlier further moves the mean and leaves the median alone; that asymmetry is
    # the whole claim of the problem, so assert it rather than trust it.
    pushed = quotes.copy()
    pushed[2] += 500.0
    assert abs(float(np.median(pushed)) - float(np.median(quotes))) < 1e-9, "the median moved with the outlier"
    assert float(np.mean(pushed)) > float(np.mean(quotes)), "the mean failed to follow the outlier"
    return got


def z_score_from_mean_and_sd_exact(p):
    return {
        "obs": float(p["mu"] + p["dev"]),
        "gap": float(p["dev"]),
        "twoSigmaBand": _round9(2 * p["sigma"]),
        "answer": _round9(p["dev"] / p["sigma"]),
    }


def z_score_from_mean_and_sd_brute(p):
    """Build a two-point population that HAS the quoted mean and standard deviation, then let
    numpy measure both back off it and standardise against what it measured. The quoted mu and
    sigma are never divided by directly."""
    pop = np.array([p["mu"] - p["sigma"], p["mu"] + p["sigma"]], dtype=float)
    mean, sd = float(np.mean(pop)), float(np.std(pop))
    assert abs(mean - p["mu"]) < 1e-9 and abs(sd - p["sigma"]) < 1e-9, "constructed population has the wrong moments"
    return (float(p["mu"] + p["dev"]) - mean) / sd


SOLVERS.update({
    "statistics/sample-mean-and-variance": {
        "exact": sample_mean_and_variance_exact,
        "brute": sample_mean_and_variance_brute,
    },
    "statistics/variance-of-a-scaled-sum": {
        "exact": variance_of_a_scaled_sum_exact,
        "brute": variance_of_a_scaled_sum_brute,
    },
    "statistics/covariance-from-a-table": {
        "exact": covariance_from_a_table_exact,
        "brute": covariance_from_a_table_brute,
    },
    "statistics/correlation-from-covariance": {
        "exact": correlation_from_covariance_exact,
        "brute": correlation_from_covariance_brute,
    },
    "statistics/standard-error-of-the-mean": {
        "exact": standard_error_of_the_mean_exact,
        "brute": standard_error_of_the_mean_brute,
    },
    "statistics/pooled-mean-of-two-groups": {
        "exact": pooled_mean_of_two_groups_exact,
        "brute": pooled_mean_of_two_groups_brute,
    },
    "statistics/median-vs-mean-with-an-outlier": {
        "exact": median_vs_mean_with_an_outlier_exact,
        "brute": median_vs_mean_with_an_outlier_brute,
    },
    "statistics/z-score-from-mean-and-sd": {
        "exact": z_score_from_mean_and_sd_exact,
        "brute": z_score_from_mean_and_sd_brute,
    },
})
