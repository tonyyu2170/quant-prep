"""Independent Python counterparts for content/problems/markov/*.
exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).
It is MEANT to mirror the template's derivation — that mirroring is the check.
brute(): recomputes the ANSWER by building the Markov chain and solving it, never
by re-calling the template's closed form. Every chain here is small and every
answer is rational, so the solves run over `Fraction` and land exactly on the
1e-9 ABSOLUTE tolerance verify.py applies to brute-force results."""

from fractions import Fraction


def _solve(rows, rhs):
    """Exact Gaussian elimination over Fractions. rows is a square matrix of
    coefficients, rhs the right-hand side; returns the solution vector."""
    n = len(rows)
    a = [[Fraction(x) for x in rows[i]] + [Fraction(rhs[i])] for i in range(n)]
    for col in range(n):
        piv = next(r for r in range(col, n) if a[r][col] != 0)
        a[col], a[piv] = a[piv], a[col]
        inv = a[col][col]
        a[col] = [x / inv for x in a[col]]
        for r in range(n):
            if r != col and a[r][col] != 0:
                f = a[r][col]
                a[r] = [x - f * y for x, y in zip(a[r], a[col])]
    return [a[i][n] for i in range(n)]


def _stationary(p_ab, p_ba):
    """Stationary probability of state A in the two-state chain with A->B rate
    p_ab and B->A rate p_ba. Solved as a balance equation, not as a ratio."""
    # pi_A * p_ab = pi_B * p_ba and pi_A + pi_B = 1
    pi_a, _pi_b = _solve([[p_ab, -p_ba], [1, 1]], [0, 1])
    return pi_a


def _ipow(b, e):
    r = 1
    for _ in range(e):
        r *= b
    return r


def consecutive_run_wait_exact(p):
    hits, out_of, k = int(p["hitsPer"]), int(p["outOf"]), int(p["runLength"])
    misses = out_of - hits
    wk = _ipow(hits, k)
    nk = _ipow(out_of, k)
    return {
        "misses": misses,
        "wk": wk,
        "nk": nk,
        "gap": nk - wk,
        "answer": out_of * (nk - wk) / (wk * misses),
        "prob": hits / out_of,
        "runProb": wk / nk,
        "runFloor": nk / wk,
    }


def consecutive_run_wait_brute(p):
    """E[spins to first run of k wins], from the run-length chain: state j is
    "j wins in a row so far", a win advances, a loss resets to 0."""
    k = int(p["runLength"])
    q = Fraction(int(p["hitsPer"]), int(p["outOf"]))
    # unknowns E_0..E_{k-1}; E_j = 1 + q*E_{j+1} + (1-q)*E_0, and E_k = 0
    rows, rhs = [], []
    for j in range(k):
        row = [Fraction(0)] * k
        row[j] += 1
        if j + 1 < k:
            row[j + 1] -= q
        row[0] -= 1 - q
        rows.append(row)
        rhs.append(1)
    return float(_solve(rows, rhs)[0])


def deuce_win_by_two_exact(p):
    won, played = int(p["pointsWon"]), int(p["pointsPlayed"])
    lost = played - won
    prob = won / played
    win_sq = won * won
    lost_sq = lost * lost
    decided = win_sq + lost_sq
    return {
        "lost": lost,
        "prob": prob,
        "lossProb": 1 - prob,
        "winSq": win_sq,
        "lostSq": lost_sq,
        "decided": decided,
        "answer": win_sq / decided,
        "decidedProb": decided / (played * played),
        "splitProb": (2 * won * lost) / (played * played),
    }


def deuce_win_by_two_brute(p):
    """Three-state absorbing chain on {deuce, advantage Ana, advantage rival},
    solved for P(Ana wins | deuce)."""
    q = Fraction(int(p["pointsWon"]), int(p["pointsPlayed"]))
    r = 1 - q
    # x_D = q*x_A + r*x_B ; x_A = q*1 + r*x_D ; x_B = q*x_D + r*0
    x_d, _x_a, _x_b = _solve(
        [[1, -q, -r], [-r, 1, 0], [-q, 0, 1]],
        [0, q, 0],
    )
    return float(x_d)


def machine_uptime_stationary_exact(p):
    fail, fix, days = int(p["failPct"]), int(p["fixPct"]), int(p["days"])
    total = fail + fix
    return {
        "total": total,
        "share": fix / total,
        "failRate": fail / 100,
        "fixRate": fix / 100,
        "halfHorizon": days / 2,
        "answer": days * fix / total,
        "stalledDays": days * fail / total,
        "oddsUp": fix / fail,
    }


def machine_uptime_stationary_brute(p):
    """Long-run live days = horizon x stationary P(live), from the balance
    equation of the live/stalled chain."""
    pi_live = _stationary(Fraction(int(p["failPct"]), 100), Fraction(int(p["fixPct"]), 100))
    return float(int(p["days"]) * pi_live)


def maze_food_before_trap_exact(p):
    a, b = int(p["doorsA"]), int(p["doorsB"])
    denom = a + b - 1
    return {
        "denom": denom,
        "answer": b / denom,
        "equalDoorCase": a / (2 * a - 1),
        "equalDenom": 2 * a - 1,
        "fromB": ((b - 1) * b) / (b * denom),
        "backA": a - 1,
        "backB": b - 1,
    }


def maze_food_before_trap_brute(p):
    """Absorbing chain on {room A, room B} with absorbing food/trap: solve the
    hitting probabilities directly."""
    a, b = int(p["doorsA"]), int(p["doorsB"])
    # x_A = 1/a + (a-1)/a * x_B ; x_B = (b-1)/b * x_A
    x_a, _x_b = _solve(
        [[1, -Fraction(a - 1, a)], [-Fraction(b - 1, b), 1]],
        [Fraction(1, a), 0],
    )
    return float(x_a)


def switching_coins_share_exact(p):
    heads_a, heads_b = int(p["headsAPct"]), int(p["headsBPct"])
    tails_a = 100 - heads_a
    tails_b = 100 - heads_b
    total = tails_a + tails_b
    return {
        "tailsA": tails_a,
        "tailsB": tails_b,
        "total": total,
        "headsARate": heads_a / 100,
        "headsBRate": heads_b / 100,
        "tailsARate": tails_a / 100,
        "tailsBRate": tails_b / 100,
        "answer": tails_b / total,
        "shareB": tails_a / total,
    }


def switching_coins_share_brute(p):
    """Which coin is in hand is a two-state chain; you swap exactly on a tail,
    so the A->B rate is coin A's tail rate. Long-run share = stationary P(A)."""
    return float(
        _stationary(
            Fraction(100 - int(p["headsAPct"]), 100),
            Fraction(100 - int(p["headsBPct"]), 100),
        )
    )


def system_days_to_failure_exact(p):
    wear, brk, rep = int(p["wearPct"]), int(p["breakPct"]), int(p["repairPct"])
    total = brk + wear + rep
    return {
        "sum": total,
        "answer": (100 * total) / (wear * brk),
        "fromWorn": (100 * (wear + rep)) / (wear * brk),
        "daysToWear": 100 / wear,
        "wearRate": wear / 100,
        "breakRate": brk / 100,
        "repairRate": rep / 100,
    }


def system_days_to_failure_brute(p):
    """Expected days to absorption in {new, worn} -> failed, solved as a system
    of first-step equations."""
    w = Fraction(int(p["wearPct"]), 100)
    b = Fraction(int(p["breakPct"]), 100)
    r = Fraction(int(p["repairPct"]), 100)
    # E_new = 1 + (1-w)E_new + w E_worn ; E_worn = 1 + r E_new + (1-b-r) E_worn
    e_new, _e_worn = _solve([[w, -w], [-r, b + r]], [1, 1])
    return float(e_new)


def tunnel_doors_escape_exact(p):
    answer = int(p["exitHours"]) + int(p["loopOneHours"]) + int(p["loopTwoHours"])
    return {
        "answer": answer,
        "loopTotal": int(p["loopOneHours"]) + int(p["loopTwoHours"]),
        "meanStep": answer / 3,
    }


def tunnel_doors_escape_brute(p):
    """One recurrent state (the junction) with a memoryless uniform choice:
    solve the first-step equation rather than asserting the sum of the times."""
    e, l1, l2 = int(p["exitHours"]), int(p["loopOneHours"]), int(p["loopTwoHours"])
    third = Fraction(1, 3)
    # E = 1/3*e + 1/3*(l1 + E) + 1/3*(l2 + E)
    (val,) = _solve([[1 - 2 * third]], [third * e + third * l1 + third * l2])
    return float(val)


def two_state_after_k_days_exact(p):
    leave, ret, days = int(p["leavePct"]), int(p["returnPct"]), int(p["days"])
    total = leave + ret
    persist = 100 - total
    pk = _ipow(100, days)
    lk = _ipow(persist, days)
    numer = ret * pk + leave * lk
    denom = total * pk
    return {
        "total": total,
        "persist": persist,
        "pk": pk,
        "lk": lk,
        "numer": numer,
        "denom": denom,
        "answer": numer / denom,
        "stationary": ret / total,
        "decay": lk / pk,
        "leaveRate": leave / 100,
        "returnRate": ret / 100,
        "persistRate": persist / 100,
    }


def two_state_after_k_days_brute(p):
    """Push the distribution through the transition matrix one day at a time —
    no spectral decomposition, no stationary-plus-decay closed form."""
    leave = Fraction(int(p["leavePct"]), 100)
    ret = Fraction(int(p["returnPct"]), 100)
    calm, choppy = Fraction(1), Fraction(0)
    for _ in range(int(p["days"])):
        calm, choppy = calm * (1 - leave) + choppy * ret, calm * leave + choppy * (1 - ret)
    return float(calm)


SOLVERS = {
    "markov/consecutive-run-wait": {
        "exact": consecutive_run_wait_exact,
        "brute": consecutive_run_wait_brute,
    },
    "markov/deuce-win-by-two": {
        "exact": deuce_win_by_two_exact,
        "brute": deuce_win_by_two_brute,
    },
    "markov/machine-uptime-stationary": {
        "exact": machine_uptime_stationary_exact,
        "brute": machine_uptime_stationary_brute,
    },
    "markov/maze-food-before-trap": {
        "exact": maze_food_before_trap_exact,
        "brute": maze_food_before_trap_brute,
    },
    "markov/switching-coins-share": {
        "exact": switching_coins_share_exact,
        "brute": switching_coins_share_brute,
    },
    "markov/system-days-to-failure": {
        "exact": system_days_to_failure_exact,
        "brute": system_days_to_failure_brute,
    },
    "markov/tunnel-doors-escape": {
        "exact": tunnel_doors_escape_exact,
        "brute": tunnel_doors_escape_brute,
    },
    "markov/two-state-after-k-days": {
        "exact": two_state_after_k_days_exact,
        "brute": two_state_after_k_days_brute,
    },
}
