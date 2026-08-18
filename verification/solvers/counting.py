"""Independent Python counterparts for content/problems/counting/*.
exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).
It is MEANT to mirror the template's derivation — that mirroring is the check.
brute(): recomputes the ANSWER by a path derivationally independent of the
template's closed form — enumeration, DP, or a recurrence. Only brute() carries
the independence requirement: never re-call the formula the template used, as
that is transcription, not verification."""

import itertools
from fractions import Fraction


def _fact(m):
    f = 1
    for i in range(2, m + 1):
        f *= i
    return f


def _choose(m, j):
    """Multiplicative binomial, mirroring the TS templates' own helper. exact()
    only — never reached from any brute()."""
    num = 1
    for i in range(j):
        num *= m - i
    return Fraction(num, _fact(j))


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


def distinct_permutations_exact(p):
    n, r = int(p["n"]), int(p["r"])
    ways = 1
    for i in range(r):
        ways *= n - i
    return {
        "ways": ways,
        "nFact": _fact(n),
        "leftover": n - r,
        "leftoverFact": _fact(n - r),
        "nMinus1": n - 1,
        "lastFactor": n - r + 1,
    }


def distinct_permutations_brute(p):
    """Walk every ordered r-tuple of distinct books and tally them. No product,
    no factorial — the count falls out of the enumeration itself."""
    n, r = int(p["n"]), int(p["r"])
    seen = 0
    for _ in itertools.permutations(range(n), r):
        seen += 1
    return seen


def repeated_letters_exact(p):
    red, blue, green = int(p["red"]), int(p["blue"]), int(p["green"])
    total = red + blue + green
    red_fact, blue_fact, green_fact = _fact(red), _fact(blue), _fact(green)
    divisor = red_fact * blue_fact * green_fact
    after_red = total - red
    pick_red = _choose(total, red)
    pick_blue = _choose(after_red, blue)
    return {
        "total": total,
        "totalFact": _fact(total),
        "redFact": red_fact,
        "blueFact": blue_fact,
        "greenFact": green_fact,
        "divisor": divisor,
        "ways": Fraction(_fact(total), divisor),
        "afterRed": after_red,
        "pickRed": pick_red,
        "pickBlue": pick_blue,
        "posProduct": pick_red * pick_blue,
    }


def repeated_letters_brute(p):
    """Enumerate every ordering of the actual flag string and collapse duplicates
    with a set: the indistinguishability is handled by the data, not by a divisor."""
    red, blue, green = int(p["red"]), int(p["blue"]), int(p["green"])
    flags = "R" * red + "B" * blue + "G" * green
    return len(set(itertools.permutations(flags)))


def product_rule_plates_exact(p):
    alphabet, letters, digits = int(p["alphabet"]), int(p["letters"]), int(p["digits"])
    letter_ways = alphabet ** letters
    digit_ways = 10 ** digits
    distinct_letter_ways = 1
    for i in range(letters):
        distinct_letter_ways *= alphabet - i
    return {
        "letterWays": letter_ways,
        "digitWays": digit_ways,
        "ways": letter_ways * digit_ways,
        "slots": letters + digits,
        "distinctLetterWays": distinct_letter_ways,
        "distinctWays": distinct_letter_ways * digit_ways,
    }


def product_rule_plates_brute(p):
    """Build the per-slot option list the plate format actually describes, then
    fold it with a running product — no exponentiation anywhere."""
    alphabet, letters, digits = int(p["alphabet"]), int(p["letters"]), int(p["digits"])
    slot_sizes = [alphabet] * letters + [10] * digits
    running = 1
    for size in slot_sizes:
        running *= size
    return running


def forced_member_committee_exact(p):
    n, k = int(p["n"]), int(p["k"])
    return {
        "pool": n - 1,
        "slots": k - 1,
        "ways": _choose(n - 1, k - 1),
        "totalTeams": _choose(n, k),
        "withoutChief": _choose(n - 1, k),
    }


def forced_member_committee_brute(p):
    """Pascal's recurrence built up to the reduced pool's row. Purely additive:
    no factorials, no multiplicative binomial, no math.comb."""
    n, k = int(p["n"]), int(p["k"])
    row = [1]
    for _ in range(n - 1):
        row = [1] + [row[i] + row[i + 1] for i in range(len(row) - 1)] + [1]
    return row[k - 1]


def stars_and_bars_basic_exact(p):
    passes, bands = int(p["passes"]), int(p["bands"])
    bars = bands - 1
    symbols = passes + bands - 1
    return {
        "bars": bars,
        "symbols": symbols,
        "ways": _choose(symbols, bars),
        "gaps": passes - 1,
        "strictWays": _choose(passes - 1, bars),
    }


def stars_and_bars_basic_brute(p):
    """DP over bins: ways[b][t] = number of ways to hand t passes to b bands,
    built by summing over what the newest band takes. Never touches a binomial."""
    passes, bands = int(p["passes"]), int(p["bands"])
    row = [1 if t == 0 else 0 for t in range(passes + 1)]  # zero bands, zero passes
    for _ in range(bands):
        nxt = [0] * (passes + 1)
        for t in range(passes + 1):
            nxt[t] = sum(row[t - taken] for taken in range(t + 1))
        row = nxt
    return row[passes]


def circular_adjacent_pair_exact(p):
    chairs = int(p["chairs"])
    return {
        "otherChairs": chairs - 1,
        "farChairs": chairs - 3,
        "prob": 2 / (chairs - 1),
        "probNot": (chairs - 3) / (chairs - 1),
    }


def circular_adjacent_pair_brute(p):
    """Enumerate every ordered pair of distinct chairs the two named guests could
    occupy on the labelled circle and count the adjacent ones. Numerator and
    denominator both come from the loop — nothing here evaluates 2/(chairs-1).

    The remaining guests are absent from this loop on purpose: placing them is the
    same number of ways for every (Ana, Ben) pair, so that factor cancels out of the
    ratio. That cancellation is the lesson the problem teaches, and it was checked
    empirically against a full-seating enumeration wherever that was small enough
    to run."""
    chairs = int(p["chairs"])
    favourable = total = 0
    for ana in range(chairs):
        for ben in range(chairs):
            if ana == ben:
                continue
            total += 1
            gap = abs(ana - ben)
            if gap == 1 or gap == chairs - 1:
                favourable += 1
    return favourable / total


def all_one_type_draw_exact(p):
    ripe, hard, grab = int(p["ripe"]), int(p["hard"]), int(p["grab"])
    total = ripe + hard
    ways_ripe = _choose(ripe, grab)
    ways_any = _choose(total, grab)
    ripe_share = ripe / total
    return {
        "total": total,
        "waysRipe": ways_ripe,
        "waysAny": ways_any,
        "prob": float(ways_ripe / ways_any),
        "ripeShare": ripe_share,
        "withRepl": ripe_share ** grab,
    }


def all_one_type_draw_brute(p):
    """Walk every handful the chef could lift out and tally the all-ripe ones.
    Both tallies come from the same loop — no binomial on either side."""
    ripe, hard, grab = int(p["ripe"]), int(p["hard"]), int(p["grab"])
    crate = ["ripe"] * ripe + ["hard"] * hard
    favourable = total = 0
    for handful in itertools.combinations(range(len(crate)), grab):
        total += 1
        if all(crate[i] == "ripe" for i in handful):
            favourable += 1
    return favourable / total


def at_least_one_complement_exact(p):
    faces, rolls = int(p["faces"]), int(p["rolls"])
    miss_prob = (faces - 1) / faces
    all_miss = miss_prob ** rolls
    return {
        "missFaces": faces - 1,
        "missProb": miss_prob,
        "allMiss": all_miss,
        "prob": 1 - all_miss,
        "hitProb": 1 / faces,
        "unionBound": rolls / faces,
        "outcomes": faces ** rolls,
    }


def at_least_one_complement_brute(p):
    """Enumerate the whole outcome space of roll sequences and count the ones that
    contain the top face DIRECTLY — deliberately not via the complement the
    template uses, and with the denominator tallied in the same loop."""
    faces, rolls = int(p["faces"]), int(p["rolls"])
    favourable = total = 0
    for sequence in itertools.product(range(1, faces + 1), repeat=rolls):
        total += 1
        if faces in sequence:
            favourable += 1
    return favourable / total


SOLVERS = {
    "counting/committee-selection": {
        "exact": committee_selection_exact,
        "brute": committee_selection_brute,
    },
    "counting/distinct-permutations": {
        "exact": distinct_permutations_exact,
        "brute": distinct_permutations_brute,
    },
    "counting/repeated-letters": {
        "exact": repeated_letters_exact,
        "brute": repeated_letters_brute,
    },
    "counting/product-rule-plates": {
        "exact": product_rule_plates_exact,
        "brute": product_rule_plates_brute,
    },
    "counting/forced-member-committee": {
        "exact": forced_member_committee_exact,
        "brute": forced_member_committee_brute,
    },
    "counting/stars-and-bars-basic": {
        "exact": stars_and_bars_basic_exact,
        "brute": stars_and_bars_basic_brute,
    },
    "counting/circular-adjacent-pair": {
        "exact": circular_adjacent_pair_exact,
        "brute": circular_adjacent_pair_brute,
    },
    "counting/all-one-type-draw": {
        "exact": all_one_type_draw_exact,
        "brute": all_one_type_draw_brute,
    },
    "counting/at-least-one-complement": {
        "exact": at_least_one_complement_exact,
        "brute": at_least_one_complement_brute,
    },
}
