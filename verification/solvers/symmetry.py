"""Independent Python counterparts for content/problems/symmetry/*.
exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).
It is MEANT to mirror the template's derivation — that mirroring is the check.
brute(): recomputes the ANSWER without the symmetry argument the template leans
on — a DP over counts, an exhaustive walk over orderings, or a conditional
recursion. These problems are exactly the ones where a slick argument is easy to
get subtly wrong, so the counterpart deliberately takes the plodding route.
simulate(): only for standing-table-legs, which verify.py declares montecarlo."""

import itertools
from fractions import Fraction
from functools import lru_cache

import numpy as np


def _fact(m):
    f = 1
    for i in range(2, m + 1):
        f *= i
    return f


def _choose(m, j):
    if j < 0 or j > m:
        return 0
    return _fact(m) // (_fact(j) * _fact(m - j))


def all_wins_before_loss_exact(p):
    good, bad, rounds = int(p["good"]), int(p["bad"]), int(p["rounds"])
    total = good + bad
    ways = 1.0
    for i in range(good):
        ways = ways * (total - i) / (i + 1)
    ways = round(ways)
    return {"total": total, "ways": ways, "prob": 1 / ways, "answer": rounds / ways}


def all_wins_before_loss_brute(p):
    """Condition on the next spin that changes anything: with u WIN faces still
    unseen and b LOSS faces live, it is a fresh WIN with probability u/(u+b) and
    a LOSS otherwise. Recurse on u — no binomial coefficient anywhere."""
    good, bad = int(p["good"]), int(p["bad"])
    prob = Fraction(1)
    for u in range(1, good + 1):
        prob *= Fraction(u, u + bad)
    return float(int(p["rounds"]) * prob)


def ballot_always_ahead_exact(p):
    a, b = int(p["votesA"]), int(p["votesB"])
    total = a + b
    margin = a - b
    return {
        "total": total,
        "margin": margin,
        "answer": margin / total,
        "tieAtSomePoint": 1 - margin / total,
        "finalShare": a / total,
    }


def ballot_always_ahead_brute(p):
    """Count the good orderings with a lattice DP instead of quoting Bertrand's
    ballot theorem: ways[i][j] is the number of counts of i A-ballots and j
    B-ballots whose every non-empty prefix is strictly A-ahead."""
    a, b = int(p["votesA"]), int(p["votesB"])
    ways = [[0] * (b + 1) for _ in range(a + 1)]
    ways[0][0] = 1
    for i in range(a + 1):
        for j in range(b + 1):
            if i + j == 0 or i <= j:
                continue
            ways[i][j] = (ways[i - 1][j] if i > 0 else 0) + (ways[i][j - 1] if j > 0 else 0)
    return float(Fraction(ways[a][b], _choose(a + b, a)))


def beat_every_rival_exact(p):
    rivals, rounds = int(p["rivals"]), int(p["rounds"])
    field = rivals + 1
    return {
        "field": field,
        "prob": 1 / field,
        "answer": rounds / field,
        "rivalWins": (rounds * rivals) / field,
    }


def beat_every_rival_brute(p):
    """Walk every ordering of the field and count the ones you lead. Ties never
    occur, so the response times are equivalent to a uniform random permutation."""
    field = int(p["rivals"]) + 1
    orders = list(itertools.permutations(range(field)))
    wins = sum(1 for o in orders if o[0] == 0)
    return float(int(p["rounds"]) * Fraction(wins, len(orders)))


def first_ace_position_exact(p):
    cards, aces = int(p["cards"]), int(p["aces"])
    gaps = aces + 1
    others = cards - aces
    return {
        "gaps": gaps,
        "others": others,
        "answer": (cards + 1) / gaps,
        "gapSize": (cards - aces) / gaps,
        "lastAce": (aces * (cards + 1)) / gaps,
    }


def first_ace_position_brute(p):
    """Sum k x P(first ace at k) over the hypergeometric position distribution,
    rather than invoking the equal-gaps symmetry the template uses."""
    n, a = int(p["cards"]), int(p["aces"])
    total = _choose(n, a)
    exp = Fraction(0)
    for k in range(1, n - a + 2):
        exp += k * Fraction(_choose(n - k, a - 1), total)
    return float(exp)


def friends_together_round_table_exact(p):
    seats, friends, parties = int(p["seats"]), int(p["friends"]), int(p["parties"])
    block_ways = 1
    for i in range(2, friends + 1):
        block_ways *= i
    falling = 1
    for i in range(1, friends):
        falling *= seats - i
    return {
        "blockWays": block_ways,
        "falling": falling,
        "prob": block_ways / falling,
        "answer": (parties * block_ways) / falling,
        "gaps": seats - friends,
        "others": seats - 1,
    }


def friends_together_round_table_brute(p):
    """Look at which SEATS the friends occupy, not at circular arrangements: the
    seat set is a uniform subset, and exactly `seats` of the subsets are the
    rotations of one contiguous block."""
    seats, friends = int(p["seats"]), int(p["friends"])
    contiguous = seats  # one block per starting seat, all distinct while friends < seats
    return float(int(p["parties"]) * Fraction(contiguous, _choose(seats, friends)))


def last_ball_colour_exact(p):
    red, blue, trials = int(p["red"]), int(p["blue"]), int(p["trials"])
    total = red + blue
    return {
        "total": total,
        "share": red / total,
        "answer": (trials * red) / total,
        "blueEnds": (trials * blue) / total,
    }


def last_ball_colour_brute(p):
    """Draw the urn down one ball at a time and recurse on the state, instead of
    asserting that the last ball is exchangeable with the first."""

    @lru_cache(maxsize=None)
    def last_is_red(r, b):
        if r == 0:
            return Fraction(0)
        if b == 0:
            return Fraction(1)
        n = r + b
        return Fraction(r, n) * last_is_red(r - 1, b) + Fraction(b, n) * last_is_red(r, b - 1)

    return float(int(p["trials"]) * last_is_red(int(p["red"]), int(p["blue"])))


def relative_order_of_picks_exact(p):
    picked, rounds = int(p["picked"]), int(p["rounds"])
    orders = 1
    for i in range(2, picked + 1):
        orders *= i
    return {
        "orders": orders,
        "prob": 1 / orders,
        "answer": rounds / orders,
        "wrongOrders": orders - 1,
        "watchedPlusOne": picked + 1,
    }


def relative_order_of_picks_brute(p):
    """Enumerate the relative orders of the watched desks and count the hits."""
    picked = int(p["picked"])
    orders = list(itertools.permutations(range(picked)))
    hits = sum(1 for o in orders if list(o) == sorted(o))
    return float(int(p["rounds"]) * Fraction(hits, len(orders)))


def standing_table_legs_exact(p):
    legs, tables = int(p["legs"]), int(p["tables"])
    half = 1
    for _ in range(1, legs):
        half *= 2
    stands = (half - legs) / half
    return {
        "half": half,
        "stands": stands,
        "falls": legs / half,
        "answer": tables * stands,
        "perCase": 1 / half,
        "otherLegs": legs - 1,
    }


def standing_table_legs_sim(p, rng, trials=20_000_000, chunk=400_000):
    """The centre is outside the hull exactly when every leg fits in some
    half-plane through it, i.e. when the legs all sit inside one semicircle —
    which shows up as a gap of at least pi between neighbouring angles. Estimate
    P(stands) at a fixed trial count and scale by `tables`, so the noise-to-
    tolerance ratio does not move with the parameters. The binding case is the
    3-leg table, whose P(stands) of 1/4 is the noisiest relative to tolerance;
    the trial count is set from that and leaves ~4x margin."""
    legs, tables = int(p["legs"]), int(p["tables"])
    stands = 0
    done = 0
    while done < trials:
        m = min(chunk, trials - done)
        ang = np.sort(rng.uniform(0.0, 2 * np.pi, size=(m, legs)), axis=1)
        gaps = np.diff(ang, axis=1)
        wrap = 2 * np.pi - (ang[:, -1] - ang[:, 0])
        max_gap = np.maximum(gaps.max(axis=1), wrap)
        stands += int((max_gap < np.pi).sum())
        done += m
    est = stands / trials
    se = (est * (1 - est) / trials) ** 0.5
    return tables * est, tables * se



def decisive_face_wait_exact(p):
    sides, cost = int(p["sides"]), int(p["cost"])
    p_special = 2 / sides
    e_rolls = sides / 2
    return {
        "pSpecial": p_special,
        "eMisses": (sides - 2) / 2,
        "eRolls": e_rolls,
        "spend": cost * e_rolls,
    }


def decisive_face_wait_sim(p, rng, trials=20_000_000, chunk=2_000_000):
    """Play the wheel out and keep only the runs the question conditions on — those that ended
    on the high sector. Simulating the conditioning rather than assuming it is the whole point:
    the template's claim is that conditioning on WHICH sector ended the run says nothing about
    WHEN it ended, and an estimator that quietly drops the condition cannot test that."""
    sides, cost = int(p["sides"]), int(p["cost"])
    kept_total = 0.0
    kept_sq = 0.0
    kept_n = 0
    done = 0
    while done < trials:
        m = min(chunk, trials - done)
        spins = rng.geometric(2 / sides, size=m)          # spins up to and including the decisive one
        high_ended = rng.integers(0, 2, size=m) == 1      # which of the two marked sectors it was
        spend = (spins[high_ended] * cost).astype(np.float64)
        kept_total += spend.sum()
        kept_sq += (spend * spend).sum()
        kept_n += spend.size
        done += m
    mean = kept_total / kept_n
    var = max(kept_sq / kept_n - mean * mean, 0.0)
    return mean, (var / kept_n) ** 0.5


def ants_circle_directions_exact(p):
    ants, bounty, replays = int(p["ants"]), int(p["bounty"]), int(p["replays"])
    denom = 2 ** (ants - 1)
    return {
        "denom": denom,
        "assignments": 2 * denom,
        "prob": 1 / denom,
        "perReplay": bounty / denom,
        "payout": bounty * replays,
        "ev": (bounty * replays) / denom,
    }


def ants_circle_directions_brute(p):
    """Enumerate all 2^n direction assignments and test each one for a collision directly: on a
    closed loop a pair meets exactly when the two ants march opposite ways, so an assignment is
    clean only if no opposed pair exists. Counting the clean assignments this way never uses the
    1/2^(n-1) closed form the template prints."""
    ants, bounty, replays = int(p["ants"]), int(p["bounty"]), int(p["replays"])
    clean = 0
    for dirs in itertools.product((0, 1), repeat=ants):
        if not any(a != b for a, b in itertools.combinations(dirs, 2)):
            clean += 1
    return float(bounty * replays * Fraction(clean, 2 ** ants))

SOLVERS = {
    "symmetry/all-wins-before-loss": {
        "exact": all_wins_before_loss_exact,
        "brute": all_wins_before_loss_brute,
    },
    "symmetry/ballot-always-ahead": {
        "exact": ballot_always_ahead_exact,
        "brute": ballot_always_ahead_brute,
    },
    "symmetry/beat-every-rival": {
        "exact": beat_every_rival_exact,
        "brute": beat_every_rival_brute,
    },
    "symmetry/first-ace-position": {
        "exact": first_ace_position_exact,
        "brute": first_ace_position_brute,
    },
    "symmetry/friends-together-round-table": {
        "exact": friends_together_round_table_exact,
        "brute": friends_together_round_table_brute,
    },
    "symmetry/last-ball-colour": {
        "exact": last_ball_colour_exact,
        "brute": last_ball_colour_brute,
    },
    "symmetry/relative-order-of-picks": {
        "exact": relative_order_of_picks_exact,
        "brute": relative_order_of_picks_brute,
    },
    "symmetry/standing-table-legs": {
        "exact": standing_table_legs_exact,
        "simulate": standing_table_legs_sim,
    },
    "symmetry/decisive-face-wait": {
        "exact": decisive_face_wait_exact,
        "simulate": decisive_face_wait_sim,
    },
    "symmetry/ants-circle-directions": {
        "exact": ants_circle_directions_exact,
        "brute": ants_circle_directions_brute,
    },
}
