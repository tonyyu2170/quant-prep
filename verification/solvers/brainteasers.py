"""Independent Python counterparts for content/problems/brainteasers/*.
exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).
It is MEANT to mirror the template's derivation — that mirroring is the check.
brute(): recomputes the ANSWER by actually playing the problem out — toggling
every bulb, searching every bridge schedule, solving the pirate game backward,
multiplying the factorial in full. Every brainteaser here has a one-line closed
form that is easy to state and easy to get wrong by a factor or an off-by-one,
so the counterpart never touches that closed form.
simulate(): only for ants-pole-collisions, which verify.py declares montecarlo."""

import heapq
import math
from fractions import Fraction

import numpy as np


def ants_pole_collisions_exact(p):
    ants, trials = int(p["ants"]), int(p["trials"])
    pairs = (ants * (ants - 1)) / 2
    return {
        "pairs": pairs,
        "antsLess1": ants - 1,
        "perTrial": pairs / 4,
        "answer": (trials * ants * (ants - 1)) / 8,
    }


def ants_pole_collisions_sim(p, rng, trials=6_000_000, chunk=250_000):
    """Walk the ants under the pass-through equivalence and count meeting pairs
    directly: a pair meets when the left ant goes right and the right one goes
    left. Estimated per-trial at a fixed sample count and scaled by `trials`, so
    the noise-to-tolerance ratio does not move with the parameters. The binding
    case is 4 ants, fewest pairs and so the noisiest relative to tolerance; the
    trial count is set from that and leaves ~5x margin."""
    ants, rounds = int(p["ants"]), int(p["trials"])
    total = 0.0
    total_sq = 0.0
    done = 0
    while done < trials:
        m = min(chunk, trials - done)
        right = rng.integers(0, 2, size=(m, ants))
        # for each ant j, how many ants to its left are walking right
        lefties = np.cumsum(right, axis=1) - right
        hits = ((1 - right) * lefties).sum(axis=1).astype(np.float64)
        total += hits.sum()
        total_sq += (hits * hits).sum()
        done += m
    mean = total / trials
    var = max(total_sq / trials - mean * mean, 0.0)
    se = (var / trials) ** 0.5
    return rounds * mean, rounds * se


def bridge_crossing_time_exact(p):
    f, s, t, sl = int(p["fastest"]), int(p["second"]), int(p["third"]), int(p["slowest"])
    shuttle = 2 * f + s + t + sl
    pair_slow = f + 3 * s + sl
    return {
        "shuttle": shuttle,
        "pairSlow": pair_slow,
        "answer": min(shuttle, pair_slow),
        "saving": abs(shuttle - pair_slow),
    }


def bridge_crossing_time_brute(p):
    """Dijkstra over every reachable schedule — state is (who is still on the
    near side, which side the torch is on) — so the search considers all
    crossings, not just the two named strategies."""
    times = [int(p["fastest"]), int(p["second"]), int(p["third"]), int(p["slowest"])]
    n = len(times)
    start = ((1 << n) - 1, 0)  # everyone near, torch near
    goal = (0, 1)
    best = {start: 0}
    queue = [(0, start)]
    while queue:
        cost, state = heapq.heappop(queue)
        if state == goal:
            return float(cost)
        if cost > best.get(state, math.inf):
            continue
        near, torch = state
        side = near if torch == 0 else ((1 << n) - 1) ^ near
        movers = [i for i in range(n) if side & (1 << i)]
        groups = [(i,) for i in movers] + [
            (i, j) for a, i in enumerate(movers) for j in movers[a + 1:]
        ]
        for g in groups:
            step = max(times[i] for i in g)
            mask = 0
            for i in g:
                mask |= 1 << i
            nxt = (near ^ mask, 1 - torch)
            if cost + step < best.get(nxt, math.inf):
                best[nxt] = cost + step
                heapq.heappush(queue, (cost + step, nxt))
    raise AssertionError("bridge: goal unreachable")


def clock_hands_angle_exact(p):
    hour, minute = int(p["hour"]), int(p["minute"])
    twelfths = hour % 12
    raw_doubled = abs(60 * twelfths - 11 * minute)
    doubled = min(raw_doubled, 720 - raw_doubled)
    return {
        "hourTwelfths": twelfths,
        "rawDoubled": raw_doubled,
        "doubled": doubled,
        "answer": doubled / 2,
        "rawAngle": raw_doubled / 2,
        "minuteDeg": 6 * minute,
        "hourDeg": (60 * twelfths + minute) / 2,
    }


def clock_hands_angle_brute(p):
    """Place both hands on the dial in degrees and take the separation, rather
    than working in the doubled-angle integers the template uses."""
    hour, minute = int(p["hour"]), int(p["minute"])
    minute_hand = Fraction(360 * minute, 60)
    hour_hand = Fraction(360 * (hour % 12), 12) + Fraction(360 * minute, 12 * 60)
    gap = abs(minute_hand - hour_hand) % 360
    return float(min(gap, 360 - gap))


def egg_drop_min_trials_exact(p):
    floors = int(p["floors"])
    k = math.ceil((math.sqrt(8 * floors + 1) - 1) / 2)
    return {
        "answer": k,
        "reach": (k * (k + 1)) / 2,
        "shortOf": ((k - 1) * k) / 2,
        "firstDrop": k,
        "dropPlusOne": k + 1,
        "oneFewer": k - 1,
    }


def egg_drop_min_trials_brute(p):
    """Grow the DP for `most floors distinguishable with d drops and e eggs`
    (a drop either breaks the egg or does not) until it covers the building.
    No triangular-number closed form, no quadratic-root inversion."""
    floors = int(p["floors"])
    one_egg, two_eggs = 0, 0
    drops = 0
    while two_eggs < floors:
        drops += 1
        one_egg, two_eggs = one_egg + 1, one_egg + two_eggs + 1
    return float(drops)


def frog_well_escape_exact(p):
    depth, climb, slip = int(p["depth"]), int(p["climb"]), int(p["slip"])
    net = climb - slip
    to_cover = depth - climb
    full_days = math.ceil(to_cover / net)
    return {
        "net": net,
        "toCover": to_cover,
        "fullDays": full_days,
        "answer": full_days + 1,
        "naive": math.ceil(depth / (climb - slip)),
    }


def frog_well_escape_brute(p):
    """Live the frog's days out one at a time — the last day has no slide, and
    that is exactly the off-by-one the closed form has to get right."""
    depth, climb, slip = int(p["depth"]), int(p["climb"]), int(p["slip"])
    pos, day = 0, 0
    while True:
        day += 1
        pos += climb
        if pos >= depth:
            return float(day)
        pos -= slip


def light_switches_left_on_exact(p):
    bulbs = int(p["bulbs"])
    root = math.isqrt(bulbs)
    return {
        "root": root,
        "answer": root,
        "square": root * root,
        "nextSquare": (root + 1) * (root + 1),
        "nextRoot": root + 1,
    }


def light_switches_left_on_brute(p):
    """Actually make every pass and flip every switch, then count what is lit —
    no divisor-parity argument, no perfect squares."""
    bulbs = int(p["bulbs"])
    lit = bytearray(bulbs + 1)
    for k in range(1, bulbs + 1):
        for b in range(k, bulbs + 1, k):
            lit[b] ^= 1
    return float(sum(lit))


def pirates_gold_split_exact(p):
    pirates, coins = int(p["pirates"]), int(p["coins"])
    bribes = (pirates - 1) // 2
    return {
        "bribes": bribes,
        "answer": coins - bribes,
        "votesNeeded": bribes + 1,
        "crewAfter": pirates - 1,
    }


def pirates_gold_split_brute(p):
    """Solve the game backward from one pirate up, carrying the whole allocation
    vector at each crew size. A pirate votes yes only for strictly more gold than
    the next proposal would give them, since equal gold plus one fewer rival is
    the better outcome."""
    pirates, coins = int(p["pirates"]), int(p["coins"])
    alloc = [coins]  # crew of 1: the proposer takes everything
    for n in range(2, pirates + 1):
        needed = (n + 1) // 2  # a tie passes, so ceil(n/2) yes votes suffice
        bribes = needed - 1  # the proposer's own vote is free
        costs = sorted((alloc[i] + 1, i) for i in range(len(alloc)))[:bribes]
        spend = sum(c for c, _ in costs)
        assert spend <= coins, "pirates: proposer cannot buy a majority"
        nxt = [0] * n
        nxt[0] = coins - spend
        for c, i in costs:
            nxt[i + 1] = c
        alloc = nxt
    return float(alloc[0])


def trailing_zeros_factorial_exact(p):
    n = int(p["n"])
    by_five = n // 5
    by_twenty_five = n // 25
    by_one_twenty_five = n // 125
    return {
        "byFive": by_five,
        "byTwentyFive": by_twenty_five,
        "byOneTwentyFive": by_one_twenty_five,
        "answer": by_five + by_twenty_five + by_one_twenty_five,
        "byTwo": n // 2,
        "fifthOfN": n / 5,
    }


def trailing_zeros_factorial_brute(p):
    """Multiply the factorial out in full and count the zeros on the end. No
    Legendre sum, and in particular no assumption about where the sum stops."""
    value = math.factorial(int(p["n"]))
    zeros = 0
    while value % 10 == 0:
        value //= 10
        zeros += 1
    return float(zeros)


# --- combinatorial games -------------------------------------------------------
# `exact` mirrors the template's closed form (double-entry); `brute` never touches a
# remainder and instead searches the game tree, so the two derivations share nothing
# but the rules. Answers are 1-based indices into the template's `choices`:
# 1 = Alice (the player to move), 2 = Bob.

def _subtraction_winner_bruteforce(counters, max_take, last_taker_wins):
    """Play the pile out. win[n] is True when the player to move from n counters wins.
    No modular arithmetic anywhere — the recurrence is the definition of the game."""
    win = [False] * (counters + 1)
    # Terminal: facing an empty pile, the previous player took the last counter.
    # Under normal play that player won, so the mover has lost; under misere they lost,
    # so the mover has won.
    win[0] = not last_taker_wins
    for n in range(1, counters + 1):
        win[n] = any(not win[n - take] for take in range(1, min(max_take, n) + 1))
    return 1 if win[counters] else 2


def subtraction_game_last_wins_exact(p):
    counters, max_take = int(p["counters"]), int(p["maxTake"])
    period = max_take + 1
    rem = counters % period
    return {
        "period": period,
        "rem": rem,
        "lastSafe": counters - rem,
        "answer": 2 if rem == 0 else 1,
    }


def subtraction_game_last_wins_brute(p):
    return _subtraction_winner_bruteforce(int(p["counters"]), int(p["maxTake"]), True)


def subtraction_game_last_loses_exact(p):
    counters, max_take = int(p["counters"]), int(p["maxTake"])
    period = max_take + 1
    rem = counters % period
    last_safe = counters - rem
    if rem == 1:
        target = last_safe + 1
    elif rem == 0:
        target = last_safe - period + 1
    else:
        target = last_safe + 1
    return {
        "period": period,
        "rem": rem,
        "lastSafe": last_safe,
        "target": target,
        "answer": 2 if rem == 1 else 1,
    }


def subtraction_game_last_loses_brute(p):
    return _subtraction_winner_bruteforce(int(p["counters"]), int(p["maxTake"]), False)


def two_pile_nim_exact(p):
    base, offset = int(p["base"]), int(p["offset"])
    other = base + offset
    gap = abs(base - other)
    return {
        "other": other,
        "gap": gap,
        "smaller": min(base, other),
        "larger": max(base, other),
        "total": base + other,
        "answer": 2 if gap == 0 else 1,
    }


def two_pile_nim_brute(p):
    """Full game-tree search over (a, b) with memoisation. Never compares the piles —
    it enumerates every legal removal from either pile, which is what makes it an
    independent check on the mirroring argument rather than a restatement of it."""
    base, offset = int(p["base"]), int(p["offset"])
    other = base + offset
    from functools import lru_cache

    @lru_cache(maxsize=None)
    def win(a, b):
        if a == 0 and b == 0:
            return False          # nothing to take: the previous player took the last stone
        for take in range(1, a + 1):
            if not win(a - take, b):
                return True
        for take in range(1, b + 1):
            if not win(a, b - take):
                return True
        return False

    return 1 if win(base, other) else 2


SOLVERS = {
    "brainteasers/ants-pole-collisions": {
        "exact": ants_pole_collisions_exact,
        "simulate": ants_pole_collisions_sim,
    },
    "brainteasers/bridge-crossing-time": {
        "exact": bridge_crossing_time_exact,
        "brute": bridge_crossing_time_brute,
    },
    "brainteasers/clock-hands-angle": {
        "exact": clock_hands_angle_exact,
        "brute": clock_hands_angle_brute,
    },
    "brainteasers/egg-drop-min-trials": {
        "exact": egg_drop_min_trials_exact,
        "brute": egg_drop_min_trials_brute,
    },
    "brainteasers/frog-well-escape": {
        "exact": frog_well_escape_exact,
        "brute": frog_well_escape_brute,
    },
    "brainteasers/light-switches-left-on": {
        "exact": light_switches_left_on_exact,
        "brute": light_switches_left_on_brute,
    },
    "brainteasers/pirates-gold-split": {
        "exact": pirates_gold_split_exact,
        "brute": pirates_gold_split_brute,
    },
    "brainteasers/trailing-zeros-factorial": {
        "exact": trailing_zeros_factorial_exact,
        "brute": trailing_zeros_factorial_brute,
    },
    "brainteasers/subtraction-game-last-wins": {
        "exact": subtraction_game_last_wins_exact,
        "brute": subtraction_game_last_wins_brute,
    },
    "brainteasers/subtraction-game-last-loses": {
        "exact": subtraction_game_last_loses_exact,
        "brute": subtraction_game_last_loses_brute,
    },
    "brainteasers/two-pile-nim": {
        "exact": two_pile_nim_exact,
        "brute": two_pile_nim_brute,
    },
}
