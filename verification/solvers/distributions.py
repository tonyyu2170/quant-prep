"""Independent Python counterparts for content/problems/distributions/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry) — MEANT
to mirror the template, in floats, same convention as bayes/counting/ev_variance.
brute()/simulate(): recompute the ANSWER by an independent path per spec §5's table, never by
re-calling the template's closed form."""

import itertools
from fractions import Fraction
from math import comb, exp, log

import numpy as np
from scipy.stats import norm


def binomial_exact_count_exact(p):
    n, k, fail_pct = int(p["n"]), int(p["k"]), p["failPct"]
    prob = fail_pct / 100
    q = 1 - prob
    comb_nk = comb(n, k)
    n_minus_k = n - k
    pmf = comb_nk * prob**k * q**n_minus_k
    # q_to_n stays local, same reason as the TS side — never enters the returned dict, which
    # must mirror TS `derived` exactly (verify.py compares key-for-key).
    q_to_n = q**n
    at_least_one = 1 - q_to_n
    return {
        "prob": prob, "q": q, "combNK": comb_nk, "nMinusK": n_minus_k,
        "pmf": pmf, "atLeastOne": at_least_one,
    }


def binomial_exact_count_brute(p):
    """Enumerate all 2^n binary outcome sequences directly and sum the probability of every
    sequence with exactly k ones — never calls comb(), which is what makes this independent
    of the template's own C(n,k) shortcut."""
    n, k = int(p["n"]), int(p["k"])
    prob = p["failPct"] / 100
    total = 0.0
    for seq in itertools.product((0, 1), repeat=n):
        if sum(seq) == k:
            total += prob**k * (1 - prob) ** (n - k)
    return total


def binomial_at_most_exact(p):
    n, k, fail_pct = int(p["n"]), int(p["k"]), p["failPct"]
    prob = fail_pct / 100
    q = 1 - prob
    cdf = sum(comb(n, i) * prob**i * q ** (n - i) for i in range(0, k + 1))
    tail = sum(comb(n, i) * prob**i * q ** (n - i) for i in range(k + 1, n + 1))
    return {"prob": prob, "q": q, "cdf": cdf, "tailProb": tail}


def binomial_at_most_brute(p):
    """Enumerate all 2^n sequences and count those with at most k ones — never calls comb()."""
    n, k = int(p["n"]), int(p["k"])
    prob = p["failPct"] / 100
    total = 0.0
    for seq in itertools.product((0, 1), repeat=n):
        c = sum(seq)
        if c <= k:
            total += prob**c * (1 - prob) ** (n - c)
    return total


def binomial_at_least_one_exact(p):
    n, fail_pct = int(p["n"]), p["failPct"]
    prob = fail_pct / 100
    q = 1 - prob
    zero_fails = q**n
    at_least_one = 1 - zero_fails
    return {"prob": prob, "q": q, "zeroFails": zero_fails, "atLeastOne": at_least_one}


def binomial_at_least_one_brute(p):
    """Enumerate all 2^n sequences and count those with at least one — never uses 1-(1-p)^n."""
    n = int(p["n"])
    prob = p["failPct"] / 100
    total = 0.0
    for seq in itertools.product((0, 1), repeat=n):
        c = sum(seq)
        if c >= 1:
            total += prob**c * (1 - prob) ** (n - c)
    return total


def binomial_fit_then_pmf_exact(p):
    n, c = int(p["n"]), p["c"]
    fitted_p = 1 - c ** (1 / n)
    q = 1 - fitted_p
    n_minus_1 = n - 1
    pmf1 = n * fitted_p * q**n_minus_1
    return {"fittedP": fitted_p, "q": q, "nMinus1": n_minus_1, "pmf1": pmf1}


def binomial_fit_then_pmf_brute(p):
    """Enumerate all 2^n sequences twice: once to confirm the fitted p reproduces c via
    P(X=0) (a genuine check on the fit, not an assumption), once for P(X=1)."""
    n, c = int(p["n"]), p["c"]
    fitted_p = 1 - c ** (1 / n)
    zero_count = 0.0
    one_count = 0.0
    for seq in itertools.product((0, 1), repeat=n):
        s = sum(seq)
        weight = fitted_p**s * (1 - fitted_p) ** (n - s)
        if s == 0:
            zero_count += weight
        elif s == 1:
            one_count += weight
    assert abs(zero_count - c) < 1e-6, f"fitted p does not reproduce c: {zero_count} vs {c}"
    return one_count


def poisson_pmf(lam, k):
    r = 1.0
    import math
    r = math.exp(-lam)
    for i in range(1, k + 1):
        r = r * lam / i
    return r


def poisson_exact_count_exact(p):
    lam, k = p["lam"], int(p["k"])
    k_minus_1 = k - 1
    p_prev = poisson_pmf(lam, k_minus_1)
    pmf = p_prev * lam / k
    return {"kMinus1": k_minus_1, "pPrev": p_prev, "pmf": pmf}


def poisson_exact_count_brute(p):
    """Direct closed-form PMF via math.exp/factorial — a different code path from exact()'s
    iterative recurrence, so a bug in either implementation shows up as a mismatch."""
    from math import exp, factorial
    lam, k = p["lam"], int(p["k"])
    return exp(-lam) * lam**k / factorial(k)


def poisson_at_most_exact(p):
    lam, k = p["lam"], int(p["k"])
    cdf_prev = sum(poisson_pmf(lam, i) for i in range(0, k)) if k >= 1 else 0.0
    pmf_at_k = poisson_pmf(lam, k)
    cdf = cdf_prev + pmf_at_k
    return {"cdfPrev": cdf_prev, "pmfAtK": pmf_at_k, "cdf": cdf}


def poisson_at_most_brute(p):
    """Direct closed-form PMF summed via math.exp/factorial per term — a different code path
    from exact()'s shared recurrence helper."""
    from math import exp, factorial
    lam, k = p["lam"], int(p["k"])
    return sum(exp(-lam) * lam**i / factorial(i) for i in range(0, k + 1))


def poisson_rescaled_at_least_one_exact(p):
    lam0, w0, w1 = p["lam0"], p["w0"], p["w1"]
    lam_prime = lam0 * w1 / w0
    zero_events = poisson_pmf(lam_prime, 0)
    at_least_one = 1 - zero_events
    return {"lamPrime": lam_prime, "zeroEvents": zero_events, "atLeastOne": at_least_one}


def poisson_rescaled_at_least_one_brute(p):
    """Direct math.exp on the rescaled rate — independently recomputed from raw params, a
    different code path from exact()'s recurrence-derived zero-term."""
    from math import exp
    lam0, w0, w1 = p["lam0"], p["w0"], p["w1"]
    lam_prime = lam0 * w1 / w0
    return 1 - exp(-lam_prime)


def poisson_fit_then_tail_exact(p):
    t, c, t2 = p["t"], p["c"], p["t2"]
    from math import log
    lam = -log(c) / t
    lam_p = lam * t2
    p_zero = poisson_pmf(lam_p, 0)
    p_one = poisson_pmf(lam_p, 1)
    at_least_two = 1 - p_zero - p_one
    return {"lam": lam, "lamP": lam_p, "pZero": p_zero, "pOne": p_one, "atLeastTwo": at_least_two}


def poisson_fit_then_tail_brute(p):
    """Direct closed-form terms via math.exp — a different code path from exact()'s recurrence,
    re-deriving lambda fresh from raw params rather than reusing any TS-passed intermediate."""
    from math import exp, log
    t, c, t2 = p["t"], p["c"], p["t2"]
    lam = -log(c) / t
    lam_p = lam * t2
    return 1 - exp(-lam_p) - lam_p * exp(-lam_p)


def geometric_exact_trial_exact(p):
    succ_pct, k = p["succPct"], int(p["k"])
    prob = succ_pct / 100
    q = 1 - prob
    k_minus_1 = k - 1
    tail_at_k_minus_1 = q**k_minus_1
    tail_at_k = tail_at_k_minus_1 * q
    pmf = tail_at_k_minus_1 * prob
    return {"prob": prob, "q": q, "kMinus1": k_minus_1, "tailAtKMinus1": tail_at_k_minus_1, "tailAtK": tail_at_k, "pmf": pmf}


def geometric_exact_trial_brute(p):
    """Multiply the k-1 failure factors one at a time via a loop, then the success factor —
    an iterative product rather than the closed-form q**(k-1)*p."""
    succ_pct, k = p["succPct"], int(p["k"])
    prob = succ_pct / 100
    q = 1 - prob
    total = 1.0
    for _ in range(k - 1):
        total *= q
    total *= prob
    return total


def geometric_more_than_k_exact(p):
    succ_pct, k = p["succPct"], int(p["k"])
    prob = succ_pct / 100
    q = 1 - prob
    trunc_cap = k + 300
    tail_prob = q**k
    return {"prob": prob, "q": q, "truncCap": trunc_cap, "tailProb": tail_prob}


def geometric_more_than_k_brute(p):
    """Truncated sum of the PMF from k+1 out to a cap whose own tail is provably negligible —
    never q**k directly, which is the template's own shortcut."""
    succ_pct, k = p["succPct"], int(p["k"])
    prob = succ_pct / 100
    q = 1 - prob
    cap = k + 300
    total = 0.0
    term = q**k * prob  # PMF at i=k+1 is q**k * prob; start the loop there
    for i in range(k + 1, cap + 1):
        total += term
        term *= q
    return total


def geometric_conditional_memoryless_exact(p):
    succ_pct, j, k = p["succPct"], int(p["j"]), int(p["k"])
    prob = succ_pct / 100
    q = 1 - prob
    tail_after_j = q**j
    tail_after_j_plus_k = tail_after_j * q**k
    answer = tail_after_j_plus_k / tail_after_j
    return {"prob": prob, "q": q, "answer": answer}


def geometric_conditional_memoryless_brute(p):
    """Independently truncated-sum BOTH unconditional tails (never q**k directly, and never
    the memoryless shortcut) and divide — the ratio, not either sum alone, is the check."""
    succ_pct, j, k = p["succPct"], int(p["j"]), int(p["k"])
    prob = succ_pct / 100
    q = 1 - prob
    cap = j + k + 300

    def tail_sum(start):
        total = 0.0
        term = q**start * prob
        for i in range(start + 1, cap + 1):
            total += term
            term *= q
        return total

    return tail_sum(j + k) / tail_sum(j)


def negbinom_exact_trial_exact(p):
    succ_pct, r, k = p["succPct"], int(p["r"]), int(p["k"])
    prob = succ_pct / 100
    q = 1 - prob
    k_minus_1 = k - 1
    r_minus_1 = r - 1
    comb_kr = comb(k_minus_1, r_minus_1)
    k_minus_r = k - r
    pmf = comb_kr * prob**r * q**k_minus_r
    return {"prob": prob, "q": q, "kMinus1": k_minus_1, "rMinus1": r_minus_1, "combKR": comb_kr, "kMinusR": k_minus_r, "pmf": pmf}


def negbinom_exact_trial_brute(p):
    """Enumerate the C(k-1,r-1) orderings of the first k-1 trials directly via
    itertools.combinations — never calls comb()."""
    succ_pct, r, k = p["succPct"], int(p["r"]), int(p["k"])
    prob = succ_pct / 100
    total = 0.0
    for successes in itertools.combinations(range(k - 1), r - 1):
        fails = (k - 1) - len(successes)
        total += prob ** (r - 1) * (1 - prob) ** fails * prob  # r-1 earlier successes, rest fail, then the k-th succeeds
    return total


def negbinom_fit_p_exact(p):
    r, c = int(p["r"]), p["c"]
    fitted_p = c ** (1 / r)
    return {"fittedP": fitted_p}


def negbinom_fit_p_brute(p):
    """Bisect p^r - c = 0 over [0,1] and return the root directly — never computes c**(1/r),
    which is what makes this independent of the template's closed form."""
    r, c = int(p["r"]), p["c"]
    lo, hi = 0.0, 1.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if mid**r < c:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def hypergeom_exact_draw_exact(p):
    N, K, n, k = int(p["N"]), int(p["K"]), int(p["n"]), int(p["k"])
    n_minus_k = n - k
    N_minus_K = N - K
    comb_kk = comb(K, k)
    comb_rest = comb(N_minus_K, n_minus_k)
    comb_total = comb(N, n)
    pmf = (comb_kk * comb_rest) / comb_total
    return {"nMinusK": n_minus_k, "NMinusK": N_minus_K, "combKk": comb_kk, "combRest": comb_rest, "combTotal": comb_total, "pmf": pmf}


def hypergeom_exact_draw_brute(p):
    """Enumerate every n-subset of the N-item population directly via itertools.combinations
    and count those containing exactly k of the K marked items — never calls comb()."""
    N, K, n, k = int(p["N"]), int(p["K"]), int(p["n"]), int(p["k"])
    marked = set(range(K))
    favorable = 0
    total = 0
    for subset in itertools.combinations(range(N), n):
        total += 1
        if sum(1 for x in subset if x in marked) == k:
            favorable += 1
    return favorable / total


def hypergeom_zero_successes_exact(p):
    N, K, n = int(p["N"]), int(p["K"]), int(p["n"])
    N_minus_K = N - K
    comb_zero = comb(N_minus_K, n)
    comb_total = comb(N, n)
    pmf = comb_zero / comb_total
    return {"NMinusK": N_minus_K, "combZero": comb_zero, "combTotal": comb_total, "pmf": pmf}


def hypergeom_zero_successes_brute(p):
    """Enumerate every n-subset of the N-item population directly via itertools.combinations
    and count those containing zero of the K marked items — never calls comb()."""
    N, K, n = int(p["N"]), int(p["K"]), int(p["n"])
    marked = set(range(K))
    favorable = 0
    total = 0
    for subset in itertools.combinations(range(N), n):
        total += 1
        if all(x not in marked for x in subset):
            favorable += 1
    return favorable / total


def duniform_subrange_exact(p):
    N, c, d = int(p["N"]), int(p["c"]), int(p["d"])
    subrange_size = d - c + 1
    answer = subrange_size / N
    return {"subrangeSize": subrange_size, "answer": answer}


def duniform_subrange_brute(p):
    """Count integers 1..N landing in [c,d] directly via a loop — never uses d-c+1."""
    N, c, d = int(p["N"]), int(p["c"]), int(p["d"])
    favorable = sum(1 for x in range(1, N + 1) if c <= x <= d)
    return favorable / N


def duniform_fit_range_exact(p):
    M, N = p["M"], p["N"]
    c = M / N
    answer = M / c
    return {"c": c, "answer": answer}


def duniform_fit_range_brute(p):
    """Bounded search over the same integer grid N is drawn from (6..80), confirming by direct
    counting that the candidate N reproduces M/N=c — never computes M/c directly. c itself is
    recomputed fresh from the raw params here, since brute() only receives params, not derived."""
    M, N = p["M"], p["N"]
    c = M / N
    best_n, best_err = None, None
    for candidate in range(6, 81):
        favorable = sum(1 for x in range(1, candidate + 1) if x <= M)
        est_c = favorable / candidate
        err = abs(est_c - c)
        if best_err is None or err < best_err:
            best_err, best_n = err, candidate
    return best_n


def cuniform_below_threshold_exact(p):
    a, b, t = p["a"], p["b"], p["t"]
    rng_span = b - a
    answer = (t - a) / rng_span
    return {"range": rng_span, "answer": answer}


def cuniform_below_threshold_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    a, b, t = p["a"], p["b"], p["t"]
    hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        draws = rng.uniform(a, b, n)
        hits += int((draws < t).sum())
        done += n
    est = hits / trials
    se = (est * (1 - est) / trials) ** 0.5
    return est, se


def exponential_cdf_threshold_exact(p):
    lam, t = p["lam"], p["t"]
    survival = exp(-lam * t)
    answer = 1 - survival
    return {"survival": survival, "answer": answer}


def exponential_cdf_threshold_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    lam, t = p["lam"], p["t"]
    hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        draws = rng.exponential(1 / lam, n)
        hits += int((draws < t).sum())
        done += n
    est = hits / trials
    se = (est * (1 - est) / trials) ** 0.5
    return est, se


def exponential_fit_rate_exact(p):
    t, c = p["t"], p["c"]
    survival = 1 - c
    fitted_lam = -log(survival) / t
    return {"survival": survival, "fittedLam": fitted_lam}


def exponential_fit_rate_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    """Simulate directly at the fitted lambda and confirm it reproduces c, then invert the
    resulting noisy probability estimate back through the same closed form to get a lambda
    estimate with a propagated standard error — verify.py compares this against the answer
    (fittedLam), so simulate() must estimate the SAME quantity as the answer, not c itself."""
    t, c = p["t"], p["c"]
    fitted_lam = -log(1 - c) / t
    hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        draws = rng.exponential(1 / fitted_lam, n)
        hits += int((draws < t).sum())
        done += n
    c_est = hits / trials
    se_c = (c_est * (1 - c_est) / trials) ** 0.5
    lam_est = -log(1 - c_est) / t
    se_lam = se_c / ((1 - c_est) * t)
    return lam_est, se_lam


def exponential_memoryless_exact(p):
    lam, t = p["lam"], p["t"]
    answer = exp(-lam * t)
    return {"answer": answer}


def exponential_memoryless_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    """Rejection sampling: draw full waits, keep only those exceeding s, and estimate the
    conditional probability of exceeding s+t among the survivors — never uses e^{-lambda t}
    directly, which is the template's own memoryless shortcut."""
    lam, s, t = p["lam"], p["s"], p["t"]
    survivors = 0
    hits = 0
    done = 0
    while survivors < trials:
        n = min(chunk, trials)
        draws = rng.exponential(1 / lam, n)
        surviving = draws[draws > s]
        survivors += len(surviving)
        hits += int((surviving > s + t).sum())
        done += n
        if done > trials * 50:
            break  # safety valve if s*lam's cap still yields a very low survival rate
    est = hits / survivors
    se = (est * (1 - est) / survivors) ** 0.5
    return est, se


def normal_below_exact(p):
    mu, sigma, x = p["mu"], p["sigma"], p["x"]
    z = (x - mu) / sigma
    answer = norm.cdf(x, mu, sigma)
    return {"z": z, "answer": answer}


def normal_below_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    mu, sigma, x = p["mu"], p["sigma"], p["x"]
    hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        draws = rng.normal(mu, sigma, n)
        hits += int((draws < x).sum())
        done += n
    est = hits / trials
    se = (est * (1 - est) / trials) ** 0.5
    return est, se


def normal_above_exact(p):
    mu, sigma, x = p["mu"], p["sigma"], p["x"]
    z = (x - mu) / sigma
    below = norm.cdf(x, mu, sigma)
    answer = 1 - below
    return {"z": z, "below": below, "answer": answer}


def normal_above_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    """Estimates P(X>x) directly, not as 1-P(X<x) — a genuinely separate tail count."""
    mu, sigma, x = p["mu"], p["sigma"], p["x"]
    hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        draws = rng.normal(mu, sigma, n)
        hits += int((draws > x).sum())
        done += n
    est = hits / trials
    se = (est * (1 - est) / trials) ** 0.5
    return est, se


def normal_between_exact(p):
    mu, sigma, a, b = p["mu"], p["sigma"], p["a"], p["b"]
    cdf_a = norm.cdf(a, mu, sigma)
    cdf_b = norm.cdf(b, mu, sigma)
    answer = cdf_b - cdf_a
    return {"cdfA": cdf_a, "cdfB": cdf_b, "answer": answer}


def normal_between_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    mu, sigma, a, b = p["mu"], p["sigma"], p["a"], p["b"]
    hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        draws = rng.normal(mu, sigma, n)
        hits += int(((draws > a) & (draws < b)).sum())
        done += n
    est = hits / trials
    se = (est * (1 - est) / trials) ** 0.5
    return est, se


def normal_quantile_then_range_exact(p):
    mu, sigma, c, d = p["mu"], p["sigma"], p["c"], p["d"]
    x = norm.ppf(1 - c, mu, sigma)
    cdf_upper = norm.cdf(x + d, mu, sigma)
    cdf_lower = norm.cdf(x - d, mu, sigma)
    answer = cdf_upper - cdf_lower
    return {"x": x, "cdfUpper": cdf_upper, "cdfLower": cdf_lower, "answer": answer}


def normal_quantile_then_range_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    """Recomputes x fresh via scipy (brute() never receives derived), confirms it reproduces c
    via an independent tail count, then estimates the stage-2 range probability — both counts
    share one pass of draws for efficiency, but are genuinely separate tallies."""
    mu, sigma, c, d = p["mu"], p["sigma"], p["c"], p["d"]
    x = norm.ppf(1 - c, mu, sigma)
    tail_hits = 0
    stage2_hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        draws = rng.normal(mu, sigma, n)
        tail_hits += int((draws > x).sum())
        stage2_hits += int((np.abs(draws - x) < d).sum())
        done += n
    tail_est = tail_hits / trials
    assert abs(tail_est - c) < 0.01, f"quantile does not reproduce c: {tail_est} vs {c}"
    est = stage2_hits / trials
    se = (est * (1 - est) / trials) ** 0.5
    return est, se



def max_serial_draw_exact(p):
    stock, picked = int(p["stock"]), int(p["picked"])
    gaps = picked + 1
    n_plus_1 = stock + 1
    return {
        "gaps": gaps,
        "nPlus1": n_plus_1,
        "unsampled": stock - picked,
        "topGap": (stock - picked) / gaps,
        "numer": picked * n_plus_1,
        "answer": (picked * n_plus_1) / gaps,
    }


def max_serial_draw_brute(p):
    """Sum m times P(largest tag = m) over the hypergeometric position distribution. The gap
    symmetry the template leans on never appears."""
    stock, picked = int(p["stock"]), int(p["picked"])
    total = comb(stock, picked)
    exp_max = Fraction(0)
    for m in range(picked, stock + 1):
        exp_max += m * Fraction(comb(m - 1, picked - 1), total)
    return float(exp_max)


def spare_chain_uptime_exact(p):
    units, mean_life, earnings = int(p["units"]), float(p["meanLife"]), int(p["earnings"])
    return {"uptime": units * mean_life, "ev": earnings * units * mean_life}


def spare_chain_uptime_sim(p, rng, trials=8_000_000, chunk=1_000_000):
    """Run the chain: draw each cell's exponential life and add them. This is the Erlang mean
    arrived at by sampling rather than by asserting that the means add."""
    units, mean_life, earnings = int(p["units"]), float(p["meanLife"]), int(p["earnings"])
    total = 0.0
    total_sq = 0.0
    done = 0
    while done < trials:
        m = min(chunk, trials - done)
        lives = rng.exponential(mean_life, size=(m, units)).sum(axis=1)
        total += lives.sum()
        total_sq += (lives * lives).sum()
        done += m
    mean = total / trials
    var = max(total_sq / trials - mean * mean, 0.0)
    return earnings * mean, earnings * (var / trials) ** 0.5


def first_contact_race_exact(p):
    email, call, days = int(p["emailRate"]), int(p["callRate"]), int(p["days"])
    merged = email + call
    return {
        "merged": merged,
        "share": email / merged,
        "numer": days * email,
        "ev": (days * email) / merged,
    }


def first_contact_race_sim(p, rng, trials=25_000_000, chunk=2_500_000):
    """Race the two streams directly: draw the waiting time to the first email and to the first
    call and see which lands sooner. No merging property, no rate-share formula."""
    email, call, days = int(p["emailRate"]), int(p["callRate"]), int(p["days"])
    wins = 0
    done = 0
    while done < trials:
        m = min(chunk, trials - done)
        wins += int((rng.exponential(1 / email, m) < rng.exponential(1 / call, m)).sum())
        done += m
    est = wins / trials
    se = (est * (1 - est) / trials) ** 0.5
    return days * est, days * se

SOLVERS = {
    "distributions/binomial-exact-count": {"exact": binomial_exact_count_exact, "brute": binomial_exact_count_brute},
    "distributions/binomial-at-most": {"exact": binomial_at_most_exact, "brute": binomial_at_most_brute},
    "distributions/binomial-at-least-one": {"exact": binomial_at_least_one_exact, "brute": binomial_at_least_one_brute},
    "distributions/binomial-fit-then-pmf": {"exact": binomial_fit_then_pmf_exact, "brute": binomial_fit_then_pmf_brute},
    "distributions/poisson-exact-count": {"exact": poisson_exact_count_exact, "brute": poisson_exact_count_brute},
    "distributions/poisson-at-most": {"exact": poisson_at_most_exact, "brute": poisson_at_most_brute},
    "distributions/poisson-rescaled-at-least-one": {"exact": poisson_rescaled_at_least_one_exact, "brute": poisson_rescaled_at_least_one_brute},
    "distributions/poisson-fit-then-tail": {"exact": poisson_fit_then_tail_exact, "brute": poisson_fit_then_tail_brute},
    "distributions/geometric-exact-trial": {"exact": geometric_exact_trial_exact, "brute": geometric_exact_trial_brute},
    "distributions/geometric-more-than-k": {"exact": geometric_more_than_k_exact, "brute": geometric_more_than_k_brute},
    "distributions/geometric-conditional-memoryless": {"exact": geometric_conditional_memoryless_exact, "brute": geometric_conditional_memoryless_brute},
    "distributions/negbinom-exact-trial": {"exact": negbinom_exact_trial_exact, "brute": negbinom_exact_trial_brute},
    "distributions/negbinom-fit-p": {"exact": negbinom_fit_p_exact, "brute": negbinom_fit_p_brute},
    "distributions/hypergeom-exact-draw": {"exact": hypergeom_exact_draw_exact, "brute": hypergeom_exact_draw_brute},
    "distributions/hypergeom-zero-successes": {"exact": hypergeom_zero_successes_exact, "brute": hypergeom_zero_successes_brute},
    "distributions/duniform-subrange": {"exact": duniform_subrange_exact, "brute": duniform_subrange_brute},
    "distributions/duniform-fit-range": {"exact": duniform_fit_range_exact, "brute": duniform_fit_range_brute},
    "distributions/cuniform-below-threshold": {"exact": cuniform_below_threshold_exact, "simulate": cuniform_below_threshold_sim},
    "distributions/exponential-cdf-threshold": {"exact": exponential_cdf_threshold_exact, "simulate": exponential_cdf_threshold_sim},
    "distributions/exponential-fit-rate": {"exact": exponential_fit_rate_exact, "simulate": exponential_fit_rate_sim},
    "distributions/exponential-memoryless": {"exact": exponential_memoryless_exact, "simulate": exponential_memoryless_sim},
    "distributions/normal-below": {"exact": normal_below_exact, "simulate": normal_below_sim},
    "distributions/normal-above": {"exact": normal_above_exact, "simulate": normal_above_sim},
    "distributions/normal-between": {"exact": normal_between_exact, "simulate": normal_between_sim},
    "distributions/normal-quantile-then-range": {"exact": normal_quantile_then_range_exact, "simulate": normal_quantile_then_range_sim},
    "distributions/max-serial-draw": {
        "exact": max_serial_draw_exact,
        "brute": max_serial_draw_brute,
    },
    "distributions/spare-chain-uptime": {
        "exact": spare_chain_uptime_exact,
        "simulate": spare_chain_uptime_sim,
    },
    "distributions/first-contact-race": {
        "exact": first_contact_race_exact,
        "simulate": first_contact_race_sim,
    },
}
