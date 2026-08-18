"""Independent Python counterparts for content/problems/counting/*.
exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).
brute(): recomputes the ANSWER by a path derivationally independent of the
template's closed form — enumeration, DP, or a recurrence. Never re-call the
same formula the template used; that is transcription, not verification."""


def committee_selection_exact(p):
    n, k = int(p["n"]), int(p["k"])
    ordered = 1
    for i in range(k):
        ordered *= n - i
    k_fact = 1
    for i in range(2, k + 1):
        k_fact *= i
    return {
        "ordered": ordered,
        "kFact": k_fact,
        "ways": ordered // k_fact,
        "complement": n - k,
        "nMinus1": n - 1,
        "lastFactor": n - k + 1,
    }


def committee_selection_brute(p):
    """Pascal's recurrence, bottom-up. Purely additive: no factorials, no
    multiplicative binomial, no math.comb — independent of the TS derivation."""
    n, k = int(p["n"]), int(p["k"])
    row = [1]
    for _ in range(n):
        row = [1] + [row[i] + row[i + 1] for i in range(len(row) - 1)] + [1]
    return row[k]


SOLVERS = {
    "counting/committee-selection": {
        "exact": committee_selection_exact,
        "brute": committee_selection_brute,
    },
}
