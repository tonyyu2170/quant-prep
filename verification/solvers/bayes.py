"""Independent Python counterparts for content/problems/bayes/*.
exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).
simulate()/brute(): checks the answer WITHOUT the closed form — raw simulation
or sample-space enumeration only."""
import numpy as np
from fractions import Fraction


def base_rate_exact(p):
    fpr = 1 - p["spec"]
    healthy = 1 - p["prev"]
    tp = p["prev"] * p["sens"]
    fp = healthy * fpr
    pos = tp + fp
    return {"fpr": fpr, "healthy": healthy, "tp": tp, "fp": fp, "pos": pos, "posterior": tp / pos}


def base_rate_sim(p, rng, trials=20_000_000, chunk=4_000_000):
    pos = hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        diseased = rng.random(n) < p["prev"]
        r = rng.random(n)
        positive = np.where(diseased, r < p["sens"], r < (1 - p["spec"]))
        pos += int(positive.sum())
        hits += int((positive & diseased).sum())
        done += n
    est = hits / pos
    se = (est * (1 - est) / pos) ** 0.5
    return est, se


def two_urns_exact(p):
    a_total = p["aRed"] + p["aBlue"]
    b_total = p["bRed"] + p["bBlue"]
    p_red_a = p["aRed"] / a_total
    p_red_b = p["bRed"] / b_total
    p_red = 0.5 * p_red_a + 0.5 * p_red_b
    return {"aTotal": a_total, "bTotal": b_total, "pRedA": p_red_a, "pRedB": p_red_b,
            "pRed": p_red, "postA": (0.5 * p_red_a) / p_red}


def two_urns_brute(p):
    # Enumerate the atomic sample space (urn, ball) — no Bayes formula anywhere.
    red_mass = Fraction(0)
    red_and_a = Fraction(0)
    for urn, red, blue in (("A", p["aRed"], p["aBlue"]), ("B", p["bRed"], p["bBlue"])):
        total = int(red) + int(blue)
        for ball in range(total):
            w = Fraction(1, 2) * Fraction(1, total)
            if ball < red:
                red_mass += w
                if urn == "A":
                    red_and_a += w
    return float(red_and_a / red_mass)


SOLVERS = {
    "bayes/base-rate-test": {"exact": base_rate_exact, "simulate": base_rate_sim},
    "bayes/two-urns": {"exact": two_urns_exact, "brute": two_urns_brute},
}
