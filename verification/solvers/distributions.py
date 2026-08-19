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


SOLVERS = {
    "distributions/binomial-exact-count": {"exact": binomial_exact_count_exact, "brute": binomial_exact_count_brute},
}
