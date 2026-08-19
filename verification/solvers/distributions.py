"""Independent Python counterparts for content/problems/distributions/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry) — MEANT
to mirror the template, in floats, same convention as bayes/counting/ev_variance.
brute()/simulate(): recompute the ANSWER by an independent path per spec §5's table, never by
re-calling the template's closed form."""

import itertools
from math import comb


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


SOLVERS = {
    "distributions/binomial-exact-count": {"exact": binomial_exact_count_exact, "brute": binomial_exact_count_brute},
    "distributions/binomial-at-most": {"exact": binomial_at_most_exact, "brute": binomial_at_most_brute},
    "distributions/binomial-at-least-one": {"exact": binomial_at_least_one_exact, "brute": binomial_at_least_one_brute},
    "distributions/binomial-fit-then-pmf": {"exact": binomial_fit_then_pmf_exact, "brute": binomial_fit_then_pmf_brute},
    "distributions/poisson-exact-count": {"exact": poisson_exact_count_exact, "brute": poisson_exact_count_brute},
    "distributions/poisson-at-most": {"exact": poisson_at_most_exact, "brute": poisson_at_most_brute},
    "distributions/poisson-rescaled-at-least-one": {"exact": poisson_rescaled_at_least_one_exact, "brute": poisson_rescaled_at_least_one_brute},
    "distributions/poisson-fit-then-tail": {"exact": poisson_fit_then_tail_exact, "brute": poisson_fit_then_tail_brute},
}
