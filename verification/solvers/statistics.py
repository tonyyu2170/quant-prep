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
    # JS Math.round is floor(x + 0.5) — half-UP. Python's round() is half-to-EVEN, so the two
    # disagree on exact ties: 0.7626953125 rounds to ...313 in the templates and ...312 here.
    # Only ties are affected, which is why this went unnoticed until a draw produced one.
    return math.floor(x * 1e9 + 0.5) / 1e9


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


# --- B13 Tasks 2 and 3: estimators, sampling, testing, order statistics -------------------
#
# Same rule as the easy tier: each brute() reaches the answer by a route the template does not
# teach. Where the template quotes a closed form the brute integrates, enumerates, or solves
# numerically; where the template sums a series the brute uses the equivalent special function.

import itertools
from math import comb as _comb, erfc

from scipy import integrate, optimize
from scipy.stats import beta as _beta, norm as _norm


def _crit_two_sided(alpha_pct):
    return 1.645 if alpha_pct == 10 else 1.96 if alpha_pct == 5 else 2.576


def _z_from_conf(conf):
    """Two-sided multiplier keyed by the CONFIDENCE level (90/95/99), not by alpha (10/5/1).
    Same three numbers, different key — passing one where the other is expected silently returns
    the 99 percent multiplier for every level."""
    return 1.645 if conf == 90 else 1.96 if conf == 95 else 2.576


def _crit_one_sided(alpha_pct):
    return 1.282 if alpha_pct == 10 else 1.645 if alpha_pct == 5 else 2.326


def p_value_from_a_z_statistic_exact(p):
    tail = _round9(1 - _norm.cdf(p["zAbs"]))
    return {
        "tail": tail,
        "crit": _crit_two_sided(p["alphaPct"]),
        "alphaFrac": _round9(p["alphaPct"] / 100),
        "oneSided": tail,
        "answer": _round9(2 * tail),
    }


def p_value_from_a_z_statistic_brute(p):
    """erfc is a different special function from the normal CDF, and the two-sided p-value is
    exactly erfc(z/sqrt(2)) with no doubling written down. Cross-checked against a direct
    numerical integration of the density over both tails."""
    z = float(p["zAbs"])
    got = float(erfc(z / math.sqrt(2)))
    dens = lambda x: math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
    quad, _ = integrate.quad(dens, z, 40)
    assert abs(2 * quad - got) < 1e-11, "quadrature disagrees with erfc"
    return got


def bias_of_the_plug_in_variance_exact(p):
    factor = _round9((p["n"] - 1) / p["n"])
    return {
        "nLessOne": float(p["n"] - 1),
        "factor": factor,
        "shortfall": _round9(p["sigma2"] / p["n"]),
        "answer": _round9(factor * p["sigma2"]),
    }


def bias_of_the_plug_in_variance_brute(p):
    """Expand E[sum (x_i - xbar)^2] through second moments rather than quoting (n-1)/n. With a
    deliberately NON-zero mean, E[sum x_i^2] = n(sigma^2 + mu^2) and E[n xbar^2] = sigma^2 + n mu^2,
    so the difference is (n-1) sigma^2 and the estimator divides it by n. The shrink factor never
    appears. Cross-checked against a drawn simulation."""
    n, sigma2 = int(p["n"]), float(p["sigma2"])
    mu = 7.5  # non-zero on purpose: a centred check would hide a dropped mean term
    e_sum_sq = n * (sigma2 + mu * mu)
    e_n_xbar_sq = sigma2 + n * mu * mu
    got = (e_sum_sq - e_n_xbar_sq) / n
    rng = np.random.default_rng(3)
    draws = rng.normal(mu, math.sqrt(sigma2), size=(40000, n))
    est = float(np.mean(np.var(draws, axis=1, ddof=0)))
    assert abs(est - got) < 0.05 * got, "a drawn simulation disagrees with the moment expansion"
    return got


def mse_decomposition_exact(p):
    return {
        "biasSquared": float(p["bias"] * p["bias"]),
        "absBias": float(abs(p["bias"])),
        "naive": float(p["variance"]),
        "answer": float(p["bias"] * p["bias"] + p["variance"]),
    }


def mse_decomposition_brute(p):
    """Build a two-point estimator distribution that HAS the quoted bias and variance, then
    average the squared distance from the truth directly. The bias-squared-plus-variance
    identity the template teaches is never used."""
    bias, var = float(p["bias"]), float(p["variance"])
    truth = 0.0
    centre = truth + bias
    s = math.sqrt(var)
    values = np.array([centre - s, centre + s])
    probs = np.array([0.5, 0.5])
    assert abs(float(probs @ values) - centre) < 1e-9, "constructed estimator has the wrong bias"
    assert abs(float(probs @ (values - centre) ** 2) - var) < 1e-9, "constructed estimator has the wrong variance"
    return float(probs @ (values - truth) ** 2)


def variance_of_a_difference_in_means_exact(p):
    term_a = _round9(p["varA"] / p["nA"])
    term_b = _round9(p["varB"] / p["nB"])
    return {
        "termA": term_a,
        "termB": term_b,
        "answer": _round9(term_a + term_b),
        "sd": _round9((term_a + term_b) ** 0.5),
        "wrongPooled": _round9((p["varA"] + p["varB"]) / (p["nA"] + p["nB"])),
    }


def variance_of_a_difference_in_means_brute(p):
    """Stack every observation from both venues into one vector, write the difference of means as
    a single weight vector over it, and take the quadratic form against the block-diagonal
    covariance. Nothing is ever added term by term."""
    na, nb = int(p["nA"]), int(p["nB"])
    cov = np.diag([float(p["varA"])] * na + [float(p["varB"])] * nb)
    w = np.concatenate([np.full(na, 1.0 / na), np.full(nb, -1.0 / nb)])
    got = float(np.sum(w * cov.dot(w)))
    assert abs(float(np.sum(w)) ) < 1e-12, "the contrast should sum to zero"
    return got


def efficiency_of_two_unbiased_estimators_exact(p):
    answer = _round9(p["varB"] / p["varA"])
    return {
        "answer": answer,
        "matchingN": _round9(p["nA"] * answer),
        "extraN": _round9(p["nA"] * answer - p["nA"]),
        "sdRatio": _round9(answer ** 0.5),
    }


def efficiency_of_two_unbiased_estimators_brute(p):
    """Solve for the sample size at which B's variance equals A's, then read the factor off as a
    ratio of sample sizes. A root-find rather than a division — the ratio is never formed."""
    var_a, var_b, na = float(p["varA"]), float(p["varB"]), float(p["nA"])
    f = lambda n: var_a / na - var_b / n
    n_star = optimize.brentq(f, na * 1e-6, na * 1e6, xtol=1e-14, rtol=1e-15)
    return n_star / na


def sample_variance_of_a_linear_combination_exact(p):
    sum_sq = p["w1"] ** 2 + p["w2"] ** 2 + p["w3"] ** 2
    sum_cross = p["w1"] * p["w2"] + p["w1"] * p["w3"] + p["w2"] * p["w3"]
    var_term = p["v"] * sum_sq
    cov_term = 2 * p["c"] * sum_cross
    return {
        "sumSq": float(sum_sq),
        "sumCross": float(sum_cross),
        "varTerm": float(var_term),
        "covTerm": float(cov_term),
        "answer": float(var_term + cov_term),
    }


def sample_variance_of_a_linear_combination_brute(p):
    """Assemble the 3x3 covariance matrix and take w' Sigma w in one matrix operation. The
    template splits the diagonal from the off-diagonal by hand; this never separates them, and a
    cross term counted once instead of twice would show up immediately."""
    v, c = float(p["v"]), float(p["c"])
    sigma = np.array([[v, c, c], [c, v, c], [c, c, v]])
    w = np.array([float(p["w1"]), float(p["w2"]), float(p["w3"])])
    eig = np.linalg.eigvalsh(sigma)
    assert eig.min() > -1e-9, "the quoted covariance matrix is not positive semi-definite"
    got = float(np.sum(w * sigma.dot(w)))
    rng = np.random.default_rng(19)
    coef = np.linalg.cholesky(sigma + np.eye(3) * 1e-12).T.dot(w)
    draws = rng.standard_normal((200000, 3)).dot(coef)
    assert abs(float(np.var(draws)) - got) < 0.05 * abs(got), "a drawn book disagrees with the quadratic form"
    return got


def clt_probability_for_a_sample_mean_exact(p):
    root = _round9(math.sqrt(p["n"]))
    z = _round9((p["gap"] * root) / p["sigma"])
    return {
        "root": root,
        "se": _round9(p["sigma"] / root),
        "z": z,
        "threshold": float(p["mu"] + p["gap"]),
        "answer": _round9(1 - _norm.cdf(z)),
    }


def clt_probability_for_a_sample_mean_brute(p):
    """Integrate the sample mean's own normal density above the threshold, in the ORIGINAL units,
    rather than standardising and reading a table. The z-score never appears."""
    mu, sigma, n, gap = float(p["mu"]), float(p["sigma"]), int(p["n"]), float(p["gap"])
    se = sigma / math.sqrt(n)
    dens = lambda x: math.exp(-((x - mu) / se) ** 2 / 2) / (se * math.sqrt(2 * math.pi))
    got, _ = integrate.quad(dens, mu + gap, mu + gap + 40 * se)
    return got


def finite_population_correction_exact(p):
    remaining = p["bigN"] - p["n"]
    denom = p["bigN"] - 1
    return {
        "remaining": float(remaining),
        "denom": float(denom),
        "fpc": _round9(remaining / denom),
        "srsVar": _round9(p["sigma2"] / p["n"]),
        "answer": _round9((p["sigma2"] / p["n"]) * (remaining / denom)),
    }


def finite_population_correction_brute(p):
    """Route through the PAIRWISE COVARIANCE of two without-replacement draws, which is
    -sigma^2/(N-1). Then Var(sum) = n sigma^2 + n(n-1)Cov and the mean divides by n^2. The
    (N-n)/(N-1) factor is never written. A small exhaustive enumeration validates the covariance
    itself rather than trusting it."""
    n, big_n, sigma2 = int(p["n"]), int(p["bigN"]), float(p["sigma2"])
    cov = -sigma2 / (big_n - 1)
    var_sum = n * sigma2 + n * (n - 1) * cov
    got = var_sum / (n * n)
    # Exhaustive check of the covariance identity on a tiny population with the same structure.
    pop = np.array([1.0, 4.0, 9.0, 16.0, 25.0])
    m, s2 = pop.mean(), pop.var()
    pairs = [(a, b) for a, b in itertools.permutations(range(len(pop)), 2)]
    emp = sum((pop[a] - m) * (pop[b] - m) for a, b in pairs) / len(pairs)
    assert abs(emp - (-s2 / (len(pop) - 1))) < 1e-9, "the without-replacement covariance identity fails"
    return got


def weighted_least_squares_single_mean_exact(p):
    w1, w2, w3 = _round9(1 / p["v1"]), _round9(1 / p["v2"]), _round9(1 / p["v3"])
    numer = _round9(p["x1"] * w1 + p["x2"] * w2 + p["x3"] * w3)
    denom = _round9(w1 + w2 + w3)
    return {
        "w1": w1,
        "w2": w2,
        "w3": w3,
        "numer": numer,
        "denom": denom,
        "plainMean": _round9((p["x1"] + p["x2"] + p["x3"]) / 3),
        "combinedVar": _round9(1 / denom),
        "answer": _round9(numer / denom),
    }


def weighted_least_squares_single_mean_brute(p):
    """MINIMISE the weighted sum of squares numerically. The template quotes the closed-form
    weights; this never forms a weight at all, it just finds the value that fits best."""
    xs = np.array([float(p["x1"]), float(p["x2"]), float(p["x3"])])
    vs = np.array([float(p["v1"]), float(p["v2"]), float(p["v3"])])
    # Root-find the STATIONARITY condition rather than minimising directly: Brent's minimiser
    # converges to about 1e-8 on a quadratic, and verify.py compares at 1e-9. The derivative of
    # the weighted sum of squares is -2 sum (x_i - t)/v_i, and its root is found to machine
    # precision. Still a numerical solve — no closed-form weight is ever formed.
    obj = lambda t: float(np.sum((xs - t) ** 2 / vs))
    deriv = lambda t: float(np.sum((xs - t) / vs))
    lo, hi = xs.min() - 50.0, xs.max() + 50.0
    root = float(optimize.brentq(deriv, lo, hi, xtol=1e-14, rtol=8.9e-16))
    assert obj(root) < obj(root + 1e-3) and obj(root) < obj(root - 1e-3), "the stationary point is not a minimum"
    return root


def two_sided_z_test_statistic_exact(p):
    root = _round9(math.sqrt(p["n"]))
    return {
        "root": root,
        "se": _round9(p["sigma"] / root),
        "observed": float(p["mu0"] + p["gap"]),
        "gap": float(p["gap"]),
        "answer": _round9((p["gap"] * root) / p["sigma"]),
    }


def two_sided_z_test_statistic_brute(p):
    """Build a sample that actually HAS the observed mean and the quoted spread, then let numpy
    measure both back off it and form the statistic from what it measured."""
    n, sigma = int(p["n"]), float(p["sigma"])
    observed = float(p["mu0"] + p["gap"])
    base = np.array([observed - sigma, observed + sigma])
    mean, sd = float(np.mean(base)), float(np.std(base))
    assert abs(mean - observed) < 1e-9 and abs(sd - sigma) < 1e-9, "constructed sample has the wrong moments"
    return (mean - float(p["mu0"])) / (sd / math.sqrt(n))


def confidence_interval_half_width_exact(p):
    z = _z_from_conf(p["conf"])
    root = _round9(math.sqrt(p["n"]))
    answer = _round9((z * p["sigma"]) / root)
    return {
        "z": z,
        "root": root,
        "se": _round9(p["sigma"] / root),
        "lower": _round9(p["xbar"] - answer),
        "upper": _round9(p["xbar"] + answer),
        "answer": answer,
    }


def confidence_interval_half_width_brute(p):
    """Solve for the half-width whose interval carries the quoted coverage, by root-finding on the
    normal CDF. The multiplier is never multiplied by anything — it is recovered."""
    sigma, n, conf = float(p["sigma"]), int(p["n"]), float(p["conf"])
    se = sigma / math.sqrt(n)
    z = _z_from_conf(int(conf))
    target = float(_norm.cdf(z) - _norm.cdf(-z))
    f = lambda h: (_norm.cdf(h / se) - _norm.cdf(-h / se)) - target
    return float(optimize.brentq(f, 1e-9, 100 * se, xtol=1e-14, rtol=1e-15))


def type_two_error_and_power_exact(p):
    root = _round9(math.sqrt(p["n"]))
    crit = _crit_one_sided(p["alphaPct"])
    delta = _round9((p["gap"] * root) / p["sigma"])
    shift = _round9(delta - crit)
    return {
        "root": root,
        "crit": crit,
        "delta": delta,
        "shift": shift,
        "beta": _round9(_norm.cdf(-shift)),
        "answer": _round9(_norm.cdf(shift)),
    }


def type_two_error_and_power_brute(p):
    """Integrate the statistic's density UNDER THE ALTERNATIVE over the rejection region, in the
    original units. No shifted CDF is evaluated, so a power computed against the wrong centre
    would not survive."""
    sigma, n, gap = float(p["sigma"]), int(p["n"]), float(p["gap"])
    crit = _crit_one_sided(int(p["alphaPct"]))
    se = sigma / math.sqrt(n)
    reject_above = crit * se           # the rejection threshold, in original units
    centre = gap                       # the truth, in original units
    dens = lambda x: math.exp(-((x - centre) / se) ** 2 / 2) / (se * math.sqrt(2 * math.pi))
    got, _ = integrate.quad(dens, reject_above, centre + 40 * se)
    return got


def sample_size_for_a_proportion_exact(p):
    z = _z_from_conf(p["conf"])
    prop = _round9(p["pPct"] / 100)
    margin = _round9(p["marginPct"] / 100)
    raw = _round9((z * z * prop * (1 - prop)) / (margin * margin))
    return {
        "z": z,
        "prop": prop,
        "margin": margin,
        "variance": _round9(prop * (1 - prop)),
        "raw": raw,
        "answer": float(math.ceil(raw)),
    }


def sample_size_for_a_proportion_brute(p):
    """SCAN upward for the smallest count whose margin clears the target, and assert the count
    below it fails. The squared closed form never appears, so an off-by-one from a bare ceiling
    would be caught here."""
    z = _z_from_conf(p["conf"])
    prop = p["pPct"] / 100
    margin = p["marginPct"] / 100
    n = 1
    while z * math.sqrt(prop * (1 - prop) / n) > margin * (1 + 1e-12):
        n += 1
    assert z * math.sqrt(prop * (1 - prop) / (n - 1)) > margin * (1 + 1e-12), "a smaller count would also have done"
    return float(n)


def expected_maximum_of_uniforms_exact(p):
    n_plus = p["n"] + 1
    return {
        "nPlusOne": float(n_plus),
        "fraction": _round9(p["n"] / n_plus),
        "gapBelowTop": _round9(p["top"] / n_plus),
        "answer": _round9((p["top"] * p["n"]) / n_plus),
    }


def expected_maximum_of_uniforms_brute(p):
    """Integrate the SURVIVAL function: E[max] = int_0^L (1 - (x/L)^n) dx. The n/(n+1) closed form
    the template teaches never appears, and a wrong exponent would change the integral."""
    n, top = int(p["n"]), float(p["top"])
    surv = lambda x: 1 - (x / top) ** n
    got, _ = integrate.quad(surv, 0, top)
    rng = np.random.default_rng(23)
    est = float(rng.uniform(0, top, size=(60000, n)).max(axis=1).mean())
    assert abs(est - got) < 0.02 * got, "a drawn sample disagrees with the survival integral"
    return got


def expected_range_of_uniforms_exact(p):
    n_plus = p["n"] + 1
    return {
        "nPlusOne": float(n_plus),
        "nLessOne": float(p["n"] - 1),
        "gap": _round9(p["top"] / n_plus),
        "expectedMax": _round9((p["top"] * p["n"]) / n_plus),
        "expectedMin": _round9(p["top"] / n_plus),
        "answer": _round9((p["top"] * (p["n"] - 1)) / n_plus),
    }


def expected_range_of_uniforms_brute(p):
    """Integrate both ends separately — the maximum's survival function and the minimum's — and
    subtract. Neither the (n-1)/(n+1) form nor the equal-gaps picture is used."""
    n, top = int(p["n"]), float(p["top"])
    e_max, _ = integrate.quad(lambda x: 1 - (x / top) ** n, 0, top)
    e_min, _ = integrate.quad(lambda x: (1 - x / top) ** n, 0, top)
    got = e_max - e_min
    rng = np.random.default_rng(29)
    draws = rng.uniform(0, top, size=(60000, n))
    est = float((draws.max(axis=1) - draws.min(axis=1)).mean())
    assert abs(est - got) < 0.02 * got, "a drawn sample disagrees with the two integrals"
    return got


def probability_a_given_order_statistic_exceeds_exact(p):
    q = _round9(p["qPct"] / 100)
    n, k = int(p["n"]), int(p["k"])
    tail = sum(_comb(n, j) * q ** j * (1 - q) ** (n - j) for j in range(k, n + 1))
    return {
        "q": q,
        "below": _round9(1 - q),
        "threshold": _round9(p["top"] * (1 - q)),
        "atLeastOne": _round9(1 - (1 - q) ** n),
        "answer": _round9(tail),
    }


def probability_a_given_order_statistic_exceeds_brute(p):
    """The regularised incomplete Beta function. P(at least k of n exceed) is exactly the Beta
    CDF complement with parameters k and n-k+1 — a continuous special function rather than a sum
    of binomial terms, so a mis-set summation limit cannot be mirrored."""
    n, k, q = int(p["n"]), int(p["k"]), p["qPct"] / 100
    got = float(_beta.cdf(q, k, n - k + 1))
    # An exhaustive enumeration over which readings are slow, for a third independent route.
    total = 0.0
    for bits in itertools.product([0, 1], repeat=n):
        if sum(bits) >= k:
            total += q ** sum(bits) * (1 - q) ** (n - sum(bits))
    assert abs(total - got) < 1e-9, "enumeration disagrees with the Beta route"
    return got


def median_of_an_odd_sample_from_two_groups_exact(p):
    total = p["nA"] + p["nB"]
    return {
        "total": float(total),
        "middleRank": float((total + 1) / 2),
        "fromB": _round9(p["nB"] / total),
        "answer": _round9(p["nA"] / total),
    }


def median_of_an_odd_sample_from_two_groups_brute(p):
    """ENUMERATE every way group A's readings could occupy ranks, and count the arrangements
    whose middle rank belongs to A. The nA/n symmetry argument the template makes is never used —
    this counts arrangements."""
    na, nb = int(p["nA"]), int(p["nB"])
    total = na + nb
    middle = (total - 1) // 2      # zero-based index of the median rank
    hits = 0
    seen = 0
    for positions in itertools.combinations(range(total), na):
        seen += 1
        if middle in positions:
            hits += 1
    assert seen == _comb(total, na), "enumeration missed arrangements"
    return hits / seen


SOLVERS.update({
    "statistics/p-value-from-a-z-statistic": {"exact": p_value_from_a_z_statistic_exact, "brute": p_value_from_a_z_statistic_brute},
    "statistics/bias-of-the-plug-in-variance": {"exact": bias_of_the_plug_in_variance_exact, "brute": bias_of_the_plug_in_variance_brute},
    "statistics/mse-decomposition": {"exact": mse_decomposition_exact, "brute": mse_decomposition_brute},
    "statistics/variance-of-a-difference-in-means": {"exact": variance_of_a_difference_in_means_exact, "brute": variance_of_a_difference_in_means_brute},
    "statistics/efficiency-of-two-unbiased-estimators": {"exact": efficiency_of_two_unbiased_estimators_exact, "brute": efficiency_of_two_unbiased_estimators_brute},
    "statistics/sample-variance-of-a-linear-combination": {"exact": sample_variance_of_a_linear_combination_exact, "brute": sample_variance_of_a_linear_combination_brute},
    "statistics/clt-probability-for-a-sample-mean": {"exact": clt_probability_for_a_sample_mean_exact, "brute": clt_probability_for_a_sample_mean_brute},
    "statistics/finite-population-correction": {"exact": finite_population_correction_exact, "brute": finite_population_correction_brute},
    "statistics/weighted-least-squares-single-mean": {"exact": weighted_least_squares_single_mean_exact, "brute": weighted_least_squares_single_mean_brute},
    "statistics/two-sided-z-test-statistic": {"exact": two_sided_z_test_statistic_exact, "brute": two_sided_z_test_statistic_brute},
    "statistics/confidence-interval-half-width": {"exact": confidence_interval_half_width_exact, "brute": confidence_interval_half_width_brute},
    "statistics/type-two-error-and-power": {"exact": type_two_error_and_power_exact, "brute": type_two_error_and_power_brute},
    "statistics/sample-size-for-a-proportion": {"exact": sample_size_for_a_proportion_exact, "brute": sample_size_for_a_proportion_brute},
    "statistics/expected-maximum-of-uniforms": {"exact": expected_maximum_of_uniforms_exact, "brute": expected_maximum_of_uniforms_brute},
    "statistics/expected-range-of-uniforms": {"exact": expected_range_of_uniforms_exact, "brute": expected_range_of_uniforms_brute},
    "statistics/probability-a-given-order-statistic-exceeds": {"exact": probability_a_given_order_statistic_exceeds_exact, "brute": probability_a_given_order_statistic_exceeds_brute},
    "statistics/median-of-an-odd-sample-from-two-groups": {"exact": median_of_an_odd_sample_from_two_groups_exact, "brute": median_of_an_odd_sample_from_two_groups_brute},
})


# ---------------------------------------------------------------------------------------------
# B17 (2026-08-25): the inference batch. Twelve templates. Every brute route below reaches the
# answer WITHOUT the closed form the template teaches:
#
# - one proportion: a 0/1 array with exactly k ones, the statistic from numpy's MEASURED mean in
#   the proportion form (p_hat - p0)/sqrt(p0 q0/n); the count form never appears.
# - chi-square die: scipy.stats.chisquare on the six observed counts.
# - two-sample z: two arrays CONSTRUCTED with the quoted mean and population variance, both
#   measured back by numpy, the statistic assembled from what was measured.
# - two proportions: chi2_contingency on the 2x2 table without continuity correction — for a 2x2
#   table Pearson's chi-square IS the pooled z squared — signed by the difference in rates.
# - Sharpe clock: brentq on S*sqrt(T) - t for T; the inverted square never appears.
# - many backtests: the binomial PMF summed over j >= 1; the complement is never taken.
# - correlation t: two series CONSTRUCTED with exactly the given correlation (Gram-Schmidt), and
#   scipy's linregress slope over its standard error — the regression route to the same t.
# - two-sided power: the density under the ALTERNATIVE integrated over both rejection regions.
# - sample size for power: scan n upward until the CDF power clears the target the statement's
#   power point defines; the count below is asserted to fail.
# - paired: paired arrays CONSTRUCTED with the quoted moments, the difference's spread MEASURED.
# - likelihood ratio: the two binomial PMFs as exact Fractions, coefficient included, divided.
# - Sharpe standard error: the delta method from first principles — a complex-step gradient of
#   m/sqrt(v) and the asymptotic covariance of (mean, variance) under normality — never Lo's form.
# ---------------------------------------------------------------------------------------------

from fractions import Fraction as _Fraction

from scipy.stats import binom as _binom, chi2_contingency as _chi2_contingency, chisquare as _chisquare, linregress as _linregress

_POWER_POINT = {80: 0.842, 90: 1.282, 95: 1.645}

_DIE_PATTERNS = [
    [3, -2, 1, -4, 0, 2], [5, -3, 2, -4, 1, -1], [2, 2, -1, -1, -3, 1], [6, -1, -2, -3, 1, -1],
    [-5, 4, 3, -2, -1, 1], [4, -4, 2, -2, 1, -1], [7, -2, -3, 1, -2, -1], [1, -1, 2, -2, 3, -3],
    [8, -5, -1, -2, 2, -2], [2, -3, 4, -1, -2, 0], [-6, 2, 1, 3, -1, 1], [3, 3, -3, -3, 2, -2],
    [10, -4, -3, -2, 0, -1], [1, 2, 3, -1, -2, -3],
]


def _unit_pattern(n):
    """A mean-zero vector of n points with population variance exactly one: [1, -1, 0, ...]
    scaled by sqrt(n/2)."""
    e = np.zeros(n)
    e[0], e[1] = 1.0, -1.0
    return e * math.sqrt(n / 2)


def _orthonormal_pair(n):
    """Two mean-zero vectors of n points, each with population variance one and population
    covariance zero: [1, -1, 0, ...] and [1, 1, -2, 0, ...], scaled."""
    e1 = np.zeros(n); e1[0], e1[1] = 1.0, -1.0
    e2 = np.zeros(n); e2[0], e2[1], e2[2] = 1.0, 1.0, -2.0
    return e1 * math.sqrt(n / 2), e2 * math.sqrt(n / 6)


def one_proportion_z_statistic_exact(p):
    p0 = p["p0Pct"] / 100
    expected = p["n"] * p0
    sd = _round9(math.sqrt(p["n"] * p0 * (1 - p0)))
    return {
        "p0": p0,
        "q0": _round9(1 - p0),
        "expected": float(expected),
        "variance": _round9(p["n"] * p0 * (1 - p0)),
        "sdCount": sd,
        "k": float(expected + p["off"]),
        "excess": float(p["off"]),
        "pHat": _round9((expected + p["off"]) / p["n"]),
        "answer": _round9(p["off"] / sd),
    }


def one_proportion_z_statistic_brute(p):
    n, p0 = int(p["n"]), p["p0Pct"] / 100
    k = int(round(n * p0 + p["off"]))
    x = np.r_[np.ones(k), np.zeros(n - k)]
    p_hat = float(x.mean())
    return (p_hat - p0) / math.sqrt(p0 * (1 - p0) / n)


def chi_square_statistic_for_a_die_exact(p):
    e, scale = p["expected"], p["scale"]
    dev = [scale * d for d in _DIE_PATTERNS[int(p["pat"])]]
    sum_sq = sum(d * d for d in dev)
    out = {"rolls": float(6 * e), "sumSq": float(sum_sq), "crit": 11.07 if p["alphaPct"] == 5 else 15.09, "df": 5.0,
           "answer": _round9(sum_sq / e)}
    for i, d in enumerate(dev):
        out[f"c{i + 1}"] = float(e + d)
        out[f"d{i + 1}"] = float(d)
    return out


def chi_square_statistic_for_a_die_brute(p):
    e, scale = p["expected"], p["scale"]
    observed = [e + scale * d for d in _DIE_PATTERNS[int(p["pat"])]]
    return float(_chisquare(observed, f_exp=[e] * 6).statistic)


def two_sample_z_statistic_exact(p):
    term_a = _round9(p["varA"] / p["nA"])
    term_b = _round9(p["varB"] / p["nB"])
    se_sq = _round9(term_a + term_b)
    return {
        "termA": term_a,
        "termB": term_b,
        "seSq": se_sq,
        "se": _round9(math.sqrt(se_sq)),
        "meanA": float(p["meanB"] + p["gap"]),
        "gap": float(p["gap"]),
        "answer": _round9(p["gap"] / math.sqrt(se_sq)),
    }


def two_sample_z_statistic_brute(p):
    n_a, n_b = int(p["nA"]), int(p["nB"])
    a = (p["meanB"] + p["gap"]) + math.sqrt(p["varA"]) * _unit_pattern(n_a)
    b = p["meanB"] + math.sqrt(p["varB"]) * _unit_pattern(n_b)
    assert abs(a.var() - p["varA"]) < 1e-9 and abs(b.var() - p["varB"]) < 1e-9, "constructed samples have the wrong spread"
    return float((a.mean() - b.mean()) / math.sqrt(a.var() / n_a + b.var() / n_b))


def two_proportion_z_statistic_exact(p):
    n_b = p["nA"] * p["ratio"]
    p_a = _round9(p["pAPct"] / 100)
    p_b = _round9((p["pAPct"] + p["diffPct"]) / 100)
    k_a = _round9(p["nA"] * p_a)
    k_b = _round9(n_b * p_b)
    pbar = _round9((k_a + k_b) / (p["nA"] + n_b))
    qbar = _round9(1 - pbar)
    pooled_var = _round9(pbar * qbar)
    inv_sum = _round9(1 / p["nA"] + 1 / n_b)
    return {
        "nB": float(n_b),
        "pA": p_a,
        "pB": p_b,
        "kA": k_a,
        "kB": k_b,
        "pbar": pbar,
        "qbar": qbar,
        "pooledVar": pooled_var,
        "invSum": inv_sum,
        "se": _round9(math.sqrt(pooled_var * inv_sum)),
        "diff": _round9(p_a - p_b),
        "answer": _round9((p_a - p_b) / math.sqrt(pooled_var * inv_sum)),
    }


def two_proportion_z_statistic_brute(p):
    n_a = int(p["nA"]); n_b = n_a * int(p["ratio"])
    k_a = int(round(n_a * p["pAPct"] / 100)); k_b = int(round(n_b * (p["pAPct"] + p["diffPct"]) / 100))
    chi2 = float(_chi2_contingency([[k_a, n_a - k_a], [k_b, n_b - k_b]], correction=False)[0])
    return math.copysign(math.sqrt(chi2), k_a / n_a - k_b / n_b)


def years_to_a_significant_sharpe_exact(p):
    ratio = _round9(p["t"] / p["sr"])
    years = _round9(ratio * ratio)
    return {
        "meanPct": _round9(p["sr"] * p["volPct"]),
        "ratio": ratio,
        "years": years,
        "answer": _round9(years - p["elapsed"]),
    }


def years_to_a_significant_sharpe_brute(p):
    sr, t = float(p["sr"]), float(p["t"])
    total = float(optimize.brentq(lambda T: sr * math.sqrt(T) - t, 1e-6, 1e4, xtol=1e-14, rtol=1e-15))
    return total - float(p["elapsed"])


def false_positive_among_many_backtests_exact(p):
    alpha = _round9(p["alphaPct"] / 100)
    rate = _round9(alpha ** p["k"])
    survive = _round9(1 - rate)
    return {
        "alpha": alpha,
        "rate": rate,
        "survive": survive,
        "noneProb": _round9(survive ** p["m"]),
        "expectedFalse": _round9(p["m"] * rate),
        "answer": _round9(1 - survive ** p["m"]),
    }


def false_positive_among_many_backtests_brute(p):
    m, rate = int(p["m"]), (p["alphaPct"] / 100) ** int(p["k"])
    return float(sum(_binom.pmf(j, m, rate) for j in range(1, m + 1)))


def correlation_significance_t_statistic_exact(p):
    sx, sy = math.sqrt(p["varX"]), math.sqrt(p["varY"])
    cov = _round9(p["sign"] * p["rAbs"] * sx * sy)
    r = _round9(cov / (sx * sy))
    r_sq = _round9(r * r)
    one_minus = _round9(1 - r_sq)
    root = _round9(math.sqrt(one_minus))
    root_df = math.sqrt(p["nMinus2"])
    return {
        "sx": sx,
        "sy": sy,
        "sxsy": sx * sy,
        "cov": cov,
        "r": r,
        "rSq": r_sq,
        "oneMinusRSq": one_minus,
        "rootOneMinus": root,
        "n": float(p["nMinus2"] + 2),
        "rootDf": root_df,
        "answer": _round9((r * root_df) / root),
    }


def correlation_significance_t_statistic_brute(p):
    n = int(p["nMinus2"]) + 2
    r = float(p["sign"] * p["rAbs"])
    e1, e2 = _orthonormal_pair(n)
    x = math.sqrt(p["varX"]) * e1
    y = math.sqrt(p["varY"]) * (r * e1 + math.sqrt(1 - r * r) * e2)
    assert abs(np.corrcoef(x, y)[0, 1] - r) < 1e-12, "constructed series have the wrong correlation"
    res = _linregress(x, y)
    return float(res.slope / res.stderr)


def power_of_a_two_sided_test_exact(p):
    root = math.sqrt(p["n"])
    crit = _crit_two_sided(p["alphaPct"])
    delta = _round9((p["gap"] * root) / p["sigma"])
    up = _round9(delta - crit)
    far = _round9(delta + crit)
    power = float(_norm.cdf(up) + _norm.cdf(-far))
    one_sided = _crit_one_sided(p["alphaPct"])
    return {
        "root": root,
        "crit": crit,
        "delta": delta,
        "shiftUp": up,
        "farDistance": far,
        "nearTail": _round9(_norm.cdf(up)),
        "farTail": _round9(_norm.cdf(-far)),
        "oneSidedCrit": one_sided,
        "oneSidedPower": _round9(_norm.cdf(delta - one_sided)),
        "beta": _round9(1 - power),
        "answer": _round9(power),
    }


def power_of_a_two_sided_test_brute(p):
    sigma, n, gap = float(p["sigma"]), int(p["n"]), float(p["gap"])
    crit = _crit_two_sided(int(p["alphaPct"]))
    se = sigma / math.sqrt(n)
    dens = lambda x: math.exp(-((x - gap) / se) ** 2 / 2) / (se * math.sqrt(2 * math.pi))
    upper, _ = integrate.quad(dens, crit * se, gap + 40 * se)
    lower, _ = integrate.quad(dens, gap - 40 * se, -crit * se)
    return upper + lower


def sample_size_for_target_power_exact(p):
    crit = _crit_one_sided(p["alphaPct"])
    z_beta = _POWER_POINT[int(p["powerPct"])]
    raw = _round9((((crit + z_beta) * p["sigma"]) / p["gap"]) ** 2)
    answer = math.ceil(raw)
    return {
        "crit": crit,
        "zBeta": z_beta,
        "multiplier": _round9(crit + z_beta),
        "raw": raw,
        "powerAtAnswer": _round9(_norm.cdf((p["gap"] * math.sqrt(answer)) / p["sigma"] - crit)),
        "answer": float(answer),
    }


def sample_size_for_target_power_brute(p):
    crit, z_beta = _crit_one_sided(int(p["alphaPct"])), _POWER_POINT[int(p["powerPct"])]
    sigma, gap = float(p["sigma"]), float(p["gap"])
    target = float(_norm.cdf(z_beta))
    power = lambda n: float(_norm.cdf(gap * math.sqrt(n) / sigma - crit))
    n = 1
    while power(n) < target:
        n += 1
    assert power(n - 1) < target <= power(n), "the scan did not stop at the first clearing count"
    return float(n)


def paired_test_statistic_with_correlation_exact(p):
    var_x, var_y, var_d = p["sx"] ** 2, p["sy"] ** 2, p["sdD"] ** 2
    cov = _round9((var_x + var_y - var_d) / 2)
    root_n = math.sqrt(p["n"])
    unpaired_var = var_x + var_y
    unpaired_se = _round9(math.sqrt(unpaired_var / p["n"]))
    return {
        "varX": float(var_x),
        "varY": float(var_y),
        "cov": cov,
        "rho": _round9(cov / (p["sx"] * p["sy"])),
        "varD": float(var_d),
        "rootN": root_n,
        "se": _round9(p["sdD"] / root_n),
        "unpairedVar": float(unpaired_var),
        "unpairedSe": unpaired_se,
        "unpairedZ": _round9(p["dbar"] / unpaired_se),
        "answer": _round9((p["dbar"] * root_n) / p["sdD"]),
    }


def paired_test_statistic_with_correlation_brute(p):
    n = int(p["n"]); sx, sy, sd_d, dbar = float(p["sx"]), float(p["sy"]), float(p["sdD"]), float(p["dbar"])
    rho = (sx * sx + sy * sy - sd_d * sd_d) / (2 * sx * sy)
    e1, e2 = _orthonormal_pair(n)
    x = sx * e1 + dbar
    y = sy * (rho * e1 + math.sqrt(1 - rho * rho) * e2)
    assert abs(np.cov(x, y, ddof=0)[0, 1] - rho * sx * sy) < 1e-9, "constructed pair has the wrong covariance"
    d = x - y
    return float(d.mean() / (d.std(ddof=0) / math.sqrt(n)))


def likelihood_ratio_for_a_biased_coin_exact(p):
    p1 = _round9(p["p1Pct"] / 100)
    q1 = _round9(1 - p1)
    heads_factor = _round9(2 * p1)
    tails_factor = _round9(2 * q1)
    k = p["n"] / 2 + p["off"]
    return {
        "p1": p1,
        "q1": q1,
        "headsFactor": heads_factor,
        "tailsFactor": tails_factor,
        "k": float(k),
        "tails": float(p["n"] - k),
        "pHat": _round9(k / p["n"]),
        "crossover": _round9(math.log(1 / tails_factor) / math.log(heads_factor / tails_factor)),
        "answer": _round9(heads_factor ** k * tails_factor ** (p["n"] - k)),
    }


def likelihood_ratio_for_a_biased_coin_brute(p):
    n = int(p["n"]); k = int(round(n / 2 + p["off"]))
    p1 = _Fraction(int(p["p1Pct"]), 100)
    pmf_biased = _comb(n, k) * p1 ** k * (1 - p1) ** (n - k)
    pmf_fair = _comb(n, k) * _Fraction(1, 2) ** n
    return float(pmf_biased / pmf_fair)


def standard_error_of_a_sharpe_ratio_exact(p):
    sr_sq = _round9(p["sr"] * p["sr"])
    answer = _round9(math.sqrt((1 + sr_sq / (2 * p["q"])) / p["years"]))
    return {
        "srSq": sr_sq,
        "term": _round9(sr_sq / (2 * p["q"])),
        "inner": _round9(1 + sr_sq / (2 * p["q"])),
        "periods": float(p["q"] * p["years"]),
        "srPeriod": _round9(p["sr"] / math.sqrt(p["q"])),
        "annualOnlySe": _round9(math.sqrt((1 + sr_sq / 2) / p["years"])),
        "tStat": _round9(p["sr"] / answer),
        "answer": answer,
    }


def standard_error_of_a_sharpe_ratio_brute(p):
    """The delta method from first principles, not Lo's closed form: g(m, v) = m / sqrt(v) at the
    per-period moments, its gradient by complex step (no cancellation), the exact asymptotic
    covariance of (sample mean, sample variance) under normality diag(v/T, 2v^2/T), and the
    per-period error scaled to annual by sqrt(q)."""
    sr, years, q = float(p["sr"]), float(p["years"]), float(p["q"])
    T = q * years
    v = 0.02 ** 2                      # any per-period variance; the ratio is scale-free
    m = (sr / math.sqrt(q)) * math.sqrt(v)
    h = 1e-20
    g = lambda mm, vv: mm / np.sqrt(vv)
    dg_dm = (g(m + 1j * h, v)).imag / h
    dg_dv = (g(m, v + 1j * h)).imag / h
    var_g = dg_dm ** 2 * (v / T) + dg_dv ** 2 * (2 * v * v / T)
    return math.sqrt(var_g) * math.sqrt(q)


SOLVERS.update({
    "statistics/one-proportion-z-statistic": {"exact": one_proportion_z_statistic_exact, "brute": one_proportion_z_statistic_brute},
    "statistics/chi-square-statistic-for-a-die": {"exact": chi_square_statistic_for_a_die_exact, "brute": chi_square_statistic_for_a_die_brute},
    "statistics/two-sample-z-statistic": {"exact": two_sample_z_statistic_exact, "brute": two_sample_z_statistic_brute},
    "statistics/two-proportion-z-statistic": {"exact": two_proportion_z_statistic_exact, "brute": two_proportion_z_statistic_brute},
    "statistics/years-to-a-significant-sharpe": {"exact": years_to_a_significant_sharpe_exact, "brute": years_to_a_significant_sharpe_brute},
    "statistics/false-positive-among-many-backtests": {"exact": false_positive_among_many_backtests_exact, "brute": false_positive_among_many_backtests_brute},
    "statistics/correlation-significance-t-statistic": {"exact": correlation_significance_t_statistic_exact, "brute": correlation_significance_t_statistic_brute},
    "statistics/power-of-a-two-sided-test": {"exact": power_of_a_two_sided_test_exact, "brute": power_of_a_two_sided_test_brute},
    "statistics/sample-size-for-target-power": {"exact": sample_size_for_target_power_exact, "brute": sample_size_for_target_power_brute},
    "statistics/paired-test-statistic-with-correlation": {"exact": paired_test_statistic_with_correlation_exact, "brute": paired_test_statistic_with_correlation_brute},
    "statistics/likelihood-ratio-for-a-biased-coin": {"exact": likelihood_ratio_for_a_biased_coin_exact, "brute": likelihood_ratio_for_a_biased_coin_brute},
    "statistics/standard-error-of-a-sharpe-ratio": {"exact": standard_error_of_a_sharpe_ratio_exact, "brute": standard_error_of_a_sharpe_ratio_brute},
})
