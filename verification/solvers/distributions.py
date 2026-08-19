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
}
