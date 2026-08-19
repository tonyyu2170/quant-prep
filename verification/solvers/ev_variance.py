"""Independent Python counterparts for content/problems/ev-variance/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry).
It is MEANT to mirror the template — that mirroring is the check — so it stays in
floats; a Fraction-based exact() would absorb a template that loses precision.
brute(): recomputes the ANSWER by enumerating the sample space, never by re-calling
the template's closed form. Only brute() carries the independence requirement, works
in Fraction where the space is rational, and returns float() explicitly."""

from fractions import Fraction
from itertools import permutations
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


SOLVERS = {
    "ev-variance/two-outcome-bet": {"exact": two_outcome_bet_exact, "brute": two_outcome_bet_brute},
    "ev-variance/die-payoff-table": {"exact": die_payoff_table_exact, "brute": die_payoff_table_brute},
    "ev-variance/raffle-fair-price": {"exact": raffle_fair_price_exact, "brute": raffle_fair_price_brute},
    "ev-variance/sum-of-two-draws": {"exact": sum_of_two_draws_exact, "brute": sum_of_two_draws_brute},
    "ev-variance/labeled-tickets-draw": {"exact": labeled_tickets_draw_exact, "brute": labeled_tickets_draw_brute},
    "ev-variance/profit-net-of-cost": {"exact": profit_net_of_cost_exact, "brute": profit_net_of_cost_brute},
    "ev-variance/binomial-mean": {"exact": binomial_mean_exact, "brute": binomial_mean_brute},
    "ev-variance/indicator-match-count": {"exact": indicator_match_count_exact, "brute": indicator_match_count_brute},
}
