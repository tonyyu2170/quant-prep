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


def sprt_consecutive_wins_exact(p):
    p0, ratio = int(p["p0"]), int(p["ratio"])
    alpha, beta = int(p["alpha"]), int(p["beta"])
    bound = _round9((100 - beta) / alpha)
    step = ratio / 100
    wins = math.ceil(math.log(bound) / math.log(step))
    return {
        "nullRate": _round9(p0 / 100),
        "altRate": _round9(p0 * ratio / 10000),
        "step": _round9(step),
        "alphaRate": _round9(alpha / 100),
        "betaRate": _round9(beta / 100),
        "power": _round9((100 - beta) / 100),
        "bound": bound,
        "winsLess": wins - 1,
        "reached": _round9(step ** wins),
        "shortOf": _round9(step ** (wins - 1)),
        "answer": wins,
    }


def sprt_consecutive_wins_brute(p):
    """The likelihood ratio is COMPOUNDED one win at a time until it clears the boundary, and
    the wins are counted. No logarithm and no ceiling appear — which is the whole content of
    the closed form the template teaches."""
    e = sprt_consecutive_wins_exact(p)
    step = e["altRate"] / e["nullRate"]
    lr, wins = 1.0, 0
    while lr < e["bound"]:
        lr *= step
        wins += 1
        assert wins <= 5000, "compounding ran away"
    return float(wins)


SOLVERS = {
    "statistics/sprt-consecutive-wins": {
        "exact": sprt_consecutive_wins_exact,
        "brute": sprt_consecutive_wins_brute,
    },
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

from scipy.stats import binom as _binom, poisson as _poisson, chi2_contingency as _chi2_contingency, chisquare as _chisquare, linregress as _linregress

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


# ---------------------------------------------------------------------------------------------
# B18 — regression. Every ANSWER below is reached by FITTING A CONSTRUCTED DATA SET, not by
# re-evaluating the closed form the template teaches. A solver that transcribes the template's
# own expression agrees with a wrong template perfectly, which is the one thing this file exists
# to prevent. Each brute() first ASSERTS that its construction carries the statement's givens —
# a construction that does not match the statement is how a brute comes to agree with a wrong
# template. Routes, and where the independence actually lives:
#
# - fitted value and residual: five points CONSTRUCTED with residuals orthogonal to both the
#   constant and the predictor, the line REFITTED by linregress, and the day's miss taken from
#   what that fit predicts. a + b*x0 is never evaluated.
# - intercept from means: the same construction at the quoted sample means; the INTERCEPT is
#   read straight off the fit rather than as ybar - b*xbar.
# - R-squared: a sample CONSTRUCTED with exactly the two quoted integer sums of squares, the
#   regression actually run, and scipy's squared correlation returned; the exact rational
#   (T-U)/T is asserted against it, and 1 - U/T is never evaluated.
# - rescaling: the slope is carried by a fitted sample, BOTH axes are relabelled by multiplying
#   every number through, and the sample is refitted. The direction the two factors act in is
#   settled by the fit — the one thing about this template that has already been wrong once.
# - shifting: the predictor is re-expressed as degrees above the reference and REFITTED; the new
#   intercept is the second fit's own.
# - through the origin: numpy's lstsq on a design matrix with NO intercept column, over a sample
#   built to the two quoted sums; the exact Fraction is asserted against what LAPACK returns.
# - omitted variable: the LONG regression and the SHORT regression are both fitted on the same
#   constructed stocks. This is the one where an independent route matters most — b1 + b2*delta
#   is exactly what the template asserts, so transcribing it would prove nothing. The long fit
#   is asserted to recover both quoted coefficients, and the short fit's slope is RETURNED.
# - slope standard error: scipy's linregress exposes `stderr` off the residuals it measures
#   itself, over a sample built to the quoted Sxx and residual sum of squares. s/sqrt(Sxx)
#   never appears.
# - regression to the mean: two years CONSTRUCTED with the quoted spread and correlation, this
#   year REGRESSED on last year, and the fitted line evaluated at the desk. The shrinkage factor
#   is whatever slope the fit reports, never applied by hand.
# - fitted-value standard error: the quadratic form sigma * sqrt(x0' (X'X)^-1 x0) solved out of
#   the design matrix, with the predictor at a NONZERO mean so X'X carries a real off-diagonal —
#   centring it would collapse the form back onto the template's 1/n + d^2/Sxx.
# - adding a point: the n weeks are built, the new week APPENDED, and all n+1 points refitted
#   from scratch. The rank-one update is never evaluated; the exact Fraction is asserted.
# - orthogonal regressors: the two settings are the orthonormal pair, so the sample correlation
#   is EXACTLY zero by construction; each single-setting slope is asserted, and the JOINT fit is
#   evaluated at the day.
# ---------------------------------------------------------------------------------------------


def _centred_grid(n, ss):
    """n mean-zero predictor deviations whose sum of squares is exactly `ss`: an evenly spaced
    symmetric grid, rescaled. The symmetry makes the mean exactly zero in floating point."""
    d = np.arange(n, dtype=float) - (n - 1) / 2
    return d * math.sqrt(ss / float(d @ d))


def _orthogonal_residuals(d, ss):
    """A residual vector over the symmetric grid `d`, orthogonal to both the constant and `d` —
    the grid's odd moments vanish, so d^2 less its own mean is orthogonal to both — rescaled to
    sum of squares `ss`."""
    e = d * d
    e = e - e.mean()
    e = e * math.sqrt(ss / float(e @ e))
    scale = max(1.0, float(ss))
    assert abs(float(e.sum())) < 1e-9 * scale and abs(float(d @ e)) < 1e-9 * scale, \
        "residual vector is not orthogonal to the design"
    return e


_SMALL_GRID = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
_SMALL_RESID = np.array([1.0, -1.0, 0.0, -1.0, 1.0])   # sums to zero, orthogonal to _SMALL_GRID


def fitted_value_and_residual_exact(p):
    a, b, x0, y0 = float(p["a"]), float(p["b"]), float(p["x0"]), float(p["y0"])
    return {
        "slopeTerm": _round9(b * x0),
        "fitted": _round9(a + b * x0),
        "answer": _round9(y0 - (a + b * x0)),
    }


def fitted_value_and_residual_brute(p):
    a, b, x0, y0 = float(p["a"]), float(p["b"]), float(p["x0"]), float(p["y0"])
    x = x0 + _SMALL_GRID
    fit = _linregress(x, a + b * x + _SMALL_RESID)
    assert abs(fit.slope - b) < 1e-9 and abs(fit.intercept - a) < 1e-9, \
        "constructed sample does not fit the quoted line"
    return float(y0 - (fit.intercept + fit.slope * x0))


def regression_intercept_from_means_exact(p):
    xbar, ybar, b = float(p["xbar"]), float(p["ybar"]), float(p["b"])
    return {"slopeTerm": _round9(b * xbar), "answer": _round9(ybar - b * xbar)}


def regression_intercept_from_means_brute(p):
    xbar, ybar, b = float(p["xbar"]), float(p["ybar"]), float(p["b"])
    x, y = xbar + _SMALL_GRID, ybar + b * _SMALL_GRID + _SMALL_RESID
    fit = _linregress(x, y)
    assert abs(float(x.mean()) - xbar) < 1e-9 and abs(float(y.mean()) - ybar) < 1e-9, \
        "constructed sample has the wrong means"
    assert abs(fit.slope - b) < 1e-9, "constructed sample has the wrong slope"
    return float(fit.intercept)


def r_squared_from_sums_of_squares_exact(p):
    tss, rss = float(p["tss"]), float(p["rss"])
    ess = _round9(tss - rss)
    return {"ess": ess, "corr": _round9(math.sqrt(ess / tss)), "answer": _round9(1 - rss / tss)}


def r_squared_from_sums_of_squares_brute(p):
    tss, rss = int(p["tss"]), int(p["rss"])
    d = np.array([-1.5, -0.5, 0.5, 1.5])
    e = np.array([1.0, -1.0, -1.0, 1.0]) * math.sqrt(rss / 4)
    y = math.sqrt((tss - rss) / float(d @ d)) * d + e
    assert abs(float(y @ y) - tss) < 1e-9 * tss, "constructed sample has the wrong total sum of squares"
    fit = _linregress(d, y)
    resid = y - (fit.intercept + fit.slope * d)
    assert abs(float(resid @ resid) - rss) < 1e-9 * tss, \
        "constructed sample has the wrong residual sum of squares"
    assert abs(fit.rvalue ** 2 - float(_Fraction(tss - rss, tss))) < 1e-12, \
        "the fitted R-squared is not the exact rational"
    return float(fit.rvalue ** 2)


def slope_after_rescaling_x_exact(p):
    b, k, c = float(p["b"]), float(p["k"]), float(p["ybarScale"])
    return {"numer": _round9(b * c), "answer": _round9((b * c) / k)}


def slope_after_rescaling_x_brute(p):
    b, k, c = float(p["b"]), float(p["k"]), float(p["ybarScale"])
    x = 6.0 + _SMALL_GRID
    y = b * x + _SMALL_RESID
    assert abs(_linregress(x, y).slope - b) < 1e-9, "constructed sample does not carry the quoted slope"
    # One old tick is c new ticks and one old lot is k new lots, so every number in both columns
    # gets that much bigger. Which way each factor moves the slope is left to the refit.
    return float(_linregress(k * x, c * y).slope)


def intercept_after_shifting_x_exact(p):
    a, b, c = float(p["a"]), float(p["b"]), float(p["c"])
    return {"shiftTerm": _round9(b * c), "answer": _round9(a + b * c)}


def intercept_after_shifting_x_brute(p):
    a, b, c = float(p["a"]), float(p["b"]), float(p["c"])
    x = c + _SMALL_GRID
    y = a + b * x + _SMALL_RESID
    first = _linregress(x, y)
    assert abs(first.slope - b) < 1e-9 and abs(first.intercept - a) < 1e-9, \
        "constructed sample does not fit the quoted line"
    second = _linregress(x - c, y)
    assert abs(second.slope - b) < 1e-9, "re-expressing the predictor moved the slope"
    return float(second.intercept)


def slope_through_the_origin_exact(p):
    return {"answer": _round9(p["sumXY"] / p["sumX2"])}


def slope_through_the_origin_brute(p):
    n, sxy, sxx = int(p["n"]), int(p["sumXY"]), int(p["sumX2"])
    v = np.arange(1.0, n + 1.0)
    x = v * math.sqrt(sxx / float(v @ v))
    y = np.full(n, sxy / float(x.sum()))
    assert abs(float(x @ x) - sxx) < 1e-9 * sxx and abs(float(x @ y) - sxy) < 1e-9 * sxx, \
        "constructed days do not carry the quoted sums"
    beta, *_ = np.linalg.lstsq(x.reshape(-1, 1), y, rcond=None)
    assert abs(float(beta[0]) - float(_Fraction(sxy, sxx))) < 1e-12, \
        "the origin-forced fit is not the exact rational"
    return float(beta[0])


def omitted_variable_bias_exact(p):
    b1, b2, delta = float(p["b1"]), float(p["b2"]), float(p["delta"])
    return {"biasTerm": _round9(b2 * delta), "answer": _round9(b1 + b2 * delta)}


def omitted_variable_bias_brute(p):
    b1, b2, delta = float(p["b1"]), float(p["b2"]), float(p["delta"])
    v1 = np.array([1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0])
    v2 = np.array([1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0])
    v3 = np.array([1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0])
    value = 2.0 * v1
    momentum = delta * value + 3.0 * v2
    ret = b1 * value + b2 * momentum + 1.5 * v3
    assert abs(_linregress(value, momentum).slope - delta) < 1e-9, \
        "momentum does not regress on value with the quoted slope"
    long_fit, *_ = np.linalg.lstsq(np.column_stack([np.ones(8), value, momentum]), ret, rcond=None)
    assert abs(long_fit[1] - b1) < 1e-9 and abs(long_fit[2] - b2) < 1e-9, \
        "the joint fit does not carry the two quoted coefficients"
    return float(_linregress(value, ret).slope)


def standard_error_of_a_slope_exact(p):
    sVar, n, sxx = float(p["sVar"]), float(p["n"]), float(p["sxx"])
    return {
        "rss": sVar * (n - 2),      # the template does not round this: both operands are integers
        "sSD": math.sqrt(sVar),     # nor this: exact4 pins the root to four figures
        "answer": _round9(math.sqrt(sVar) / math.sqrt(sxx)),
    }


def standard_error_of_a_slope_brute(p):
    sVar, n, sxx = float(p["sVar"]), int(p["n"]), float(p["sxx"])
    rss = sVar * (n - 2)
    d = _centred_grid(n, sxx)
    y = 0.75 * d + _orthogonal_residuals(d, rss)
    fit = _linregress(d, y)
    resid = y - (fit.intercept + fit.slope * d)
    assert abs(float(d @ d) - sxx) < 1e-9 * sxx, "constructed days have the wrong Sxx"
    assert abs(float(resid @ resid) - rss) < 1e-9 * rss, \
        "constructed days have the wrong residual sum of squares"
    return float(fit.stderr)


def regression_to_the_mean_prediction_exact(p):
    mean, sd, r, z = float(p["mean"]), float(p["sd"]), float(p["r"]), float(p["z"])
    return {
        "dev": _round9(z * sd),
        "shrunk": _round9(r * z * sd),
        "answer": _round9(mean + r * z * sd),
    }


def regression_to_the_mean_prediction_brute(p):
    mean, sd, r, z = float(p["mean"]), float(p["sd"]), float(p["r"]), float(p["z"])
    e1, e2 = _orthonormal_pair(12)
    last = mean + sd * e1
    this = mean + sd * (r * e1 + math.sqrt(1 - r * r) * e2)
    assert abs(float(last.std(ddof=0)) - sd) < 1e-9 and abs(float(this.std(ddof=0)) - sd) < 1e-9, \
        "the two constructed years do not share the quoted spread"
    assert abs(float(np.corrcoef(last, this)[0, 1]) - r) < 1e-9, \
        "the two constructed years do not carry the quoted correlation"
    fit = _linregress(last, this)
    return float(fit.intercept + fit.slope * (mean + z * sd))


def variance_of_a_fitted_value_exact(p):
    sigma, n, dist, sxx = float(p["sigma"]), float(p["n"]), float(p["d"]), float(p["sxx"])
    h = 1 / n + (dist * dist) / sxx
    return {
        "invN": _round9(1 / n),
        "leverage": _round9((dist * dist) / sxx),
        "h": _round9(h),
        "root": _round9(math.sqrt(h)),
        "centreSE": _round9(sigma / math.sqrt(n)),
        "answer": _round9(sigma * math.sqrt(h)),
    }


def variance_of_a_fitted_value_brute(p):
    sigma, n, dist, sxx = float(p["sigma"]), int(p["n"]), float(p["d"]), float(p["sxx"])
    xbar = 7.0                      # nonzero on purpose: centring makes X'X diagonal and the
    x = xbar + _centred_grid(n, sxx)   # quadratic form collapses onto the template's own form
    assert abs(float(((x - x.mean()) ** 2).sum()) - sxx) < 1e-9 * sxx, \
        "constructed months have the wrong Sxx"
    design = np.column_stack([np.ones(n), x])
    x0 = np.array([1.0, xbar + dist])
    return float(sigma * math.sqrt(float(x0 @ np.linalg.solve(design.T @ design, x0))))


def slope_after_adding_a_point_exact(p):
    n, sxx, b = float(p["n"]), float(p["sxx"]), float(p["b"])
    dx, dy = float(p["dx"]), float(p["dy"])
    n_plus = n + 1
    denom = n_plus * sxx + n * dx * dx
    return {
        "nPlus": n_plus,
        "sxy": _round9(b * sxx),
        "numer": _round9(n_plus * b * sxx + n * dx * dy),
        "denom": denom,
        "pointSlope": _round9(dy / dx),
        "answer": _round9((n_plus * b * sxx + n * dx * dy) / denom),
    }


def slope_after_adding_a_point_brute(p):
    n, sxx, b = int(p["n"]), float(p["sxx"]), float(p["b"])
    dx, dy = float(p["dx"]), float(p["dy"])
    d = _centred_grid(n, sxx)
    y = b * d + _orthogonal_residuals(d, sxx)
    first = _linregress(d, y)
    assert abs(first.slope - b) < 1e-9, "constructed weeks do not carry the quoted slope"
    assert abs(float(d @ d) - sxx) < 1e-9 * sxx, "constructed weeks have the wrong Sxx"
    # The old means sit at the origin, so the new week is the point (dx, dy) itself.
    refit = _linregress(np.append(d, dx), np.append(y, dy))
    fb, fsxx, fx, fy = _Fraction(b), _Fraction(sxx), _Fraction(dx), _Fraction(dy)
    exact = ((n + 1) * fb * fsxx + n * fx * fy) / ((n + 1) * fsxx + n * fx * fx)
    assert abs(refit.slope - float(exact)) < 1e-11, "the refit is not the exact rational update"
    return float(refit.slope)


def prediction_with_orthogonal_regressors_exact(p):
    ybar, b1, b2 = float(p["ybar"]), float(p["b1"]), float(p["b2"])
    d1, d2 = float(p["d1"]), float(p["d2"])
    return {
        "t1": _round9(b1 * d1),
        "t2": _round9(b2 * d2),
        "answer": _round9(ybar + b1 * d1 + b2 * d2),
    }


def prediction_with_orthogonal_regressors_brute(p):
    ybar, b1, b2 = float(p["ybar"]), float(p["b1"]), float(p["b2"])
    d1, d2 = float(p["d1"]), float(p["d2"])
    e1, e2 = _orthonormal_pair(12)
    batching, band = 3.0 * e1, 2.0 * e2
    resid = np.zeros(12)
    resid[4], resid[5] = 1.0, -1.0     # orthogonal to the constant and to both settings
    ratio = ybar + b1 * batching + b2 * band + resid
    assert abs(float(batching @ band)) < 1e-9, "the two settings are not exactly uncorrelated"
    assert abs(_linregress(batching, ratio).slope - b1) < 1e-9, \
        "the fit on the batching interval alone misses its quoted slope"
    assert abs(_linregress(band, ratio).slope - b2) < 1e-9, \
        "the fit on the band width alone misses its quoted slope"
    coef, *_ = np.linalg.lstsq(np.column_stack([np.ones(12), batching, band]), ratio, rcond=None)
    return float(coef[0] + coef[1] * d1 + coef[2] * d2)


SOLVERS.update({
    "statistics/fitted-value-and-residual": {"exact": fitted_value_and_residual_exact, "brute": fitted_value_and_residual_brute},
    "statistics/regression-intercept-from-means": {"exact": regression_intercept_from_means_exact, "brute": regression_intercept_from_means_brute},
    "statistics/r-squared-from-sums-of-squares": {"exact": r_squared_from_sums_of_squares_exact, "brute": r_squared_from_sums_of_squares_brute},
    "statistics/slope-after-rescaling-x": {"exact": slope_after_rescaling_x_exact, "brute": slope_after_rescaling_x_brute},
    "statistics/intercept-after-shifting-x": {"exact": intercept_after_shifting_x_exact, "brute": intercept_after_shifting_x_brute},
    "statistics/slope-through-the-origin": {"exact": slope_through_the_origin_exact, "brute": slope_through_the_origin_brute},
    "statistics/omitted-variable-bias": {"exact": omitted_variable_bias_exact, "brute": omitted_variable_bias_brute},
    "statistics/standard-error-of-a-slope": {"exact": standard_error_of_a_slope_exact, "brute": standard_error_of_a_slope_brute},
    "statistics/regression-to-the-mean-prediction": {"exact": regression_to_the_mean_prediction_exact, "brute": regression_to_the_mean_prediction_brute},
    "statistics/variance-of-a-fitted-value": {"exact": variance_of_a_fitted_value_exact, "brute": variance_of_a_fitted_value_brute},
    "statistics/slope-after-adding-a-point": {"exact": slope_after_adding_a_point_exact, "brute": slope_after_adding_a_point_brute},
    "statistics/prediction-with-orthogonal-regressors": {"exact": prediction_with_orthogonal_regressors_exact, "brute": prediction_with_orthogonal_regressors_brute},
})


# --- B19: maximum likelihood and Fisher information ----------------------------------------
#
# The brute() route for an MLE template is a NUMERICAL search for the maximiser, never the
# closed form the template derives: the score equation is solved by brentq, or the sampling
# distribution the bound describes is enumerated outright. That is what makes these checks
# independent — an algebra slip in the template cannot reappear here, because no algebra is
# reused.

def mle_of_an_exponential_rate_exact(p):
    gaps, hours = float(p["gaps"]), float(p["hours"])
    return {
        "answer": _round9(gaps / hours),
        "meanGapMin": _round9((60.0 * hours) / gaps),
        "twiceHours": 2.0 * hours,
        "twiceGaps": 2.0 * gaps,
    }


def mle_of_an_exponential_rate_brute(p):
    """Solve the score equation numerically instead of writing down count/exposure."""
    gaps, hours = float(p["gaps"]), float(p["hours"])
    score = lambda lam: gaps / lam - hours          # d/dlam of [gaps*log(lam) - lam*hours]
    root = optimize.brentq(score, 1e-6, 1e6, xtol=1e-15, rtol=8.9e-16)
    loglik = lambda lam: gaps * math.log(lam) - lam * hours
    assert loglik(root) > loglik(root * 1.001) and loglik(root) > loglik(root * 0.999), \
        "the located rate is not a maximum of the log-likelihood"
    return root


def cramer_rao_bound_for_a_proportion_exact(p):
    n, pct = float(p["n"]), float(p["pct"])
    q = _round9(pct / 100.0)
    one_minus = _round9(1.0 - q)
    product = _round9(q * one_minus)
    exact_variance = (q * one_minus) / n
    return {
        "q": q, "oneMinus": one_minus, "product": product,
        "variance": _round9(exact_variance),
        "seFraction": _round9(math.sqrt(exact_variance)),
        "answer": _round9(100.0 * math.sqrt(exact_variance)),
        "quadN": 4.0 * n,
    }


def cramer_rao_bound_for_a_proportion_brute(p):
    """Enumerate the sampling distribution of the estimator that attains the bound, rather
    than inverting an information formula: sum k over the binomial pmf and read its spread."""
    n, q = int(p["n"]), float(p["pct"]) / 100.0
    ks = np.arange(0, n + 1)
    pmf = _binom.pmf(ks, n, q)
    assert abs(pmf.sum() - 1.0) < 1e-12, "the enumerated sampling distribution does not close"
    phat = ks / n
    mean = float(np.sum(pmf * phat))
    assert abs(mean - q) < 1e-12, "the sample proportion came out biased, so it cannot attain the bound"
    variance = float(np.sum(pmf * (phat - mean) ** 2))
    return 100.0 * math.sqrt(variance)


def standard_error_of_a_fitted_rate_exact(p):
    rate, n = float(p["rate"]), float(p["n"])
    root = _round9(math.sqrt(n))
    return {
        "root": root, "answer": _round9(rate / root), "quadN": 4.0 * n,
        "quadRoot": _round9(2.0 * root), "quadSe": _round9(rate / (2.0 * root)),
    }


def standard_error_of_a_fitted_rate_brute(p):
    """Integrate the Fisher information out of the density itself — the expected squared
    score — instead of quoting the count-over-squared-rate result the template derives."""
    rate, n = float(p["rate"]), int(p["n"])
    score_sq = lambda x: math.exp(-rate * x) * rate * (1.0 / rate - x) ** 2
    info_one, err = integrate.quad(score_sq, 0.0, np.inf, epsabs=1e-13, epsrel=1e-13)
    assert err < 1e-10, "the information integral did not converge tightly enough"
    return 1.0 / math.sqrt(n * info_one)


def mle_of_a_tail_probability_exact(p):
    gaps, hours, horizon = float(p["gaps"]), float(p["hours"]), float(p["horizon"])
    rate = _round9(gaps / hours)
    exponent = _round9((gaps / hours) * horizon)
    return {
        "rate": rate, "exponent": exponent,
        "answer": _round9(math.exp(-exponent)), "horizonMin": _round9(60.0 * horizon),
    }


def mle_of_a_tail_probability_brute(p):
    """Maximise the likelihood in the TAIL-PROBABILITY parameterisation directly. If invariance
    failed, this search would land somewhere other than the transformed rate estimate."""
    gaps, hours, horizon = float(p["gaps"]), float(p["hours"]), float(p["horizon"])
    rate_of = lambda q: -math.log(q) / horizon
    loglik = lambda q: gaps * math.log(rate_of(q)) - rate_of(q) * hours
    dloglik = lambda q: (gaps / rate_of(q) - hours) * (-1.0 / (q * horizon))
    root = optimize.brentq(dloglik, 1e-12, 1.0 - 1e-12, xtol=1e-16, rtol=8.9e-16)
    assert loglik(root) > loglik(root * 1.001) and loglik(root) > loglik(root * 0.999), \
        "the located tail probability is not a maximum of the likelihood"
    return root


def pooled_rate_standard_error_exact(p):
    x1, x2, t1, t2 = float(p["x1"]), float(p["x2"]), float(p["t1"]), float(p["t2"])
    total_events, total_days = x1 + x2, t1 + t2
    return {
        "totalEvents": total_events, "totalDays": total_days,
        "rate": _round9(total_events / total_days),
        "rootEvents": _round9(math.sqrt(total_events)),
        "answer": _round9(math.sqrt(total_events) / total_days),
        "rate1": _round9(x1 / t1), "rate2": _round9(x2 / t2),
    }


def pooled_rate_standard_error_brute(p):
    """Enumerate the Poisson law of the pooled COUNT and read its spread, rather than
    inverting the information. The count, not the rate, is what carries the variance."""
    x1, x2, t1, t2 = float(p["x1"]), float(p["x2"]), float(p["t1"]), float(p["t2"])
    total_events, total_days = x1 + x2, t1 + t2
    mean_count = total_events                      # rate-hat times total exposure, by construction
    ks = np.arange(0, int(mean_count) + 400)
    pmf = _poisson.pmf(ks, mean_count)
    assert abs(pmf.sum() - 1.0) < 1e-12, "the enumerated count distribution does not close"
    variance_count = float(np.sum(pmf * (ks - mean_count) ** 2))
    assert abs(variance_count - mean_count) < 1e-6, "a Poisson count's variance should equal its mean"
    return math.sqrt(variance_count) / total_days


def bias_corrected_uniform_endpoint_exact(p):
    n, max_obs = float(p["n"]), float(p["maxObs"])
    n_plus_one = n + 1.0
    factor = _round9(n_plus_one / n)
    answer = _round9((max_obs * n_plus_one) / n)
    return {
        "nPlusOne": n_plus_one, "factor": factor, "answer": answer,
        "bias": _round9(answer - max_obs), "expectedMax": _round9((max_obs * n) / n_plus_one),
    }


def bias_corrected_uniform_endpoint_brute(p):
    """Integrate the expected maximum out of its density on the unit interval and undo the
    shrinkage that integral reports — the n-over-n-plus-one identity is never written down."""
    n, max_obs = int(p["n"]), float(p["maxObs"])
    density = lambda x: n * x ** (n - 1)           # density of the max of n uniforms on [0, 1]
    mass, err = integrate.quad(density, 0.0, 1.0, epsabs=1e-12, epsrel=1e-12)
    assert abs(mass - 1.0) < 1e-11, "the maximum's density does not integrate to one"
    shrinkage, err = integrate.quad(lambda x: x * density(x), 0.0, 1.0, epsabs=1e-12, epsrel=1e-12)
    assert err < 1e-11, "the expected-maximum integral did not converge tightly enough"
    return max_obs / shrinkage


SOLVERS.update({
    "statistics/mle-of-an-exponential-rate": {"exact": mle_of_an_exponential_rate_exact, "brute": mle_of_an_exponential_rate_brute},
    "statistics/cramer-rao-bound-for-a-proportion": {"exact": cramer_rao_bound_for_a_proportion_exact, "brute": cramer_rao_bound_for_a_proportion_brute},
    "statistics/standard-error-of-a-fitted-rate": {"exact": standard_error_of_a_fitted_rate_exact, "brute": standard_error_of_a_fitted_rate_brute},
    "statistics/mle-of-a-tail-probability": {"exact": mle_of_a_tail_probability_exact, "brute": mle_of_a_tail_probability_brute},
    "statistics/pooled-rate-standard-error": {"exact": pooled_rate_standard_error_exact, "brute": pooled_rate_standard_error_brute},
    "statistics/bias-corrected-uniform-endpoint": {"exact": bias_corrected_uniform_endpoint_exact, "brute": bias_corrected_uniform_endpoint_brute},
})


# --- B20: time series ----------------------------------------------------------------------
#
# Each brute() reconstructs the answer from the process itself — the moving-average expansion
# summed term by term, the covariance matrix built and contracted, the recursion iterated, a
# horizon root-found — never from the closed form the template collects. Every geometric series
# here is summed to convergence rather than folded, which is the whole point: the fold is what
# is being checked.

_MA_TERMS = 4000          # phi^2 <= 0.81, so this is far past double precision


def ar1_stationary_spread_exact(p):
    phi, sigma = float(p["phi"]), float(p["sigmaEps"])
    phi_sq = _round9(phi * phi)
    return {
        "phiSq": phi_sq,
        "oneMinus": _round9(1.0 - phi_sq),
        "answer": _round9(sigma / math.sqrt(1.0 - phi * phi)),
        "inflation": _round9(1.0 / math.sqrt(1.0 - phi * phi)),
    }


def ar1_stationary_spread_brute(p):
    """Sum the moving-average expansion: the process is the weighted sum of all past shocks,
    so its variance is the shock variance times the sum of the squared weights."""
    phi, sigma = float(p["phi"]), float(p["sigmaEps"])
    weights = phi ** np.arange(_MA_TERMS)
    variance = float(sigma * sigma * np.sum(weights * weights))
    assert weights[-1] < 1e-15, "the expansion was truncated before it converged"
    return math.sqrt(variance)


def ar1_lag_covariance_exact(p):
    phi, k, sd = float(p["phi"]), int(p["k"]), float(p["sd"])
    return {
        "phiPow": _round9(phi ** k),
        "variance": _round9(sd * sd),
        "answer": _round9((phi ** k) * sd * sd),
        "nextLag": _round9((phi ** (k + 1)) * sd * sd),
        "kPlusOne": float(k + 1),
    }


def ar1_lag_covariance_brute(p):
    """Cross-multiply the two moving-average expansions term by term. Shocks are independent,
    so only shocks common to both dates survive, and the lag shows up as an offset."""
    phi, k, sd = float(p["phi"]), int(p["k"]), float(p["sd"])
    shock_var = sd * sd * (1.0 - phi * phi)          # what the stationary width implies
    j = np.arange(_MA_TERMS)
    return float(shock_var * np.sum(phi ** j * phi ** (j + k)))


def ar1_forecast_level_exact(p):
    phi, mu, xt, h = float(p["phi"]), float(p["mu"]), float(p["xt"]), int(p["h"])
    dev = xt - mu
    return {
        "deviation": _round9(abs(dev)),
        "phiPow": _round9(phi ** h),
        "decayed": _round9(abs((phi ** h) * dev)),
        "answer": _round9(mu + (phi ** h) * dev),
        "oneStep": _round9(mu + phi * dev),
    }


def ar1_forecast_level_brute(p):
    """Iterate the conditional expectation one day at a time — no power is ever taken."""
    phi, mu, xt, h = float(p["phi"]), float(p["mu"]), float(p["xt"]), int(p["h"])
    level = xt
    for _ in range(h):
        level = mu + phi * (level - mu)
    return level


def mean_reversion_decay_time_exact(p):
    phi, frm, to = float(p["phi"]), float(p["from"]), float(p["to"])
    return {
        "ratio": _round9(to / frm),
        "answer": _round9(math.log(to / frm) / math.log(phi)),
        "halfLife": _round9(math.log(0.5) / math.log(phi)),
    }


def mean_reversion_decay_time_brute(p):
    """Root-find the horizon at which the decayed gap meets the target. No logarithm is taken:
    the template's answer IS a ratio of logs, so using one here would check nothing."""
    phi, frm, to = float(p["phi"]), float(p["from"]), float(p["to"])
    gap = lambda t: frm * phi ** t - to
    root = optimize.brentq(gap, 0.0, 1e4, xtol=1e-14, rtol=8.9e-16)
    assert gap(root * 0.99) > 0 > gap(root * 1.01 + 1e-9), "the gap does not cross the target here"
    return root


def ar1_multiday_variance_exact(p):
    phi, sd, q = float(p["phi"]), float(p["sd"]), int(p["q"])
    variance = _round9(sd * sd)
    inflation = _round9(2 + 2 * phi if q == 2 else 3 + 4 * phi + 2 * phi * phi)
    return {
        "variance": variance,
        "inflation": inflation,
        "independent": _round9(q * variance),
        "answer": _round9(sd * sd * (2 + 2 * phi if q == 2 else 3 + 4 * phi + 2 * phi * phi)),
        "phiSq": _round9(phi * phi),
    }


def ar1_multiday_variance_brute(p):
    """Build the q-by-q covariance matrix and contract it with a vector of ones — the sum of
    every entry IS the variance of the total, with no pair counted or missed by hand."""
    phi, sd, q = float(p["phi"]), float(p["sd"]), int(p["q"])
    idx = np.arange(q)
    cov = sd * sd * phi ** np.abs(idx[:, None] - idx[None, :])
    assert np.allclose(np.diag(cov), sd * sd), "the diagonal is not the daily variance"
    ones = np.ones(q)
    return float(ones @ cov @ ones)


def standard_error_under_autocorrelation_exact(p):
    phi, sd, n = float(p["phi"]), float(p["sd"]), int(p["n"])
    ratio = (1.0 + phi) / (1.0 - phi)
    cross = sum((n - k) * phi ** k for k in range(1, n))
    return {
        "root": _round9(math.sqrt(n)),
        "ratio": _round9(ratio),
        "onePlus": _round9(1.0 + phi),
        "oneMinus": _round9(1.0 - phi),
        "naiveSe": _round9(sd / math.sqrt(n)),
        "answer": _round9((sd / math.sqrt(n)) * math.sqrt(ratio)),
        "effectiveN": _round9(n / ratio),
        "exactSe": _round9((sd / n) * math.sqrt(n + 2 * cross)),
    }


def standard_error_under_autocorrelation_brute(p):
    """Sum the autocorrelation function to convergence rather than folding the geometric series.
    This reproduces the LONG-RUN figure the template asks for by name; the exact finite-sample
    standard error is a different and smaller number, and is checked as `exactSe` above."""
    phi, sd, n = float(p["phi"]), float(p["sd"]), int(p["n"])
    k = np.arange(1, _MA_TERMS)
    inflation = 1.0 + 2.0 * float(np.sum(phi ** k))
    assert phi ** _MA_TERMS < 1e-15, "the autocorrelation sum was truncated before it converged"
    return (sd / math.sqrt(n)) * math.sqrt(inflation)


SOLVERS.update({
    "statistics/ar1-stationary-spread": {"exact": ar1_stationary_spread_exact, "brute": ar1_stationary_spread_brute},
    "statistics/ar1-lag-covariance": {"exact": ar1_lag_covariance_exact, "brute": ar1_lag_covariance_brute},
    "statistics/ar1-forecast-level": {"exact": ar1_forecast_level_exact, "brute": ar1_forecast_level_brute},
    "statistics/mean-reversion-decay-time": {"exact": mean_reversion_decay_time_exact, "brute": mean_reversion_decay_time_brute},
    "statistics/ar1-multiday-variance": {"exact": ar1_multiday_variance_exact, "brute": ar1_multiday_variance_brute},
    "statistics/standard-error-under-autocorrelation": {"exact": standard_error_under_autocorrelation_exact, "brute": standard_error_under_autocorrelation_brute},
})
