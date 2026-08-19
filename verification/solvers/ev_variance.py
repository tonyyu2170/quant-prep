"""Independent Python counterparts for content/problems/ev-variance/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry).
It is MEANT to mirror the template — that mirroring is the check — so it stays in
floats; a Fraction-based exact() would absorb a template that loses precision.
brute(): recomputes the ANSWER by enumerating the sample space, never by re-calling
the template's closed form. Only brute() carries the independence requirement, works
in Fraction where the space is rational, and returns float() explicitly."""

from fractions import Fraction
from itertools import combinations, permutations, product
from math import factorial


def two_outcome_bet_exact(p):
    k, w, loss = int(p["k"]), int(p["w"]), int(p["l"])
    win_faces = 7 - k
    lose_faces = k - 1
    p_win = win_faces / 6
    p_lose = lose_faces / 6
    win_leg = p_win * w
    lose_leg = p_lose * loss
    return {
        "winFaces": win_faces,
        "loseFaces": lose_faces,
        "pWin": p_win,
        "pLose": p_lose,
        "winLeg": win_leg,
        "loseLeg": lose_leg,
        "fairWin": lose_faces * loss / win_faces,
        "ev": (win_faces * w - lose_faces * loss) / 6,
    }


def two_outcome_bet_brute(p):
    """Walk the six faces and average the profit. No probabilities are formed and
    nothing is multiplied by a weight — the template's p*payoff structure never
    appears here, which is what makes this a second derivation."""
    k, w, loss = int(p["k"]), int(p["w"]), int(p["l"])
    total = Fraction(0)
    for face in range(1, 7):
        total += Fraction(w) if face >= k else Fraction(-loss)
    return float(total / 6)


def die_payoff_table_exact(p):
    lo, mid, hi = int(p["lo"]), int(p["mid"]), int(p["hi"])
    return {
        "midNum": 3 * mid,
        "highNum": 2 * hi,
        "plainNum": 2 * (lo + mid + hi),
        "plainAvg": (lo + mid + hi) / 3,
        "gapNum": abs(mid - lo),
        "ev": (lo + 3 * mid + 2 * hi) / 6,
    }


def die_payoff_table_brute(p):
    """Walk the six faces one at a time and average what each pays. No row is ever
    weighted and no probability is formed, so the template's weighted-row structure
    plays no part in this figure."""
    lo, mid, hi = int(p["lo"]), int(p["mid"]), int(p["hi"])
    total = Fraction(0)
    for face in range(1, 7):
        total += Fraction(lo if face == 1 else mid if face <= 4 else hi)
    return float(total / 6)


def raffle_fair_price_exact(p):
    tickets, grand = int(p["tickets"]), int(p["grand"])
    runners, voucher = int(p["runners"]), int(p["voucher"])
    return {
        "prizeCount": runners + 1,
        "runnersVoucher": runners * voucher,
        "pool": grand + runners * voucher,
        "legGrand": grand / tickets,
        "perWinner": (grand + runners * voucher) / (runners + 1),
        "price": (grand + runners * voucher) / tickets,
    }


def raffle_fair_price_brute(p):
    """Lay the whole ticket pool out — one entry per ticket sold, carrying the prize that
    ticket ends up with — and average across it. The prize fund is never totalled and no
    per-prize probability is formed; the answer falls out of the pool itself."""
    tickets, grand = int(p["tickets"]), int(p["grand"])
    runners, voucher = int(p["runners"]), int(p["voucher"])
    pool = [grand] + [voucher] * runners + [0] * (tickets - runners - 1)
    assert len(pool) == tickets
    return float(sum(Fraction(prize) for prize in pool) / tickets)


def sum_of_two_draws_exact(p):
    red, blue, rate = int(p["red"]), int(p["blue"]), int(p["rate"])
    mean_red = (red + 1) / 2
    mean_blue = (blue + 1) / 2
    return {
        "meanRed": mean_red,
        "meanBlue": mean_blue,
        "meanTotal": mean_red + mean_blue,
        "maxTotal": red + blue,
        "ev": rate * (mean_red + mean_blue),
    }


def sum_of_two_draws_brute(p):
    """Enumerate the joint grid of both dice and average the payout on each cell. Neither
    die is ever averaged on its own, so linearity — the template's whole argument — is
    never used."""
    red, blue, rate = int(p["red"]), int(p["blue"]), int(p["rate"])
    total = Fraction(0)
    for i in range(1, red + 1):
        for j in range(1, blue + 1):
            total += Fraction(rate * (i + j))
    return float(total / (red * blue))


def labeled_tickets_draw_exact(p):
    n, first, gap = int(p["n"]), int(p["first"]), int(p["gap"])
    steps = n - 1
    last = first + gap * steps
    pair_steps = (n * steps) / 2
    sum_incr = gap * pair_steps
    return {
        "steps": steps,
        "last": last,
        "pairSteps": pair_steps,
        "sumIncr": sum_incr,
        "total": n * first + sum_incr,
        "mean": (first + last) / 2,
    }


def labeled_tickets_draw_brute(p):
    """Read the stack one ticket at a time, building each label from scratch, and average
    them. Neither the midpoint shortcut nor the arithmetic-series sum appears here."""
    n, first, gap = int(p["n"]), int(p["first"]), int(p["gap"])
    total = Fraction(0)
    for i in range(n):
        total += Fraction(first + gap * i)
    return float(total / n)


def profit_net_of_cost_exact(p):
    slots, winners = int(p["slots"]), int(p["winners"])
    prize, cost = int(p["prize"]), int(p["cost"])
    return {
        "pWin": winners / slots,
        "payoutLeg": (winners * prize) / slots,
        "losers": slots - winners,
        "ev": (winners * prize) / slots - cost,
    }


def profit_net_of_cost_brute(p):
    """Enumerate the envelopes and charge the price inside each branch, so the cost is
    never subtracted once at the end the way the template does it. No probability is
    formed either — every envelope is simply one atom of the average."""
    slots, winners = int(p["slots"]), int(p["winners"])
    prize, cost = int(p["prize"]), int(p["cost"])
    total = Fraction(0)
    for idx in range(slots):
        total += Fraction(prize - cost) if idx < winners else Fraction(-cost)
    return float(total / slots)


def binomial_mean_exact(p):
    bids, fill = int(p["bids"]), int(p["fillPct"])
    return {
        "p": fill / 100,
        "half": bids / 2,
        "ev": (bids * fill) / 100,
    }


def binomial_mean_brute(p):
    """Build the full distribution of the fill count by convolving one bid in at a time,
    then read its mean off as the sum of k times its probability. The count of trials is
    never multiplied by the fill rate, so n*p is nowhere in this derivation."""
    bids, fill = int(p["bids"]), int(p["fillPct"])
    q = Fraction(fill, 100)
    pmf = [Fraction(1)]
    for _ in range(bids):
        nxt = [Fraction(0)] * (len(pmf) + 1)
        for k, mass in enumerate(pmf):
            nxt[k] += mass * (1 - q)
            nxt[k + 1] += mass * q
        pmf = nxt
    assert sum(pmf) == 1
    return float(sum(k * mass for k, mass in enumerate(pmf)))


def indicator_match_count_exact(p):
    guests, friends, bounty = int(p["guests"]), int(p["friends"]), int(p["bounty"])
    return {
        "perGuest": 1 / guests,
        "others": guests - 1,
        "waysFixed": factorial(guests - 1),
        "waysAll": factorial(guests),
        "ev": (bounty * friends) / guests,
    }


def indicator_match_count_brute(p):
    """Enumerate every ordering of the coats and pay the kitty out inside each ordering. No
    per-guest probability is formed and nothing is multiplied by the group size, so the
    linearity argument the template rests on is never invoked; the payout is applied per
    match as the orderings are walked rather than scaled onto a finished expectation."""
    guests, friends, bounty = int(p["guests"]), int(p["friends"]), int(p["bounty"])
    kitty = 0
    orderings = 0
    for perm in permutations(range(guests)):
        orderings += 1
        for seat in range(friends):
            if perm[seat] == seat:
                kitty += bounty
    return float(Fraction(kitty, orderings))




def two_outcome_variance_exact(p):
    win_pct, w, loss = int(p["winPct"]), int(p["w"]), int(p["l"])
    lose_pct = 100 - win_pct
    gap = w + loss
    return {
        "losePct": lose_pct,
        "gap": gap,
        "mean": (win_pct * w - lose_pct * loss) / 100,
        "devWin": (lose_pct * gap) / 100,
        "devLose": (win_pct * gap) / 100,
        "capVar": (gap * gap) / 4,
        "varProfit": (win_pct * lose_pct * gap * gap) / 10000,
    }


def two_outcome_variance_brute(p):
    """Take the two branches as an outcome list, find the mean by averaging it, then average
    the squared distances from that mean. The template's route — locating each branch's
    distance from the mean algebraically as a share of the gap — is never used, and neither
    is any p(1-p)(w+l) squared shortcut; the gap between the two outcomes is never formed."""
    win_pct, w, loss = int(p["winPct"]), int(p["w"]), int(p["l"])
    branches = [(Fraction(win_pct, 100), Fraction(w)), (Fraction(100 - win_pct, 100), Fraction(-loss))]
    assert sum(prob for prob, _ in branches) == 1
    mean = sum(prob * val for prob, val in branches)
    return float(sum(prob * (val - mean) ** 2 for prob, val in branches))


def spinner_pmf_variance_exact(p):
    pct_a, pct_b = int(p["pctA"]), int(p["pctB"])
    v_a, v_b, v_c = int(p["vA"]), int(p["vB"]), int(p["vC"])
    pct_c = 100 - pct_a - pct_b
    t_a, t_b, t_c = pct_a / 10, pct_b / 10, pct_c / 10
    mean = (t_a * v_a + t_b * v_b + t_c * v_c) / 10
    mean_sq = (t_a * v_a * v_a + t_b * v_b * v_b + t_c * v_c * v_c) / 10
    return {
        "pctC": pct_c,
        "tA": t_a,
        "tB": t_b,
        "tC": t_c,
        "mean": mean,
        "meanSq": mean_sq,
        "dAB": abs(v_a - v_b),
        "dAC": abs(v_a - v_c),
        "dBC": abs(v_b - v_c),
        "varPay": mean_sq - mean * mean,
    }


def spinner_pmf_variance_brute(p):
    """Lay the rim out as its ten equal slices, one entry per slice carrying that slice's
    payout, and average the squared distances from the mean of the list. Neither the
    computational formula the template uses nor the pairwise identity its Sanity check uses
    appears here — this is the definition, walked over the sectors."""
    pct_a, pct_b = int(p["pctA"]), int(p["pctB"])
    v_a, v_b, v_c = int(p["vA"]), int(p["vB"]), int(p["vC"])
    pct_c = 100 - pct_a - pct_b
    slices = [v_a] * (pct_a // 10) + [v_b] * (pct_b // 10) + [v_c] * (pct_c // 10)
    assert len(slices) == 10
    mean = sum(Fraction(v) for v in slices) / 10
    return float(sum((Fraction(v) - mean) ** 2 for v in slices) / 10)


def affine_scaling_sd_exact(p):
    n, scale = int(p["n"]), int(p["scale"])
    spread = scale * (n - 1)
    return {
        "varDraw": (n * n - 1) / 12,
        "varPay": (scale * scale * (n * n - 1)) / 12,
        "spread": spread,
        "halfSpread": spread / 2,
        "quarterSpread": spread / 4,
        "sd": ((scale * scale * (n * n - 1)) / 12) ** 0.5,
    }


def affine_scaling_sd_brute(p):
    """Transform every ball into its payout first, then measure the spread of the transformed
    list from scratch. Neither the uniform-variance formula nor the scale-squared rule is used:
    the flat add-on is genuinely carried through every outcome, so if it did move the spread
    this would show it."""
    n, scale, bonus = int(p["n"]), int(p["scale"]), int(p["bonus"])
    payouts = [Fraction(scale * k + bonus) for k in range(1, n + 1)]
    mean = sum(payouts) / n
    var = sum((x - mean) ** 2 for x in payouts) / n
    return float(var) ** 0.5


def push_branch_bet_exact(p):
    win_pct, draw_pct = int(p["winPct"]), int(p["drawPct"])
    payout, stake = int(p["payout"]), int(p["stake"])
    loss_pct = 100 - win_pct - draw_pct
    return {
        "lossPct": loss_pct,
        "winLegNum": win_pct * payout,
        "lossLegNum": loss_pct * stake,
        "fairPayout": (loss_pct * stake) / win_pct,
        "ev": (win_pct * payout - loss_pct * stake) / 100,
    }


def push_branch_bet_brute(p):
    """Lay the match out as a hundred equally likely hundredths, each carrying the profit of
    whichever branch it belongs to — including the refunded ones, which carry a profit of zero
    and are counted rather than dropped — and average across the hundred. No probability is
    formed and no branch is weighted."""
    win_pct, draw_pct = int(p["winPct"]), int(p["drawPct"])
    payout, stake = int(p["payout"]), int(p["stake"])
    outcomes = [Fraction(payout)] * win_pct + [Fraction(0)] * draw_pct
    outcomes += [Fraction(-stake)] * (100 - win_pct - draw_pct)
    assert len(outcomes) == 100
    return float(sum(outcomes) / 100)


def sum_of_bets_variance_exact(p):
    pct1, pct2 = int(p["pct1"]), int(p["pct2"])
    w1, l1, w2, l2 = int(p["w1"]), int(p["l1"]), int(p["w2"]), int(p["l2"])
    gap1, gap2 = w1 + l1, w2 + l2
    var1 = (pct1 * (100 - pct1) * gap1 * gap1) / 10000
    var2 = (pct2 * (100 - pct2) * gap2 * gap2) / 10000
    return {
        "q1": 100 - pct1,
        "q2": 100 - pct2,
        "gap1": gap1,
        "gap2": gap2,
        "var1": var1,
        "var2": var2,
        "sd1": var1 ** 0.5,
        "sd2": var2 ** 0.5,
        "sdSum": var1 ** 0.5 + var2 ** 0.5,
        "sdTotal": (var1 + var2) ** 0.5,
        "varTotal": var1 + var2,
    }


def sum_of_bets_variance_brute(p):
    """Enumerate the four joint outcomes of the two bets, form the total profit in each, and
    read the variance off as the mean of the squared total less the square of the mean total.
    Neither bet's own variance is ever computed, so the additivity the template rests on is
    never invoked."""
    pct1, pct2 = int(p["pct1"]), int(p["pct2"])
    w1, l1, w2, l2 = int(p["w1"]), int(p["l1"]), int(p["w2"]), int(p["l2"])
    cells = []
    for prob_a, val_a in ((Fraction(pct1, 100), w1), (Fraction(100 - pct1, 100), -l1)):
        for prob_b, val_b in ((Fraction(pct2, 100), w2), (Fraction(100 - pct2, 100), -l2)):
            cells.append((prob_a * prob_b, Fraction(val_a + val_b)))
    assert sum(prob for prob, _ in cells) == 1
    mean = sum(prob * tot for prob, tot in cells)
    mean_sq = sum(prob * tot * tot for prob, tot in cells)
    return float(mean_sq - mean * mean)


def urn_choice_total_expectation_exact(p):
    box_pct, red_a, red_b, prize = int(p["boxPct"]), int(p["redA"]), int(p["redB"]), int(p["prize"])
    other_pct = 100 - box_pct
    ev_a = (red_a * prize) / 10
    ev_b = (red_b * prize) / 10
    return {
        "otherPct": other_pct,
        "evA": ev_a,
        "evB": ev_b,
        "plainAvg": (ev_a + ev_b) / 2,
        "ev": (box_pct * ev_a + other_pct * ev_b) / 100,
    }


def urn_choice_total_expectation_brute(p):
    """Flatten the tree: one entry per (box, chip) path carrying that path's own probability
    and payout, then take a single expectation across the twenty of them. No box is valued on
    its own, so the conditioning step the template turns on never happens here."""
    box_pct, red_a, red_b, prize = int(p["boxPct"]), int(p["redA"]), int(p["redB"]), int(p["prize"])
    paths = []
    for pct, reds in ((box_pct, red_a), (100 - box_pct, red_b)):
        for chip in range(10):
            paths.append((Fraction(pct, 100) * Fraction(1, 10), Fraction(prize if chip < reds else 0)))
    assert len(paths) == 20 and sum(prob for prob, _ in paths) == 1
    return float(sum(prob * pay for prob, pay in paths))


def max_of_two_dice_brute(p):
    """Walk all the ordered pairs, take the larger face in each, pay the rate on it and charge
    the fee inside the pair, then average. Nothing is counted by level and no closed form for
    the sum of squares appears — the counting argument the template runs on is never used."""
    faces, rate, fee = int(p["faces"]), int(p["rate"]), int(p["fee"])
    total = Fraction(0)
    for i in range(1, faces + 1):
        for j in range(1, faces + 1):
            total += Fraction(rate * max(i, j) - fee)
    return float(total / (faces * faces))


def max_of_two_dice_exact(p):
    faces, rate, fee = int(p["faces"]), int(p["rate"]), int(p["fee"])
    sq_below = ((faces - 1) * faces * (2 * faces - 1)) / 6
    top_numer = faces * faces * faces - sq_below
    pairs = faces * faces
    return {
        "sqBelow": sq_below,
        "topNumer": top_numer,
        "lowNumer": (faces + 1) * pairs - top_numer,
        "topMean": top_numer / pairs,
        "lowMean": ((faces + 1) * pairs - top_numer) / pairs,
        "singleMean": (faces + 1) / 2,
        "evSingle": (rate * (faces + 1)) / 2 - fee,
        "ev": (rate * top_numer) / pairs - fee,
    }


def one_optional_reroll_exact(p):
    faces, floor_, rate = int(p["faces"]), int(p["floor"]), int(p["rate"])
    stand_count = faces - floor_ + 1
    toss_count = floor_ - 1
    points_numer = stand_count * (floor_ + faces) + toss_count * (faces + 1)
    return {
        "standCount": stand_count,
        "tossCount": toss_count,
        "standMean": (floor_ + faces) / 2,
        "freshMean": (faces + 1) / 2,
        "pointsNumer": points_numer,
        "points": points_numer / (2 * faces),
        "evNoRule": (rate * (faces + 1)) / 2,
        "ev": (rate * points_numer) / (2 * faces),
    }


def one_optional_reroll_brute(p):
    """Walk the whole outcome tree the rule creates — every first roll, and for the ones it
    throws out every second roll underneath — and average the payout over the leaves. Neither
    branch is averaged on its own and no conditional midpoint is formed, which is exactly the
    step the template's derivation depends on."""
    faces, floor_, rate = int(p["faces"]), int(p["floor"]), int(p["rate"])
    total = Fraction(0)
    leaf = Fraction(1, faces)
    for first in range(1, faces + 1):
        if first >= floor_:
            total += leaf * Fraction(rate * first)
        else:
            for second in range(1, faces + 1):
                total += leaf * Fraction(1, faces) * Fraction(rate * second)
    return float(total)

def geometric_waiting_time_exact(p):
    faces, k, cost = int(p["faces"]), int(p["k"]), int(p["cost"])
    win_faces = faces - k + 1
    return {
        "winFaces": win_faces,
        "missFaces": k - 1,
        "pEnd": win_faces / faces,
        "rolls": faces / win_faces,
        "evEasier": (cost * faces) / (win_faces + 1),
        "spend": (cost * faces) / win_faces,
    }


def geometric_waiting_time_brute(p):
    """Assemble the first-step equation by walking the faces of one roll — each face pays its
    share of a roll's cost, and a miss additionally carries the whole unknown back to the
    right-hand side — then solve the resulting linear equation in a single unknown. The
    reciprocal faces/winFaces is never formed. A truncated series over the wait distribution is
    computed as a second reading and asserted to agree; its tail is cut far below the 1e-9
    verify.py compares at."""
    faces, k, cost = int(p["faces"]), int(p["k"]), int(p["cost"])
    coeff = Fraction(1)   # what multiplies the unknown once the misses are folded in
    const = Fraction(0)   # what does not
    for face in range(1, faces + 1):
        share = Fraction(1, faces)
        const += share * cost
        if face < k:
            coeff -= share
    solved = const / coeff

    q = (k - 1) / faces
    hit = 1 - q
    series, prob, n = 0.0, hit, 1
    while n < 100000:
        series += n * prob * cost
        prob *= q
        if q ** n * cost * (n + 1 / hit) < 1e-12:
            break
        n += 1
    assert abs(series - float(solved)) < 1e-9, (series, float(solved))
    return float(solved)


def hypergeometric_mean_exact(p):
    pool, special, draws, rate = int(p["pool"]), int(p["special"]), int(p["draws"]), int(p["rate"])
    plain = pool - special
    return {
        "plain": plain,
        "perDraw": special / pool,
        "meanWin": (draws * special) / pool,
        "meanPlain": (draws * plain) / pool,
        "maxPay": rate * draws,
        "ev": (rate * draws * special) / pool,
    }


def hypergeometric_mean_brute(p):
    """Enumerate every combination of tickets that could come out of the box, count the winners
    inside each one, and average the payout over the combinations. No per-ticket probability is
    formed and linearity is never invoked — the dependence between draws is carried explicitly
    by the enumeration, which is exactly the step the template's argument sidesteps."""
    pool, special, draws, rate = int(p["pool"]), int(p["special"]), int(p["draws"]), int(p["rate"])
    tickets = [1] * special + [0] * (pool - special)
    total, seen = Fraction(0), 0
    for combo in combinations(range(pool), draws):
        total += Fraction(rate * sum(tickets[i] for i in combo))
        seen += 1
    return float(total / seen)


def capped_payoff_exact(p):
    faces, cap_face, rate = int(p["faces"]), int(p["capFace"]), int(p["rate"])
    capped_faces = faces - cap_face
    cap = rate * cap_face
    low_total = (rate * cap_face * (cap_face + 1)) / 2
    high_total = capped_faces * cap
    return {
        "cap": cap,
        "cappedFaces": capped_faces,
        "lowTotal": low_total,
        "highTotal": high_total,
        "evUncapped": (rate * (faces + 1)) / 2,
        "ev": (low_total + high_total) / faces,
    }


def capped_payoff_brute(p):
    """Walk the faces one at a time, apply the cap inside each face's own payout, and average
    over the faces. The face at which the cap starts to bite is never located and no run of
    consecutive numbers is ever summed in closed form, which is the whole of the template's
    derivation."""
    faces, cap_face, rate = int(p["faces"]), int(p["capFace"]), int(p["rate"])
    cap = rate * cap_face
    total = Fraction(0)
    for face in range(1, faces + 1):
        total += Fraction(min(rate * face, cap))
    return float(total / faces)


def insurance_break_even_premium_exact(p):
    minor_pct, total_pct = int(p["minorPct"]), int(p["totalPct"])
    minor, total, admin = int(p["minor"]), int(p["total"]), int(p["admin"])
    minor_leg = (minor_pct * minor) / 100
    total_leg = (total_pct * total) / 100
    premium = minor_leg + total_leg + admin
    return {
        "noClaimPct": 100 - minor_pct - total_pct,
        "minorLeg": minor_leg,
        "totalLeg": total_leg,
        "expPayout": minor_leg + total_leg,
        "collect100": 100 * premium,
        "payOut100": minor_pct * minor + total_pct * total + 100 * admin,
        "premium": premium,
    }


def insurance_break_even_premium_brute(p):
    """Lay the policy out as a hundred equally likely policy-years, each carrying the payout of
    whichever branch it belongs to, and average across them. Then SOLVE for the break-even
    price rather than assembling it: evaluate the insurer's profit line at two prices and take
    its root. Nothing here adds an admin cost onto an expected payout."""
    minor_pct, total_pct = int(p["minorPct"]), int(p["totalPct"])
    minor, total, admin = int(p["minor"]), int(p["total"]), int(p["admin"])
    years = [Fraction(0)] * (100 - minor_pct - total_pct)
    years += [Fraction(minor)] * minor_pct + [Fraction(total)] * total_pct
    assert len(years) == 100
    mean_payout = sum(years) / 100

    def profit(price):
        return price - mean_payout - admin

    at0, at1 = profit(Fraction(0)), profit(Fraction(1))
    return float(-at0 / (at1 - at0))   # profit is linear in the price, so this root is exact



def distinct_types_collected_exact(p):
    types, draws, rate = int(p["types"]), int(p["draws"]), int(p["rate"])
    all_numer = types ** draws
    miss_numer = (types - 1) ** draws
    return {
        "allNumer": all_numer,
        "missNumer": miss_numer,
        "pMiss": miss_numer / all_numer,
        "distinct": (types * (all_numer - miss_numer)) / all_numer,
        "missing": (types * miss_numer) / all_numer,
        "mostHeld": min(types, draws),
        "capPay": rate * min(types, draws),
        "ev": (rate * types * (all_numer - miss_numer)) / all_numer,
    }


def distinct_types_collected_brute(p):
    """Enumerate every sequence of packs the promotion could deal, count the distinct designs
    inside each one directly, and average over the sequences. No design is ever considered on
    its own and no missing-design probability is formed, so neither the indicator argument nor
    the power that the template turns on appears here."""
    types, draws, rate = int(p["types"]), int(p["draws"]), int(p["rate"])
    seen = 0
    total = 0
    for seq in product(range(types), repeat=draws):
        total += len(set(seq))
        seen += 1
    return float(Fraction(rate * total, seen))


def binomial_variance_exact(p):
    trials, win_pct = int(p["trials"]), int(p["winPct"])
    loss_pct = 100 - win_pct
    return {
        "lossPct": loss_pct,
        "mean": (trials * win_pct) / 100,
        "oneVar": (win_pct * loss_pct) / 10000,
        "capVar": trials / 4,
        "varCount": (trials * win_pct * loss_pct) / 10000,
    }


def binomial_variance_brute(p):
    """Build the whole distribution of the day's count by convolving one auction into it at a
    time, then read the spread straight off that distribution as the probability-weighted
    squared distance from its own mean. Neither the per-trial spread nor its multiplication by
    the trial count — the template's entire argument — is used, and npq never appears."""
    trials, win_pct = int(p["trials"]), int(p["winPct"])
    win, lose = Fraction(win_pct, 100), Fraction(100 - win_pct, 100)
    pmf = [Fraction(1)]
    for _ in range(trials):
        nxt = [Fraction(0)] * (len(pmf) + 1)
        for i, pr in enumerate(pmf):
            nxt[i] += pr * lose
            nxt[i + 1] += pr * win
        pmf = nxt
    assert sum(pmf) == 1 and len(pmf) == trials + 1
    mu = sum(i * pr for i, pr in enumerate(pmf))
    return float(sum(pr * (i - mu) ** 2 for i, pr in enumerate(pmf)))


def equal_ev_sd_comparison_exact(p):
    faces, m, k = int(p["faces"]), int(p["m"]), int(p["k"])
    prize = (faces * m) / k
    var_coin = m * m
    mean_sq_die = (k * prize * prize) / faces
    return {
        "prize": prize,
        "coinPay": 2 * m,
        "varCoin": var_coin,
        "meanSqDie": mean_sq_die,
        "blankFaces": faces - k,
        "varDie": mean_sq_die - var_coin,
        "sdDie": (mean_sq_die - var_coin) ** 0.5,
    }


def equal_ev_sd_comparison_brute(p):
    """Lay out each game's outcomes one per equally likely side or face, compute each game's
    own mean and its mean squared deviation from that mean, and return the larger spread. The
    two games are compared rather than assumed — the answer is whichever game the enumeration
    finds riskier — and no closed form for either variance is used."""
    faces, m, k = int(p["faces"]), int(p["m"]), int(p["k"])
    prize = Fraction(faces * m, k)

    def spread(outcomes):
        n = len(outcomes)
        mean = sum(outcomes) / n
        return mean, sum((x - mean) ** 2 for x in outcomes) / n

    mean_coin, var_coin = spread([Fraction(2 * m), Fraction(0)])
    mean_die, var_die = spread([prize] * k + [Fraction(0)] * (faces - k))
    assert mean_coin == mean_die == m, (mean_coin, mean_die)
    return float(max(var_coin, var_die)) ** 0.5


SOLVERS = {
    "ev-variance/two-outcome-bet": {"exact": two_outcome_bet_exact, "brute": two_outcome_bet_brute},
    "ev-variance/die-payoff-table": {"exact": die_payoff_table_exact, "brute": die_payoff_table_brute},
    "ev-variance/raffle-fair-price": {"exact": raffle_fair_price_exact, "brute": raffle_fair_price_brute},
    "ev-variance/sum-of-two-draws": {"exact": sum_of_two_draws_exact, "brute": sum_of_two_draws_brute},
    "ev-variance/labeled-tickets-draw": {"exact": labeled_tickets_draw_exact, "brute": labeled_tickets_draw_brute},
    "ev-variance/profit-net-of-cost": {"exact": profit_net_of_cost_exact, "brute": profit_net_of_cost_brute},
    "ev-variance/binomial-mean": {"exact": binomial_mean_exact, "brute": binomial_mean_brute},
    "ev-variance/indicator-match-count": {"exact": indicator_match_count_exact, "brute": indicator_match_count_brute},
    "ev-variance/two-outcome-variance": {"exact": two_outcome_variance_exact, "brute": two_outcome_variance_brute},
    "ev-variance/spinner-pmf-variance": {"exact": spinner_pmf_variance_exact, "brute": spinner_pmf_variance_brute},
    "ev-variance/affine-scaling-sd": {"exact": affine_scaling_sd_exact, "brute": affine_scaling_sd_brute},
    "ev-variance/push-branch-bet": {"exact": push_branch_bet_exact, "brute": push_branch_bet_brute},
    "ev-variance/sum-of-bets-variance": {"exact": sum_of_bets_variance_exact, "brute": sum_of_bets_variance_brute},
    "ev-variance/urn-choice-total-expectation": {"exact": urn_choice_total_expectation_exact, "brute": urn_choice_total_expectation_brute},
    "ev-variance/max-of-two-dice": {"exact": max_of_two_dice_exact, "brute": max_of_two_dice_brute},
    "ev-variance/one-optional-reroll": {"exact": one_optional_reroll_exact, "brute": one_optional_reroll_brute},
    "ev-variance/geometric-waiting-time": {"exact": geometric_waiting_time_exact, "brute": geometric_waiting_time_brute},
    "ev-variance/hypergeometric-mean": {"exact": hypergeometric_mean_exact, "brute": hypergeometric_mean_brute},
    "ev-variance/capped-payoff": {"exact": capped_payoff_exact, "brute": capped_payoff_brute},
    "ev-variance/insurance-break-even-premium": {"exact": insurance_break_even_premium_exact, "brute": insurance_break_even_premium_brute},
    "ev-variance/distinct-types-collected": {"exact": distinct_types_collected_exact, "brute": distinct_types_collected_brute},
    "ev-variance/binomial-variance": {"exact": binomial_variance_exact, "brute": binomial_variance_brute},
    "ev-variance/equal-ev-sd-comparison": {"exact": equal_ev_sd_comparison_exact, "brute": equal_ev_sd_comparison_brute},
}
