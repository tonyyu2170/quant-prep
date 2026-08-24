"""Independent Python counterparts for content/problems/stochastic/*.

exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).

brute()/simulate(): recomputes the ANSWER by a route that does not share the template's
identity.

- expected square of a walk: the exact pmf of the walk's endpoint is enumerated and
  sum (start + s)^2 * P(s) taken directly. The a^2 + n d^2 decomposition never appears, so
  the vanishing cross term is a conclusion rather than an assumption.
- missing payoff: the fairness equation is SOLVED by bisection on the unknown payout, so the
  rearranged formula is not reused.
- risk-neutral probability: a two-equation replication system (shares plus cash) is solved for
  the portfolio that pays one in the up state and nothing in the down state; the weight falls
  out of its cost. The (spot - down)/(up + down) formula never appears.
- reflection: a DP over (step, position, running maximum) counts the touching paths outright,
  with no reflection argument at all. That is the whole point — reflection is the identity
  under test.
- exponential martingale: the multiplier is found by bisecting on the fairness condition
  E[r^step] = 1 rather than by quoting q/p, and only then raised to the displacement.
- gbm expected price / probability above strike: Monte Carlo over lognormal draws.
- brownian correlation: Monte Carlo over paths assembled from INDEPENDENT increments, so the
  covariance is measured rather than derived from min(s,t).
- compound sum variance: the full compound distribution is enumerated exactly over both
  supports and its variance taken from the pmf. Wald's second identity never appears.
- gbm fit-then-below-mean: the lognormal density is integrated numerically on a fine grid,
  with the parameters recovered by bisection on the mean-to-median ratio.
"""

import math

import numpy as np


def _round9(x):
    return round(x * 1e9) / 1e9


def _norm_cdf(x):
    return 0.5 * math.erfc(-x / math.sqrt(2.0))


def _walk_endpoint_pmf(n):
    """P(S_n = 2k - n) for a symmetric +/-1 walk, as {position: probability}."""
    pmf = {}
    for ups in range(n + 1):
        c = math.comb(n, ups)
        pmf[2 * ups - n] = c / (2.0 ** n)
    return pmf


# ---------------------------------------------------------------- S1
def expected_square_of_a_walk_exact(p):
    start, steps, tick = int(p["start"]), int(p["steps"]), int(p["tick"])
    return {
        "variance": steps * tick * tick,
        "startSquared": start * start,
        "answer": start * start + steps * tick * tick,
    }


def expected_square_of_a_walk_brute(p):
    start, steps, tick = int(p["start"]), int(p["steps"]), int(p["tick"])
    total = 0.0
    for pos, prob in _walk_endpoint_pmf(steps).items():
        level = start + pos * tick
        total += prob * level * level
    return _round9(total)


# ---------------------------------------------------------------- S2
def martingale_missing_payoff_exact(p):
    pct1, pct2, win, mid = int(p["pct1"]), int(p["pct2"]), int(p["win"]), int(p["mid"])
    pct3 = 100 - pct1 - pct2
    contribution = pct1 * win
    return {
        "pct3": pct3,
        "winContribution": contribution,
        "pooled": mid * 100,
        "answer": _round9((mid * 100 - contribution) / pct3),
    }


def martingale_missing_payoff_brute(p):
    """Bisect on the unknown payout until the game's expected value equals the mark."""
    pct1, pct2, win, mid = int(p["pct1"]), int(p["pct2"]), int(p["win"]), int(p["mid"])
    pct3 = 100 - pct1 - pct2

    def ev(v3):
        return (pct1 / 100.0) * win + (pct2 / 100.0) * 0.0 + (pct3 / 100.0) * v3

    lo, hi = -1e6, 1e6
    for _ in range(200):
        mid_v = (lo + hi) / 2
        if ev(mid_v) < mid:
            lo = mid_v
        else:
            hi = mid_v
    return _round9((lo + hi) / 2)


# ---------------------------------------------------------------- S3
def risk_neutral_up_probability_exact(p):
    spot, up, down = int(p["spot"]), int(p["up"]), int(p["down"])
    return {
        "upPrice": spot + up,
        "downPrice": spot - down,
        "span": up + down,
        "answer": _round9(down / (up + down)),
    }


def risk_neutral_up_probability_brute(p):
    """Replicate the up-state Arrow security with shares and cash, and read its cost. With
    rates at zero that cost IS the weight, and no pricing formula is quoted."""
    spot, up, down = float(p["spot"]), float(p["up"]), float(p["down"])
    su, sd = spot + up, spot - down
    # solve [su 1; sd 1] [shares; cash] = [1; 0]
    a = np.array([[su, 1.0], [sd, 1.0]])
    shares, cash = np.linalg.solve(a, np.array([1.0, 0.0]))
    return _round9(float(shares * spot + cash))


# ---------------------------------------------------------------- S4
def reflection_principle_touch_level_exact(p):
    steps, start, barrier = int(p["steps"]), int(p["start"]), int(p["barrier"])
    gap = barrier - start

    def paths_at_least(n, a):
        return sum(math.comb(n, ups) for ups in range(n + 1) if 2 * ups - n >= a)

    at_or_above = paths_at_least(steps, gap)
    strictly_above = paths_at_least(steps, gap + 1)
    total = 2 ** steps
    return {
        "gap": gap,
        "gapAbove": gap + 1,
        "atOrAbove": at_or_above,
        "strictlyAbove": strictly_above,
        "touchingPaths": at_or_above + strictly_above,
        "totalPaths": total,
        "endsAtOrAbove": _round9(at_or_above / total),
        "answer": _round9((at_or_above + strictly_above) / total),
    }


def reflection_principle_touch_level_brute(p):
    """Count touching paths by walking every step and tracking whether the barrier was met.
    No reflection, no binomial tails — a plain DP over (position, touched)."""
    steps, start, barrier = int(p["steps"]), int(p["start"]), int(p["barrier"])
    states = {(start, False): 1.0}
    for _ in range(steps):
        nxt = {}
        for (pos, touched), prob in states.items():
            for move in (1, -1):
                np_pos = pos + move
                np_touched = touched or np_pos >= barrier
                key = (np_pos, np_touched)
                nxt[key] = nxt.get(key, 0.0) + prob * 0.5
        states = nxt
    return _round9(sum(prob for (_, touched), prob in states.items() if touched))


# ---------------------------------------------------------------- S5
def exponential_martingale_value_exact(p):
    win, start, target = int(p["winPct"]), int(p["start"]), int(p["target"])
    loss = 100 - win
    return {
        "lossPct": loss,
        "ratio": _round9(loss / win),
        "gap": target - start,
        "answer": _round9((loss / win) ** (target - start)),
    }


def exponential_martingale_value_brute(p):
    """Find the multiplier by bisecting on the fairness condition itself: one step must leave
    the quantity unchanged on average. q/p is never written down."""
    win = int(p["winPct"])
    gap = int(p["target"]) - int(p["start"])
    pw, ql = win / 100.0, (100 - win) / 100.0

    def drift(r):
        return pw * r + ql / r - 1.0          # zero when r^position is a fair game

    # The useful root is on the far side of 1 from the drift; bracket it accordingly.
    lo, hi = (1.0 + 1e-12, 1e6) if ql > pw else (1e-6, 1.0 - 1e-12)
    for _ in range(400):
        mid = math.sqrt(lo * hi)
        if (drift(mid) > 0) == (drift(lo) > 0):
            lo = mid
        else:
            hi = mid
    return _round9(math.sqrt(lo * hi) ** gap)


# ---------------------------------------------------------------- S6
def gbm_expected_price_exact(p):
    spot, grow, vol, years = int(p["spot"]), int(p["growPct"]), int(p["volPct"]), int(p["years"])
    half_var = _round9(vol * vol / 200)
    mean_rate = _round9(grow + half_var)
    return {
        "halfVarPct": half_var,
        "meanRatePct": mean_rate,
        "medianGrowthPct": _round9(grow * years),
        "meanGrowthPct": _round9(mean_rate * years),
        "median": _round9(spot * math.exp(grow * years / 100)),
        "answer": _round9(spot * math.exp(mean_rate * years / 100)),
    }


def gbm_expected_price_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    spot, grow, vol, years = int(p["spot"]), int(p["growPct"]), int(p["volPct"]), int(p["years"])
    mu, sigma = grow / 100 * years, vol / 100 * math.sqrt(years)
    total, sq, n = 0.0, 0.0, 0
    while n < trials:
        m = min(chunk, trials - n)
        draws = spot * np.exp(rng.normal(mu, sigma, m))
        total += draws.sum()
        sq += (draws ** 2).sum()
        n += m
    mean = total / n
    var = sq / n - mean * mean
    return mean, math.sqrt(max(var, 0.0) / n)


# ---------------------------------------------------------------- S7
def brownian_covariance_correlation_exact(p):
    early, late = int(p["early"]), int(p["late"])
    return {"ratio": _round9(early / late), "answer": _round9(math.sqrt(early / late))}


def brownian_covariance_correlation_sim(p, rng, trials=40_000_000, chunk=4_000_000):
    """Assemble each path from two INDEPENDENT increments and measure the correlation. Nothing
    about the earlier time being the shared variance is assumed."""
    early, late, vol = int(p["early"]), int(p["late"]), int(p["volPct"])
    sd_first = vol / 100 * math.sqrt(early)
    sd_rest = vol / 100 * math.sqrt(late - early)
    sx = sy = sxx = syy = sxy = 0.0
    n = 0
    while n < trials:
        m = min(chunk, trials - n)
        a = rng.normal(0.0, sd_first, m)
        b = rng.normal(0.0, sd_rest, m)
        later = a + b
        sx += a.sum(); sy += later.sum()
        sxx += (a * a).sum(); syy += (later * later).sum(); sxy += (a * later).sum()
        n += m
    cov = sxy / n - (sx / n) * (sy / n)
    vx = sxx / n - (sx / n) ** 2
    vy = syy / n - (sy / n) ** 2
    r = cov / math.sqrt(vx * vy)
    return r, (1 - r * r) / math.sqrt(n)


# ---------------------------------------------------------------- S8
def compound_sum_variance_exact(p):
    lots, units, rate = int(p["lots"]), int(p["units"]), int(p["rate"])
    mean_lots = _round9((lots + 1) / 2)
    var_lots = _round9((lots * lots - 1) / 12)
    mean_units = _round9((units + 1) / 2)
    var_units = _round9((units * units - 1) / 12)
    mean_units_sq = _round9(mean_units * mean_units)
    within = _round9(mean_lots * var_units)
    across = _round9(var_lots * mean_units_sq)
    combined = _round9(within + across)
    return {
        "meanLots": mean_lots, "varLots": var_lots,
        "meanUnits": mean_units, "varUnits": var_units,
        "meanUnitsSquared": mean_units_sq,
        "spreadWithin": within, "spreadAcross": across, "combined": combined,
        "answer": _round9(rate * rate * combined),
    }


def compound_sum_variance_brute(p):
    """Enumerate the compound distribution exactly: for every crate count and every total, the
    convolution of the per-crate uniform with itself that many times. The variance comes off
    the resulting pmf, so Wald's second identity is never used."""
    lots, units, rate = int(p["lots"]), int(p["units"]), int(p["rate"])
    per_crate = {v: 1.0 / units for v in range(1, units + 1)}
    running = {0: 1.0}
    totals = {}
    for count in range(1, lots + 1):
        nxt = {}
        for total, prob in running.items():
            for v, pv in per_crate.items():
                nxt[total + v] = nxt.get(total + v, 0.0) + prob * pv
        running = nxt
        for total, prob in running.items():
            totals[total] = totals.get(total, 0.0) + prob / lots
    mean = sum(t * pr for t, pr in totals.items())
    var = sum((t - mean) ** 2 * pr for t, pr in totals.items())
    return _round9(var * rate * rate)


# ---------------------------------------------------------------- S9
def gbm_probability_above_strike_exact(p):
    spot, strike = int(p["spot"]), int(p["strike"])
    grow, vol, years = int(p["growPct"]), int(p["volPct"]), int(p["years"])
    half_var = _round9(vol * vol / 200)
    log_drift = _round9(grow - half_var)
    drift_horizon = _round9(log_drift * years)
    sd = _round9(vol * math.sqrt(years))
    hurdle = _round9(100 * math.log(strike / spot))
    z = _round9((hurdle - drift_horizon) / sd)
    return {
        "halfVarPct": half_var, "logDriftPct": log_drift,
        "driftOverHorizonPct": drift_horizon, "sdPct": sd, "hurdlePct": hurdle,
        "rootYears": _round9(math.sqrt(years)), "z": z,
        "answer": _round9(1 - _norm_cdf(z)),
    }


def gbm_probability_above_strike_sim(p, rng, trials=40_000_000, chunk=4_000_000):
    spot, strike = int(p["spot"]), int(p["strike"])
    grow, vol, years = int(p["growPct"]), int(p["volPct"]), int(p["years"])
    sigma = vol / 100 * math.sqrt(years)
    mu = (grow / 100 - (vol / 100) ** 2 / 2) * years
    hits, n = 0, 0
    while n < trials:
        m = min(chunk, trials - n)
        draws = spot * np.exp(rng.normal(mu, sigma, m))
        hits += int((draws > strike).sum())
        n += m
    est = hits / n
    return est, math.sqrt(max(est * (1 - est), 1e-12) / n)


# ---------------------------------------------------------------- S10
def gbm_fit_then_below_mean_exact(p):
    median, mean_pct, mark_pct = int(p["median"]), int(p["meanPct"]), int(p["markPct"])
    skew_log_raw = math.log(mean_pct / 100)
    total_sd_raw = math.sqrt(2 * skew_log_raw)
    mark_log_raw = math.log(mark_pct / 100)
    z_raw = mark_log_raw / total_sd_raw
    return {
        "mean": _round9(median * mean_pct / 100),
        "mark": _round9(median * mark_pct / 100),
        "skewLog": _round9(skew_log_raw),
        "totalSd": _round9(total_sd_raw),
        "markLog": _round9(mark_log_raw),
        "z": _round9(z_raw),
        "answer": _round9(_norm_cdf(z_raw)),
    }


def gbm_fit_then_below_mean_brute(p):
    """Recover the log spread by BISECTING on the mean-to-median ratio a candidate implies,
    then integrate the lognormal density up to the mark on a fine grid. Neither the
    exp(sd^2/2) identity nor the normal CDF closed form is quoted."""
    median, mean_pct, mark_pct = float(p["median"]), float(p["meanPct"]), float(p["markPct"])
    mean = median * mean_pct / 100
    mark = median * mark_pct / 100

    lo, hi = 1e-9, 5.0
    for _ in range(300):                      # find sd with median*exp(sd^2/2) == mean
        mid = (lo + hi) / 2
        if median * math.exp(mid * mid / 2) < mean:
            lo = mid
        else:
            hi = mid
    sd = (lo + hi) / 2

    # integrate the lognormal density from ~0 up to the mark, in log space, by Simpson's rule
    upper = math.log(mark / median) / sd
    lower = -12.0
    steps = 400_000
    h = (upper - lower) / steps
    xs = np.linspace(lower, upper, steps + 1)
    dens = np.exp(-0.5 * xs * xs) / math.sqrt(2 * math.pi)
    w = np.ones(steps + 1)
    w[1:-1:2] = 4.0
    w[2:-1:2] = 2.0
    return _round9(float((h / 3) * np.dot(w, dens)))


SOLVERS = {
    "stochastic/expected-square-of-a-walk": {
        "exact": expected_square_of_a_walk_exact,
        "brute": expected_square_of_a_walk_brute,
    },
    "stochastic/martingale-missing-payoff": {
        "exact": martingale_missing_payoff_exact,
        "brute": martingale_missing_payoff_brute,
    },
    "stochastic/risk-neutral-up-probability": {
        "exact": risk_neutral_up_probability_exact,
        "brute": risk_neutral_up_probability_brute,
    },
    "stochastic/reflection-principle-touch-level": {
        "exact": reflection_principle_touch_level_exact,
        "brute": reflection_principle_touch_level_brute,
    },
    "stochastic/exponential-martingale-value": {
        "exact": exponential_martingale_value_exact,
        "brute": exponential_martingale_value_brute,
    },
    "stochastic/gbm-expected-price": {
        "exact": gbm_expected_price_exact,
        "simulate": gbm_expected_price_sim,
    },
    "stochastic/brownian-covariance-correlation": {
        "exact": brownian_covariance_correlation_exact,
        "simulate": brownian_covariance_correlation_sim,
    },
    "stochastic/compound-sum-variance": {
        "exact": compound_sum_variance_exact,
        "brute": compound_sum_variance_brute,
    },
    "stochastic/gbm-probability-above-strike": {
        "exact": gbm_probability_above_strike_exact,
        "simulate": gbm_probability_above_strike_sim,
    },
    "stochastic/gbm-fit-then-below-mean": {
        "exact": gbm_fit_then_below_mean_exact,
        "brute": gbm_fit_then_below_mean_brute,
    },
}
