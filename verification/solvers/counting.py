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



def inclusion_exclusion_two_sets_exact(p):
    total, bike, train, both = int(p["total"]), int(p["bike"]), int(p["train"]), int(p["both"])
    either = bike + train - both
    return {
        "bikeOnly": bike - both,
        "trainOnly": train - both,
        "either": either,
        "neither": total - either,
        "naiveSum": bike + train,
    }


def inclusion_exclusion_two_sets_brute(p):
    """Build the workforce as a list of employees, tag each one with the modes they
    use, and count the untagged. Membership is decided per employee — no union size
    is ever added or subtracted."""
    total, bike, train, both = int(p["total"]), int(p["bike"]), int(p["train"]), int(p["both"])
    cyclists = set(range(bike))
    start = bike - both
    riders = set(range(start, start + train))
    assert len(cyclists) == bike and len(riders) == train and len(cyclists & riders) == both
    return sum(1 for e in range(total) if e not in cyclists and e not in riders)


def inclusion_exclusion_three_sets_exact(p):
    daily, evening, weekly = int(p["daily"]), int(p["evening"]), int(p["weekly"])
    de, dw, ew = int(p["dailyEvening"]), int(p["dailyWeekly"]), int(p["eveningWeekly"])
    all3 = int(p["allThree"])
    single_sum = daily + evening + weekly
    pair_sum = de + dw + ew
    only_daily = daily - de - dw + all3
    only_evening = evening - de - ew + all3
    only_weekly = weekly - dw - ew + all3
    just_de, just_dw, just_ew = de - all3, dw - all3, ew - all3
    return {
        "singleSum": single_sum,
        "pairSum": pair_sum,
        "afterPairs": single_sum - pair_sum,
        "union": single_sum - pair_sum + all3,
        "onlyDaily": only_daily,
        "onlyEvening": only_evening,
        "onlyWeekly": only_weekly,
        "justDE": just_de,
        "justDW": just_dw,
        "justEW": just_ew,
        "cornerSum": only_daily + only_evening + only_weekly,
        "pairOnlySum": just_de + just_dw + just_ew,
    }


def inclusion_exclusion_three_sets_brute(p):
    """Hand out reader ids region by region, rebuild the three subscription lists
    from them, then walk the readers and count those on at least one list. The
    alternating sum never appears; the reported list and overlap sizes are asserted
    against the construction so the universe really is the one described."""
    daily, evening, weekly = int(p["daily"]), int(p["evening"]), int(p["weekly"])
    de, dw, ew = int(p["dailyEvening"]), int(p["dailyWeekly"]), int(p["eveningWeekly"])
    all3 = int(p["allThree"])
    regions = {
        "d": daily - de - dw + all3,
        "e": evening - de - ew + all3,
        "w": weekly - dw - ew + all3,
        "de": de - all3,
        "dw": dw - all3,
        "ew": ew - all3,
        "dew": all3,
    }
    readers, next_id = {}, 0
    for label, size in regions.items():
        for _ in range(size):
            readers[next_id] = label
            next_id += 1
    takes = {"daily": ("d", "de", "dw", "dew"),
             "evening": ("e", "de", "ew", "dew"),
             "weekly": ("w", "dw", "ew", "dew")}
    on_daily = {r for r, lab in readers.items() if lab in takes["daily"]}
    on_evening = {r for r, lab in readers.items() if lab in takes["evening"]}
    on_weekly = {r for r, lab in readers.items() if lab in takes["weekly"]}
    assert len(on_daily) == daily and len(on_evening) == evening and len(on_weekly) == weekly
    assert len(on_daily & on_evening) == de and len(on_daily & on_weekly) == dw
    assert len(on_evening & on_weekly) == ew and len(on_daily & on_evening & on_weekly) == all3
    return sum(1 for r in readers if r in on_daily or r in on_evening or r in on_weekly)


def adjacency_forbidden_gap_exact(p):
    spaces, reserved = int(p["spaces"]), int(p["reserved"])
    free_bays = spaces - reserved
    tail_free = _choose(free_bays, reserved)
    tail_used = _choose(free_bays, reserved - 1)
    return {
        "freeBays": free_bays,
        "gaps": free_bays + 1,
        "ways": _choose(free_bays + 1, reserved),
        "allPlacements": _choose(spaces, reserved),
        "tailFree": tail_free,
        "tailUsed": tail_used,
        "caseSum": tail_free + tail_used,
        "reservedLess1": reserved - 1,
    }


def adjacency_forbidden_gap_brute(p):
    """Walk every set of bays management could reserve and keep the ones with no two
    bays side by side. Nothing here counts gaps or evaluates a binomial."""
    spaces, reserved = int(p["spaces"]), int(p["reserved"])
    legal = 0
    for pick in itertools.combinations(range(spaces), reserved):
        if all(pick[i + 1] - pick[i] > 1 for i in range(len(pick) - 1)):
            legal += 1
    return legal


def stars_and_bars_lower_bounds_exact(p):
    units, labs, min_each = int(p["units"]), int(p["labs"]), int(p["minEach"])
    committed = labs * min_each
    surplus = units - committed
    bars = labs - 1
    return {
        "committed": committed,
        "surplus": surplus,
        "bars": bars,
        "slots": surplus + bars,
        "ways": _choose(surplus + bars, bars),
        "freeSlots": units + bars,
        "freeWays": _choose(units + bars, bars),
    }


def stars_and_bars_lower_bounds_brute(p):
    """Dynamic program over the labs: ways[t] holds the number of ways to hand out t
    units to the labs seen so far, with every lab taking at least its minimum. No
    divider argument and no binomial — just repeated addition."""
    units, labs, min_each = int(p["units"]), int(p["labs"]), int(p["minEach"])
    ways = [1] + [0] * units
    for _ in range(labs):
        nxt = [0] * (units + 1)
        for handed, count in enumerate(ways):
            if count == 0:
                continue
            for take in range(min_each, units - handed + 1):
                nxt[handed + take] += count
        ways = nxt
    return ways[units]


def at_least_k_committee_exact(p):
    partners, associates, team = int(p["partners"]), int(p["associates"]), int(p["team"])
    staff = partners + associates
    all_teams = _choose(staff, team)
    no_partner = _choose(associates, team)
    one_partner = partners * _choose(associates, team - 1)
    pair_pick = _choose(partners, 2)
    fill_rest = _choose(staff - 2, team - 2)
    return {
        "staff": staff,
        "allTeams": all_teams,
        "noPartner": no_partner,
        "onePartner": one_partner,
        "barred": no_partner + one_partner,
        "ways": all_teams - no_partner - one_partner,
        "teamLess1": team - 1,
        "teamLess2": team - 2,
        "staffLess2": staff - 2,
        "pairPick": pair_pick,
        "fillRest": fill_rest,
        "shortcut": pair_pick * fill_rest,
    }


def at_least_k_committee_brute(p):
    """Enumerate every team the firm could staff and keep the ones holding at least
    two partners. Counted directly, with no complement and no binomial anywhere."""
    partners, associates, team = int(p["partners"]), int(p["associates"]), int(p["team"])
    people = ["partner"] * partners + ["associate"] * associates
    legal = 0
    for pick in itertools.combinations(range(len(people)), team):
        if sum(1 for i in pick if people[i] == "partner") >= 2:
            legal += 1
    return legal


def adjacency_required_block_exact(p):
    books, series = int(p["books"]), int(p["series"])
    items = books - series + 1
    item_arr = _fact(items)
    series_arr = _fact(series)
    total_arr = _fact(books)
    favourable = item_arr * series_arr
    positions = _choose(books, series)
    return {
        "items": items,
        "loose": books - series,
        "itemArr": item_arr,
        "seriesArr": series_arr,
        "favourable": favourable,
        "totalArr": total_arr,
        "prob": float(Fraction(favourable, total_arr)),
        "positions": positions,
        "runs": items,
        "probAlt": float(Fraction(items, 1) / positions),
    }


def adjacency_required_block_brute(p):
    """Enumerate which shelf positions the series volumes occupy and count the sets
    that form an unbroken run, tallying numerator and denominator in the same loop.

    The other books never enter the loop on purpose: every position set admits the
    same number of full shelvings, so that factor divides out of the ratio — which is
    the cancellation the problem is teaching. No factorial is evaluated here."""
    books, series = int(p["books"]), int(p["series"])
    favourable = total = 0
    for pick in itertools.combinations(range(books), series):
        total += 1
        if pick[-1] - pick[0] == series - 1:
            favourable += 1
    return favourable / total


def one_pair_reduced_deck_exact(p):
    ranks, suits = int(p["ranks"]), int(p["suits"])
    deck = ranks * suits
    hands = _choose(deck, 5)
    pair_suits = _choose(suits, 2)
    other_ranks = _choose(ranks - 1, 3)
    suit_choices = suits ** 3
    favourable = ranks * pair_suits * other_ranks * suit_choices
    rank_sets = _choose(ranks, 5)
    suit_five = suits ** 5
    no_repeat = rank_sets * suit_five
    prob = float(favourable / hands)
    all_distinct = float(no_repeat / hands)
    return {
        "deck": deck,
        "hands": hands,
        "pairSuits": pair_suits,
        "ranksLess1": ranks - 1,
        "otherRanks": other_ranks,
        "suitChoices": suit_choices,
        "favourable": favourable,
        "prob": prob,
        "rankSets": rank_sets,
        "suitFive": suit_five,
        "noRepeat": no_repeat,
        "allDistinct": all_distinct,
        "pairOrDistinct": prob + all_distinct,
    }


def one_pair_reduced_deck_brute(p):
    """Deal every hand the reduced deck can produce and classify it by its rank
    pattern: exactly one rank appearing twice and three ranks appearing once. Both
    tallies come from the same walk — no hand-building product is evaluated."""
    ranks, suits = int(p["ranks"]), int(p["suits"])
    deck = [(rank, suit) for rank in range(ranks) for suit in range(suits)]
    favourable = total = 0
    for hand in itertools.combinations(deck, 5):
        total += 1
        counts = {}
        for rank, _suit in hand:
            counts[rank] = counts.get(rank, 0) + 1
        if sorted(counts.values()) == [1, 1, 1, 2]:
            favourable += 1
    return favourable / total


def birthday_collision_exact(p):
    slots, hires = int(p["slots"]), int(p["hires"])
    outcomes = slots ** hires
    distinct_ways = 1
    for i in range(hires):
        distinct_ways *= slots - i
    all_distinct = distinct_ways / outcomes
    pairs = hires * (hires - 1) // 2
    return {
        "outcomes": outcomes,
        "distinctWays": distinct_ways,
        "allDistinct": all_distinct,
        "prob": 1 - all_distinct,
        "lastFactor": slots - hires + 1,
        "pairs": pairs,
        "pairChance": 1 / slots,
        "pairBound": pairs / slots,
    }


def birthday_collision_brute(p):
    """Enumerate every assignment of analysts to sessions and count the ones where
    some session is used twice — counted head on, not through the all-different
    complement the template takes."""
    slots, hires = int(p["slots"]), int(p["hires"])
    favourable = total = 0
    for assignment in itertools.product(range(slots), repeat=hires):
        total += 1
        if len(set(assignment)) < hires:
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
    "counting/inclusion-exclusion-two-sets": {
        "exact": inclusion_exclusion_two_sets_exact,
        "brute": inclusion_exclusion_two_sets_brute,
    },
    "counting/inclusion-exclusion-three-sets": {
        "exact": inclusion_exclusion_three_sets_exact,
        "brute": inclusion_exclusion_three_sets_brute,
    },
    "counting/adjacency-forbidden-gap": {
        "exact": adjacency_forbidden_gap_exact,
        "brute": adjacency_forbidden_gap_brute,
    },
    "counting/stars-and-bars-lower-bounds": {
        "exact": stars_and_bars_lower_bounds_exact,
        "brute": stars_and_bars_lower_bounds_brute,
    },
    "counting/at-least-k-committee": {
        "exact": at_least_k_committee_exact,
        "brute": at_least_k_committee_brute,
    },
    "counting/adjacency-required-block": {
        "exact": adjacency_required_block_exact,
        "brute": adjacency_required_block_brute,
    },
    "counting/one-pair-reduced-deck": {
        "exact": one_pair_reduced_deck_exact,
        "brute": one_pair_reduced_deck_brute,
    },
    "counting/birthday-collision": {
        "exact": birthday_collision_exact,
        "brute": birthday_collision_brute,
    },
}
