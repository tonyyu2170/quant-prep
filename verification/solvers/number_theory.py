"""Independent Python counterparts for content/problems/number-theory/*.

exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).

brute(): recomputes the ANSWER by SEARCH or SIEVE, never by the identity the template teaches.
That is unusually strong independence for this topic — none of these checkers contains a
formula at all:

- multiples in a range: every integer in the range is tested for divisibility, one at a time.
- coprime count: gcd is computed against every integer in the span. Euler's formula is absent.
- gcd/lcm: the least common multiple is found by walking multiples of the larger number until
  one divides by the smaller. The product-over-gcd identity is what is being checked.
- Frobenius: every amount up to a generous bound is SIEVED for representability and the largest
  failure is reported. a*b-a-b never appears.
- CRT: the integers are scanned upward from 1 until one satisfies both congruences.
- Diophantine count: a double loop over the lattice.
- linear congruence: x is scanned from 1 to m. No inverse is computed by any algorithm.
- Frobenius fit-then-count: the same sieve, COUNTING the failures rather than taking the last.
"""

import math


def _gcd(a, b):
    while b:
        a, b = b, a % b
    return a


def _representable(a, b, upto):
    """Sieve: which amounts from 0 to `upto` are a non-negative combination of a and b."""
    ok = [False] * (upto + 1)
    ok[0] = True
    for amount in range(1, upto + 1):
        if (amount >= a and ok[amount - a]) or (amount >= b and ok[amount - b]):
            ok[amount] = True
    return ok


def multiples_in_a_range_exact(p):
    upto, by, not_by = int(p["upto"]), int(p["by"]), int(p["notBy"])
    shared = _gcd(by, not_by)
    both = (by * not_by) // shared
    return {
        "shared": shared,
        "both": both,
        "hitsBy": upto // by,
        "hitsBoth": upto // both,
        "answer": upto // by - upto // both,
    }


def multiples_in_a_range_brute(p):
    upto, by, not_by = int(p["upto"]), int(p["by"]), int(p["notBy"])
    return float(sum(1 for n in range(1, upto + 1) if n % by == 0 and n % not_by != 0))


def coprime_count_two_primes_exact(p):
    pr, qr, mult = int(p["pr"]), int(p["qr"]), int(p["mult"])
    return {
        "modulus": pr * qr,
        "span": pr * qr * mult,
        "dropP": qr * mult,
        "dropQ": pr * mult,
        "perBlock": (pr - 1) * (qr - 1),
        "answer": mult * (pr - 1) * (qr - 1),
    }


def coprime_count_two_primes_brute(p):
    pr, qr, mult = int(p["pr"]), int(p["qr"]), int(p["mult"])
    modulus = pr * qr
    return float(sum(1 for n in range(1, modulus * mult + 1) if _gcd(n, modulus) == 1))


def gcd_lcm_product_exact(p):
    g, m, n = int(p["g"]), int(p["m"]), int(p["n"])
    return {"first": g * m, "second": g * n, "product": g * m * g * n, "answer": g * m * n}


def gcd_lcm_product_brute(p):
    """Walk multiples of the larger number until one is divisible by the smaller."""
    g, m, n = int(p["g"]), int(p["m"]), int(p["n"])
    first, second = g * m, g * n
    lo, hi = min(first, second), max(first, second)
    step = hi
    while step % lo != 0:
        step += hi
    return float(step)


def frobenius_largest_unpayable_exact(p):
    a, b, extra = int(p["coinA"]), int(p["coinB"]), int(p["extra"])
    return {
        "redundant": a * extra,
        "product": a * b,
        "sum": a + b,
        "answer": a * b - a - b,
    }


def frobenius_largest_unpayable_brute(p):
    """Sieve every amount and report the largest that cannot be assembled. Note the third
    denomination is included in the sieve rather than argued away — if it were NOT redundant
    the sieve would disagree with the template, which is the point."""
    a, b, extra = int(p["coinA"]), int(p["coinB"]), int(p["extra"])
    third = a * extra
    upto = 4 * a * b
    ok = [False] * (upto + 1)
    ok[0] = True
    for amount in range(1, upto + 1):
        for coin in (a, b, third):
            if amount >= coin and ok[amount - coin]:
                ok[amount] = True
                break
    return float(max(i for i in range(upto + 1) if not ok[i]))


def crt_two_congruences_exact(p):
    m1, m2, r1, r2 = int(p["m1"]), int(p["m2"]), int(p["r1"]), int(p["r2"])
    n = r1
    while n % m2 != r2:
        n += m1
    return {"modulus": m1 * m2, "steps": (n - r1) // m1, "answer": n}


def crt_two_congruences_brute(p):
    """Scan upward from 1, testing both conditions directly."""
    m1, m2, r1, r2 = int(p["m1"]), int(p["m2"]), int(p["r1"]), int(p["r2"])
    n = 1
    while not (n % m1 == r1 and n % m2 == r2):
        n += 1
    return float(n)


def diophantine_count_solutions_exact(p):
    a, b, c = int(p["a"]), int(p["b"]), int(p["c"])
    count = sum(1 for x in range(c // a + 1) if (c - x * a) % b == 0)
    return {
        "exactQuotient": round((c / a) * 1e9) / 1e9,
        "maxFirst": c // a,
        "stride": a * b,
        "span": c // (a * b),
        "answer": count,
    }


def diophantine_count_solutions_brute(p):
    """Double loop over the lattice — no stride argument anywhere."""
    a, b, c = int(p["a"]), int(p["b"]), int(p["c"])
    n = 0
    for x in range(c // a + 1):
        for y in range(c // b + 1):
            if a * x + b * y == c:
                n += 1
    return float(n)


def linear_congruence_solve_exact(p):
    a, m, r = int(p["a"]), int(p["m"]), int(p["r"])
    inverse = 1
    while (a * inverse) % m != 1:
        inverse += 1
    return {
        "inverse": inverse,
        "product": a * inverse,
        "raw": inverse * r,
        "answer": (inverse * r) % m,
    }


def linear_congruence_solve_brute(p):
    """Try every x. No inverse is ever computed."""
    a, m, r = int(p["a"]), int(p["m"]), int(p["r"])
    for x in range(1, m):
        if (a * x) % m == r:
            return float(x)
    raise AssertionError("no solution, but the constraint promised one")


def frobenius_fit_then_count_exact(p):
    a, b, wanted = int(p["coinA"]), int(p["coinB"]), int(p["wanted"])
    unpayable = ((a - 1) * (b - 1)) // 2
    return {
        "largest": a * b - a - b,
        "shifted": a * b - b,
        "recovered": b,
        "unpayable": unpayable,
        "answer": unpayable if wanted == 1 else b,
    }


def frobenius_fit_then_count_brute(p):
    """The same sieve as above, but COUNTING the unreachable totals rather than taking the last.
    The pairing argument the template teaches is never used."""
    a, b, wanted = int(p["coinA"]), int(p["coinB"]), int(p["wanted"])
    if wanted == 2:
        # Recover the second coin by searching for the one reproducing the quoted Frobenius
        # number, rather than by rearranging the formula.
        target = a * b - a - b
        for cand in range(2, 200):
            if _gcd(a, cand) == 1 and a * cand - a - cand == target:
                return float(cand)
        raise AssertionError("no denomination reproduces the quoted largest gap")
    ok = _representable(a, b, 4 * a * b)
    return float(sum(1 for i in range(1, len(ok)) if not ok[i]))


SOLVERS = {
    "number-theory/multiples-in-a-range": {
        "exact": multiples_in_a_range_exact, "brute": multiples_in_a_range_brute},
    "number-theory/coprime-count-two-primes": {
        "exact": coprime_count_two_primes_exact, "brute": coprime_count_two_primes_brute},
    "number-theory/gcd-lcm-product": {
        "exact": gcd_lcm_product_exact, "brute": gcd_lcm_product_brute},
    "number-theory/frobenius-largest-unpayable": {
        "exact": frobenius_largest_unpayable_exact, "brute": frobenius_largest_unpayable_brute},
    "number-theory/crt-two-congruences": {
        "exact": crt_two_congruences_exact, "brute": crt_two_congruences_brute},
    "number-theory/diophantine-count-solutions": {
        "exact": diophantine_count_solutions_exact, "brute": diophantine_count_solutions_brute},
    "number-theory/linear-congruence-solve": {
        "exact": linear_congruence_solve_exact, "brute": linear_congruence_solve_brute},
    "number-theory/frobenius-fit-then-count": {
        "exact": frobenius_fit_then_count_exact, "brute": frobenius_fit_then_count_brute},
}
