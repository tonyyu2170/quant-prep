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

import numpy as np


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


def conditional_expectation_given_event_exact(p):
    faces, k, rate = int(p["faces"]), int(p["k"]), int(p["rate"])
    low_faces = k - 1
    pairs = faces * faces
    low_pairs = low_faces * low_faces
    total_all = pairs * (faces + 1)
    total_low = low_pairs * k
    good_pairs = pairs - low_pairs
    total_good = total_all - total_low
    return {
        "lowFaces": low_faces,
        "pairs": pairs,
        "lowPairs": low_pairs,
        "goodPairs": good_pairs,
        "totalAll": total_all,
        "totalLow": total_low,
        "totalGood": total_good,
        "plainPoints": faces + 1,
        "meanGiven": total_good / good_pairs,
        "evPlain": rate * (faces + 1),
        "evBoth": rate * (k + faces),
        "ev": (rate * total_good) / good_pairs,
    }


def conditional_expectation_given_event_brute(p):
    """Walk the grid of both dice, discard every combination the news forbids, and average the
    payout over the ones left, one at a time. Nothing is counted by complement, no pooled total
    is assembled and the unconditional average never appears — the template's entire route."""
    faces, k, rate = int(p["faces"]), int(p["k"]), int(p["rate"])
    kept = [rate * (x + y)
            for x in range(1, faces + 1)
            for y in range(1, faces + 1)
            if x >= k or y >= k]
    return float(Fraction(sum(kept), len(kept)))


def matching_indicators_variance_exact(p):
    diners, party, rate = int(p["diners"]), int(p["party"]), int(p["rate"])
    pairs = party * (party - 1)
    numer = party * (diners - 1) * (diners - 1) + pairs
    denom = diners * diners * (diners - 1)
    var_count = numer / denom
    indep_count = (party * (diners - 1)) / (diners * diners)
    return {
        "pairs": pairs,
        "numer": numer,
        "denom": denom,
        "pSelf": 1 / diners,
        "pNext": 1 / (diners - 1),
        "oneVar": (diners - 1) / (diners * diners),
        "pBoth": 1 / (diners * (diners - 1)),
        "cov": 1 / (diners * diners * (diners - 1)),
        "varCount": var_count,
        "indepPay": rate * rate * indep_count,
        "varPay": rate * rate * var_count,
    }


def matching_indicators_variance_brute(p):
    """Deal every delivery the runner could make — all permutations of the meals — count the
    party members who get their own inside each one, and take the spread of those payments
    straight from the definition, as the average squared distance from their own average. No
    indicator is isolated, no per-diner chance is formed and no covariance term is ever named,
    so neither the template's decomposition nor the Sanity check's mean-of-squares appears."""
    diners, party, rate = int(p["diners"]), int(p["party"]), int(p["rate"])
    hist = [0] * (party + 1)
    for perm in permutations(range(diners)):
        hist[sum(1 for i in range(party) if perm[i] == i)] += 1
    n = sum(hist)
    mean = Fraction(sum(rate * c * w for c, w in enumerate(hist)), n)
    return float(sum(w * (rate * c - mean) ** 2 for c, w in enumerate(hist)) / n)


def pattern_waiting_hh_ht_exact(p):
    clean_pct, repeat_dirty, cost = int(p["cleanPct"]), int(p["repeatDirty"]), int(p["cost"])
    dirty_pct = 100 - clean_pct
    r_pct = dirty_pct if repeat_dirty == 1 else clean_pct
    o_pct = 100 - r_pct
    flips = (100 * (r_pct + 100)) / (r_pct * r_pct)
    mix_flips = 10000 / (r_pct * o_pct)
    return {
        "dirtyPct": dirty_pct,
        "rPct": r_pct,
        "oPct": o_pct,
        "firstWait": 100 / r_pct,
        "flips": flips,
        "mixFlips": mix_flips,
        "mixSpend": cost * mix_flips,
        "twoRuns": 2 * cost,
        "spend": cost * flips,
    }


def pattern_waiting_hh_ht_brute(p):
    """Solve the rig's state graph instead of quoting a wait. The two states — nothing on the
    board, one target run on the board — give two equations in two unknowns, solved generically
    in exact rationals by Cramer's rule, so no rearranged closed form is typed anywhere. The
    same figure is then rebuilt a second way with no algebra in it at all: walk the state
    distribution forward run by run and add up the chance the rig is still going, which is the
    expected number of runs. The template's (1+r)/r^2 appears in neither."""
    clean_pct, repeat_dirty, cost = int(p["cleanPct"]), int(p["repeatDirty"]), int(p["cost"])
    r = Fraction(100 - clean_pct if repeat_dirty == 1 else clean_pct, 100)
    s = 1 - r
    # E0 = 1 + s*E0 + r*E1 ; E1 = 1 + s*E0 + r*0  ->  [[1-s, -r], [-s, 1]] x = [1, 1]
    a, b, c, d = 1 - s, -r, -s, Fraction(1)
    det = a * d - b * c
    e0 = (1 * d - b * 1) / det
    # Forward walk: sum over runs of the chance the rig has not yet shut down.
    v0, v1, total = 1.0, 0.0, 0.0
    rf = float(r)
    for _ in range(20000):
        alive = v0 + v1
        if alive < 1e-18:
            break
        total += alive
        v0, v1 = (1 - rf) * (v0 + v1), rf * v0
    assert abs(total - float(e0)) < 1e-9, (total, float(e0))
    return float(cost * e0)


def two_reroll_stopping_value_exact(p):
    n, rate = int(p["sectors"]), int(p["rate"])
    last_mean = (n + 1) / 2
    mid_low = int(last_mean // 1)
    mid_top_sum = (n * (n + 1) - mid_low * (mid_low + 1)) / 2
    mid_numer = 2 * mid_top_sum + mid_low * (n + 1)
    mid_value = mid_numer / (2 * n)
    top_low = int(mid_value // 1)
    top_top_sum = (n * (n + 1) - top_low * (top_low + 1)) / 2
    top_numer = 2 * n * top_top_sum + top_low * mid_numer
    return {
        "lastMean": last_mean,
        "midLow": mid_low,
        "midKeep": mid_low + 1,
        "midTopSum": mid_top_sum,
        "midNumer": mid_numer,
        "midValue": mid_value,
        "topLow": top_low,
        "topKeep": top_low + 1,
        "topTopSum": top_top_sum,
        "topNumer": top_numer,
        "topValue": top_numer / (2 * n * n),
        "evMid": (rate * mid_numer) / (2 * n),
        "bestNumer": 4 * n * n - (n - 1) * (n - 1),
        "evBest": (rate * (4 * n * n - (n - 1) * (n - 1))) / (4 * n),
        "ev": (rate * top_numer) / (2 * n * n),
    }


def two_reroll_stopping_value_brute(p):
    """Search the policy space instead of recursing backwards. A policy is the set of numbers
    it stops on at each stage, and a stage's value depends on its set only through how many
    numbers are in it and what they add up to — the value formula below reads nothing else off
    the set — so enumerating the achievable (count, sum) pairs covers all 2^n subsets without
    ever assuming the best set is a top slice or that a threshold rule is optimal. Those pairs
    are built by a subset-sum walk over the sectors. Stage two is maximised first because the
    first stage's value rises with it and its coefficient, the count of sectors thrown back,
    can never be negative; for a small enough spinner the two stages are then also searched
    JOINTLY over every pair of subsets, which tests that split rather than asserting it.
    Everything runs in integers scaled by twice the squared sector count, so no floor, no
    threshold and no stage-value formula from the template appears anywhere."""
    n, rate = int(p["sectors"]), int(p["rate"])
    classes = {(0, 0)}
    for x in range(1, n + 1):
        classes |= {(k + 1, s + x) for k, s in classes}
    # A second-spin policy stopping on k numbers totalling s is worth 2*s + (n-k)*(n+1),
    # scaled by 2n; a first-spin policy on top of it is worth 2n*s + (n-k)*that, scaled by 2n^2.
    best2 = max(2 * s + (n - k) * (n + 1) for k, s in classes)
    best3 = max(2 * n * s + (n - k) * best2 for k, s in classes)
    if n <= 8:
        subsets = [(bin(m).count("1"), sum(x for x in range(1, n + 1) if m >> (x - 1) & 1))
                   for m in range(1 << n)]
        joint = max(2 * n * s1 + (n - k1) * (2 * s2 + (n - k2) * (n + 1))
                    for k1, s1 in subsets for k2, s2 in subsets)
        assert joint == best3, (joint, best3)
    return float(Fraction(rate * best3, 2 * n * n))


def truncated_doubling_game_exact(p):
    rounds, stake = int(p["rounds"]), int(p["stake"])
    pot_mult = 2.0 ** rounds
    return {
        "potMult": pot_mult,
        "maxPay": stake * pot_mult,
        "pAll": 1 / pot_mult,
        "half": stake / 2,
        "ladder": (rounds * stake) / 2,
        "evShorter": ((rounds + 1) * stake) / 2,
        "ev": ((rounds + 2) * stake) / 2,
    }


def truncated_doubling_game_brute(p):
    """Walk the ladder rung by rung. The game ends on flip j when j-1 heads are followed by a
    tail, paying the pot as it stands then; one further branch survives the cap on all heads.
    Every branch's chance and pot is written out and the products summed in exact rationals, so
    the collapsed half-a-stake-per-round the template turns on never appears. For a cap short
    enough to enumerate, the same figure is rebuilt from every individual sequence of flips,
    which shares no line with the branch sum either."""
    rounds, stake = int(p["rounds"]), int(p["stake"])
    total = Fraction(0)
    for j in range(1, rounds + 1):
        total += Fraction(1, 2 ** j) * stake * 2 ** (j - 1)
    total += Fraction(1, 2 ** rounds) * stake * 2 ** rounds
    if rounds <= 12:
        each = Fraction(0)
        for seq in product((1, 0), repeat=rounds):   # 1 = head, 0 = tail
            heads = 0
            for flip in seq:
                if flip == 0:
                    break
                heads += 1
            each += Fraction(stake * 2 ** heads, 2 ** rounds)
        assert each == total, (each, total)
    return float(total)


def wald_random_sum_exact(p):
    boxes, items, rate = int(p["boxes"]), int(p["items"]), int(p["rate"])
    return {
        "meanBoxes": (boxes + 1) / 2,
        "meanItems": (items + 1) / 2,
        "meanTotalItems": ((boxes + 1) * (items + 1)) / 4,
        "lowTotal": (rate * (items + 1)) / 2,
        "highTotal": (rate * boxes * (items + 1)) / 2,
        "ev": (rate * (boxes + 1) * (items + 1)) / 4,
    }


def wald_random_sum_brute(p):
    """Enumerate the joint space: every delivery size, and inside each one every combination of
    box contents, each weighted by how often it happens. The total is summed over that whole
    space in exact rationals. No average count and no average box-load is ever formed, so the
    product of two expectations the template turns on plays no part in this figure."""
    boxes, items, rate = int(p["boxes"]), int(p["items"]), int(p["rate"])
    grand = Fraction(0)
    for n in range(1, boxes + 1):
        pile = 0
        for delivery in product(range(1, items + 1), repeat=n):
            pile += sum(delivery)
        grand += Fraction(rate * pile, boxes * items ** n)
    return float(grand)


def sampling_without_replacement_variance_exact(p):
    pool, faulty, draws = int(p["pool"]), int(p["faulty"]), int(p["draws"])
    sound = pool - faulty
    denom = pool * pool * (pool - 1)
    return {
        "sound": sound,
        "denom": denom,
        "pairsDrawn": draws * (draws - 1),
        "oneVar": (faulty * sound) / (pool * pool),
        "fpc": (pool - draws) / (pool - 1),
        "mean": (draws * faulty) / pool,
        "withRepl": (draws * faulty * sound) / (pool * pool),
        "varCount": (draws * faulty * sound * (pool - draws)) / denom,
    }


def sampling_without_replacement_variance_brute(p):
    """Lay out the drawer as labelled cables and enumerate every handful that could be pulled
    from it, counting the faulty ones inside each. The spread comes straight from the
    definition — the average squared distance from the average count — over that list of
    handfuls. No per-draw chance, no covariance and no finite-population correction is formed,
    so neither the template's factor nor the Sanity check's pairwise term appears here."""
    pool, faulty, draws = int(p["pool"]), int(p["faulty"]), int(p["draws"])
    cables = [1] * faulty + [0] * (pool - faulty)
    hist = [0] * (draws + 1)
    for handful in combinations(cables, draws):
        hist[sum(handful)] += 1
    n = sum(hist)
    mean = Fraction(sum(c * w for c, w in enumerate(hist)), n)
    return float(sum(w * (c - mean) ** 2 for c, w in enumerate(hist)) / n)



def chord_crossings_exact(p):
    chords, bounty = int(p["chords"]), int(p["bounty"])
    pairs = (chords * (chords - 1)) // 2
    return {"pairs": pairs, "numer": bounty * pairs, "ev": (bounty * pairs) / 3}


def chord_crossings_sim(p, rng):
    """Draw the chords and count the crossings geometrically: two chords cross exactly when one
    endpoint of the second falls inside the arc cut by the first and the other falls outside.
    Nothing here knows the one-third, which is the claim being checked.

    Trials are scaled by the pair count: the noisiest case relative to tolerance is the smallest
    board (few pairs), and that is also the cheapest one to run many times."""
    chords, bounty = int(p["chords"]), int(p["bounty"])
    pairs = (chords * (chords - 1)) // 2
    trials = min(2_000_000, max(30_000, int(4e7 / pairs)))
    idx_i, idx_j = np.triu_indices(chords, k=1)
    total = 0.0
    total_sq = 0.0
    done = 0
    chunk = max(1, min(20_000, trials))
    while done < trials:
        m = min(chunk, trials - done)
        ends = rng.random((m, chords, 2))
        lo = ends.min(axis=2)
        hi = ends.max(axis=2)
        b1 = ends[:, :, 0]
        b2 = ends[:, :, 1]
        in1 = (lo[:, idx_i] < b1[:, idx_j]) & (b1[:, idx_j] < hi[:, idx_i])
        in2 = (lo[:, idx_i] < b2[:, idx_j]) & (b2[:, idx_j] < hi[:, idx_i])
        counts = (in1 ^ in2).sum(axis=1).astype(np.float64)
        total += counts.sum()
        total_sq += (counts * counts).sum()
        done += m
    mean = total / trials
    var = max(total_sq / trials - mean * mean, 0.0)
    return bounty * mean, bounty * (var / trials) ** 0.5


def spread_of_three_spins_exact(p):
    sectors, rate = int(p["sectors"]), int(p["rate"])
    sq_minus = sectors * sectors - 1
    twice_s = 2 * sectors
    return {
        "sqMinus": sq_minus,
        "twiceS": twice_s,
        "meanMax": ((3 * sectors - 1) * (sectors + 1)) / (4 * sectors),
        "meanMin": ((sectors + 1) * (sectors + 1)) / (4 * sectors),
        "maxGap": sectors - 1,
        "meanRange": sq_minus / twice_s,
        "ev": (rate * sq_minus) / twice_s,
    }


def spread_of_three_spins_brute(p):
    """Enumerate all s^3 outcomes of the three spins and average the observed gap. No order
    statistics, no reflection argument."""
    sectors, rate = int(p["sectors"]), int(p["rate"])
    total = 0
    for a in range(1, sectors + 1):
        for b in range(1, sectors + 1):
            for c in range(1, sectors + 1):
                total += max(a, b, c) - min(a, b, c)
    return float(rate * Fraction(total, sectors ** 3))


def local_maxima_exact(p):
    days, bounty = int(p["days"]), int(p["bounty"])
    interior = days - 2
    return {"interior": interior, "numer": bounty * interior, "ev": (bounty * interior) / 3}


def local_maxima_brute(p):
    """Sum one indicator per interior day, and get each indicator's probability by enumerating
    the six relative orders of that day's three-price window rather than quoting one third."""
    days, bounty = int(p["days"]), int(p["bounty"])
    orders = list(permutations(range(3)))
    peak = Fraction(sum(1 for o in orders if o[1] == max(o)), len(orders))
    return float(bounty * sum(peak for _ in range(days - 2)))


def covariance_sum_difference_exact(p):
    a, b = int(p["facesA"]), int(p["facesB"])
    a_sq, b_sq = a * a, b * b
    return {
        "aSq": a_sq,
        "bSq": b_sq,
        "diffSq": a_sq - b_sq,
        "varA": (a_sq - 1) / 12,
        "varB": (b_sq - 1) / 12,
        "cov": (a_sq - b_sq) / 12,
    }


def covariance_sum_difference_brute(p):
    """Walk the whole a-by-b outcome grid and apply the definition of covariance to the two
    recorded quantities. No bilinearity expansion and no closed-form uniform variance."""
    a, b = int(p["facesA"]), int(p["facesB"])
    cells = a * b
    e_s = Fraction(0)
    e_d = Fraction(0)
    e_sd = Fraction(0)
    for x in range(1, a + 1):
        for y in range(1, b + 1):
            e_s += Fraction(x + y, cells)
            e_d += Fraction(x - y, cells)
            e_sd += Fraction((x + y) * (x - y), cells)
    return float(e_sd - e_s * e_d)

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
    "ev-variance/conditional-expectation-given-event": {"exact": conditional_expectation_given_event_exact, "brute": conditional_expectation_given_event_brute},
    "ev-variance/matching-indicators-variance": {"exact": matching_indicators_variance_exact, "brute": matching_indicators_variance_brute},
    "ev-variance/pattern-waiting-hh-ht": {"exact": pattern_waiting_hh_ht_exact, "brute": pattern_waiting_hh_ht_brute},
    "ev-variance/two-reroll-stopping-value": {"exact": two_reroll_stopping_value_exact, "brute": two_reroll_stopping_value_brute},
    "ev-variance/truncated-doubling-game": {"exact": truncated_doubling_game_exact, "brute": truncated_doubling_game_brute},
    "ev-variance/wald-random-sum": {"exact": wald_random_sum_exact, "brute": wald_random_sum_brute},
    "ev-variance/sampling-without-replacement-variance": {"exact": sampling_without_replacement_variance_exact, "brute": sampling_without_replacement_variance_brute},
    "ev-variance/chord-crossings": {
        "exact": chord_crossings_exact,
        "simulate": chord_crossings_sim,
    },
    "ev-variance/spread-of-three-spins": {
        "exact": spread_of_three_spins_exact,
        "brute": spread_of_three_spins_brute,
    },
    "ev-variance/local-maxima": {
        "exact": local_maxima_exact,
        "brute": local_maxima_brute,
    },
    "ev-variance/covariance-sum-difference": {
        "exact": covariance_sum_difference_exact,
        "brute": covariance_sum_difference_brute,
    },
}
