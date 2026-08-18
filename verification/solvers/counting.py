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



def specific_arrangement_exact(p):
    symbols, length = int(p["symbols"]), int(p["length"])
    perm = 1
    for i in range(length):
        perm *= symbols - i
    orders = _fact(length)
    sets = Fraction(perm, orders)
    return {
        "perm": perm,
        "orders": orders,
        "sets": sets,
        "prob": Fraction(1, perm),
        "setProb": 1 / sets,
        "lastFactor": symbols - length + 1,
    }


def specific_arrangement_brute(p):
    """Walk every code the keypad accepts and count the one that opens the locker.
    Both tallies come out of the same walk — no falling product is evaluated."""
    symbols, length = int(p["symbols"]), int(p["length"])
    target = tuple(range(length))
    favourable = total = 0
    for code in itertools.permutations(range(symbols), length):
        total += 1
        if code == target:
            favourable += 1
    return favourable / total


def lattice_paths_grid_exact(p):
    across, up = int(p["across"]), int(p["up"])
    ca, cu = int(p["cornerAcross"]), int(p["cornerUp"])
    steps = across + up
    corner_steps = ca + cu
    to_corner = _choose(corner_steps, ca)
    rest_across, rest_up = across - ca, up - cu
    from_corner = _choose(rest_across + rest_up, rest_across)
    total = _choose(steps, across)
    via_west = _choose(corner_steps - 1, ca - 1)
    via_south = _choose(corner_steps - 1, ca)
    return {
        "steps": steps,
        "total": total,
        "cornerSteps": corner_steps,
        "toCorner": to_corner,
        "restAcross": rest_across,
        "restUp": rest_up,
        "restSteps": rest_across + rest_up,
        "fromCorner": from_corner,
        "through": to_corner * from_corner,
        "prob": float(to_corner * from_corner / total),
        "viaWest": via_west,
        "viaSouth": via_south,
        "entrySum": via_west + via_south,
    }


def lattice_paths_grid_brute(p):
    """Walk the grid cell by cell, carrying two running counts per junction: routes
    that reach it, and routes that reach it having already passed the marked
    junction. Purely additive — no binomial and no product of legs."""
    across, up = int(p["across"]), int(p["up"])
    ca, cu = int(p["cornerAcross"]), int(p["cornerUp"])
    reach = [[0] * (up + 1) for _ in range(across + 1)]
    hit = [[0] * (up + 1) for _ in range(across + 1)]
    reach[0][0] = 1
    for i in range(across + 1):
        for j in range(up + 1):
            if i or j:
                reach[i][j] = (reach[i - 1][j] if i else 0) + (reach[i][j - 1] if j else 0)
                hit[i][j] = (hit[i - 1][j] if i else 0) + (hit[i][j - 1] if j else 0)
            if i == ca and j == cu:
                hit[i][j] = reach[i][j]
    return hit[across][up] / reach[across][up]


def small_derangement_exact(p):
    letters, correct = int(p["letters"]), int(p["correct"])
    rest = letters - correct
    prev, cur = 1, 0
    for j in range(2, rest + 1):
        prev, cur = cur, (j - 1) * (cur + prev)
    derange_rest = 1 if rest == 0 else cur
    places = _choose(letters, correct)
    favourable = places * derange_rest
    total_arr = _fact(letters)
    naive_count = places * _fact(rest)
    return {
        "rest": rest,
        "places": places,
        "derangeRest": derange_rest,
        "favourable": favourable,
        "totalArr": total_arr,
        "prob": float(favourable / total_arr),
        "restArr": _fact(rest),
        "naiveCount": naive_count,
        "naiveProb": float(naive_count / total_arr),
    }


def small_derangement_brute(p):
    """Enumerate every stuffing and count those with exactly the requested number of
    letters in the right envelope. No derangement recurrence and no binomial: the
    fixed points are counted on each arrangement as it comes."""
    letters, correct = int(p["letters"]), int(p["correct"])
    favourable = total = 0
    for arrangement in itertools.permutations(range(letters)):
        total += 1
        if sum(1 for i, v in enumerate(arrangement) if i == v) == correct:
            favourable += 1
    return favourable / total


def general_derangements_exact(p):
    questions, starred = int(p["questions"]), int(p["starred"])
    out, ways = {}, 0
    for i in range(starred + 1):
        term = _choose(starred, i) * _fact(questions - i)
        out[f"term{i}"] = term
        ways += term if i % 2 == 0 else -term
    prev, cur = 1, 0
    for j in range(2, questions + 1):
        prev, cur = cur, (j - 1) * (cur + prev)
    out["totalArr"] = _fact(questions)
    out["questionsLess1"] = questions - 1
    out["questionsLess2"] = questions - 2
    out["restArr1"] = _fact(questions - 1)
    out["restArr2"] = _fact(questions - 2)
    out["starredPairs"] = _choose(starred, 2)
    out["ways"] = ways
    out["fullDerange"] = cur
    return out


def general_derangements_brute(p):
    """Recurrence on the starred set instead of an alternating sum. Writing f(n, k)
    for the pairings of n questions in which none of k starred questions is right,
    split the pairings counted by f(n, k-1) on whether the k-th starred question is
    right: those that get it right pin one pairing and leave f(n-1, k-1), so
    f(n, k) = f(n, k-1) - f(n-1, k-1), seeded by f(n, 0) = n!."""
    questions, starred = int(p["questions"]), int(p["starred"])
    row = [_fact(n) for n in range(questions + 1)]
    for _ in range(starred):
        row = [0] + [row[n] - row[n - 1] for n in range(1, questions + 1)]
    return row[questions]


def surjections_no_empty_bin_exact(p):
    parcels, vans = int(p["parcels"]), int(p["vans"])
    out, ways = {}, 0
    for i in range(vans):
        term = _choose(vans, i) * (vans - i) ** parcels
        out[f"term{i}"] = term
        ways += term if i % 2 == 0 else -term
    row = [1]
    for _ in range(parcels):
        nxt = [0] * (vans + 1)
        for b in range(1, vans + 1):
            nxt[b] = b * (row[b] if b < len(row) else 0) + (row[b - 1] if b - 1 < len(row) else 0)
        row = nxt
    out["allMaps"] = vans ** parcels
    out["barOne"] = (vans - 1) ** parcels
    out["ways"] = ways
    out["groupings"] = row[vans]
    out["vanOrders"] = _fact(vans)
    out["labelled"] = row[vans] * _fact(vans)
    out["vansLess1"] = vans - 1
    return out


def surjections_no_empty_bin_brute(p):
    """Assign the parcels one at a time, carrying the set of vans used so far as a
    bit mask, and read off the assignments that finish with every van used. Nothing
    is subtracted and no Stirling number is built."""
    parcels, vans = int(p["parcels"]), int(p["vans"])
    full = (1 << vans) - 1
    state = {0: 1}
    for _ in range(parcels):
        nxt = {}
        for mask, count in state.items():
            for v in range(vans):
                key = mask | (1 << v)
                nxt[key] = nxt.get(key, 0) + count
        state = nxt
    return state.get(full, 0)


def lattice_paths_forbidden_node_exact(p):
    east, north = int(p["east"]), int(p["north"])
    be, bn = int(p["blockEast"]), int(p["blockNorth"])
    aisles = east + north
    total = _choose(aisles, east)
    to_block = _choose(be + bn, be)
    rest_east, rest_north = east - be, north - bn
    rest_aisles = rest_east + rest_north
    from_block = _choose(rest_aisles, rest_east)
    out_east = _choose(rest_aisles - 1, rest_east - 1)
    out_north = _choose(rest_aisles - 1, rest_east)
    return {
        "aisles": aisles,
        "total": total,
        "blockAisles": be + bn,
        "toBlock": to_block,
        "restEast": rest_east,
        "restNorth": rest_north,
        "restAisles": rest_aisles,
        "fromBlock": from_block,
        "blocked": to_block * from_block,
        "ways": total - to_block * from_block,
        "outEast": out_east,
        "outNorth": out_north,
        "exitSum": out_east + out_north,
    }


def lattice_paths_forbidden_node_brute(p):
    """Walk the aisle grid additively with the closed junction zeroed out, so routes
    are never counted through it in the first place. No subtraction and no binomial."""
    east, north = int(p["east"]), int(p["north"])
    be, bn = int(p["blockEast"]), int(p["blockNorth"])
    grid = [[0] * (north + 1) for _ in range(east + 1)]
    grid[0][0] = 1
    for i in range(east + 1):
        for j in range(north + 1):
            if i == be and j == bn:
                grid[i][j] = 0
                continue
            if i or j:
                grid[i][j] = (grid[i - 1][j] if i else 0) + (grid[i][j - 1] if j else 0)
    return grid[east][north]


def pigeonhole_extremal_exact(p):
    colours, need, per_colour = int(p["colours"]), int(p["need"]), int(p["perColour"])
    return {
        "stock": colours * per_colour,
        "needLess1": need - 1,
        "needLess2": need - 2,
        "worst": (need - 1) * colours,
        "ways": (need - 1) * colours + 1,
        "easier": (need - 2) * colours + 1,
        "gap": colours,
    }


def pigeonhole_extremal_brute(p):
    """Search upward through candidate hauls for the first size at which no failing
    haul exists. Whether a haul of size t can fail is settled by a reachability walk
    over the colours, taking between none and the per-colour shelf limit of each
    while keeping every colour short of the target — no product is evaluated."""
    colours, need, per_colour = int(p["colours"]), int(p["need"]), int(p["perColour"])
    cap = min(per_colour, need - 1)
    stock = colours * per_colour
    for size in range(1, stock + 1):
        reachable = {0}
        for _ in range(colours):
            reachable = {taken + take for taken in reachable for take in range(cap + 1)
                         if taken + take <= size}
        if size not in reachable:
            return size
    return stock


def two_pair_vs_full_house_exact(p):
    ranks, suits = int(p["ranks"]), int(p["suits"])
    deck = ranks * suits
    hands = _choose(deck, 5)
    rank_pairs = _choose(ranks, 2)
    pair_suits = _choose(suits, 2)
    odd_ranks = ranks - 2
    two_pair_count = rank_pairs * pair_suits * pair_suits * odd_ranks * suits
    trip_suits = _choose(suits, 3)
    full_count = ranks * trip_suits * (ranks - 1) * pair_suits
    return {
        "deck": deck,
        "hands": hands,
        "rankPairs": rank_pairs,
        "pairSuits": pair_suits,
        "suitsSquared": pair_suits * pair_suits,
        "oddRanks": odd_ranks,
        "oddCards": odd_ranks * suits,
        "twoPairCount": two_pair_count,
        "twoPairProb": float(two_pair_count / hands),
        "tripSuits": trip_suits,
        "ranksLess1": ranks - 1,
        "fullCount": full_count,
        "fullProb": float(full_count / hands),
        "ratio": float(two_pair_count / full_count),
    }


def two_pair_vs_full_house_brute(p):
    """Deal every hand the reduced deck allows and keep the ones whose rank pattern
    is two ranks twice and one rank once. Numerator and denominator come from the
    same walk; no hand-building product appears."""
    ranks, suits = int(p["ranks"]), int(p["suits"])
    deck = [(rank, suit) for rank in range(ranks) for suit in range(suits)]
    favourable = total = 0
    for hand in itertools.combinations(deck, 5):
        total += 1
        counts = {}
        for rank, _suit in hand:
            counts[rank] = counts.get(rank, 0) + 1
        if sorted(counts.values()) == [1, 2, 2]:
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
    "counting/specific-arrangement": {
        "exact": specific_arrangement_exact,
        "brute": specific_arrangement_brute,
    },
    "counting/lattice-paths-grid": {
        "exact": lattice_paths_grid_exact,
        "brute": lattice_paths_grid_brute,
    },
    "counting/small-derangement": {
        "exact": small_derangement_exact,
        "brute": small_derangement_brute,
    },
    "counting/general-derangements": {
        "exact": general_derangements_exact,
        "brute": general_derangements_brute,
    },
    "counting/surjections-no-empty-bin": {
        "exact": surjections_no_empty_bin_exact,
        "brute": surjections_no_empty_bin_brute,
    },
    "counting/lattice-paths-forbidden-node": {
        "exact": lattice_paths_forbidden_node_exact,
        "brute": lattice_paths_forbidden_node_brute,
    },
    "counting/pigeonhole-extremal": {
        "exact": pigeonhole_extremal_exact,
        "brute": pigeonhole_extremal_brute,
    },
    "counting/two-pair-vs-full-house": {
        "exact": two_pair_vs_full_house_exact,
        "brute": two_pair_vs_full_house_brute,
    },
}
