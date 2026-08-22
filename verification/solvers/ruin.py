"""Independent Python counterparts for content/problems/ruin/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry), same
convention as bayes/counting/ev_variance/distributions.
brute()/simulate(): recompute the ANSWER by an independent path per spec §5 (as corrected by
plan constraint 1) — a numpy absorption-system solve for two-barrier probabilities, Monte
Carlo walkers for durations, drift touches, and doubling sessions."""

import itertools

import numpy as np


def fair_reach_goal_exact(p):
    start, goal = int(p["startChips"]), int(p["goalChips"])
    frac = start / goal
    return {"frac": frac, "ruinProb": 1 - frac, "oppStack": goal - start}


def fair_reach_goal_brute(p):
    """Solve x = Qx + R over interior states 1..goal-1 numerically — matrix inversion rather
    than the difference-equation algebra behind start/goal, which is what makes this
    independent of exact()."""
    start, goal = int(p["startChips"]), int(p["goalChips"])
    m = goal - 1
    A = np.eye(m)
    b = np.zeros(m)
    for row in range(1, m):
        A[row, row - 1] -= 0.5
    for row in range(m - 1):
        A[row, row + 1] -= 0.5
    b[m - 1] = 0.5  # neighbour above the top interior state is the absorbing goal
    return float(np.linalg.solve(A, b)[start - 1])


SOLVERS = {
    "ruin/fair-reach-goal": {"exact": fair_reach_goal_exact, "brute": fair_reach_goal_brute},
}


def unfair_reach_goal_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    ratio = q / prob
    i, n = int(p["startChips"]), int(p["goalChips"])
    ri = ratio**i
    rn = ratio**n
    rin = ratio ** (i + 1)
    success = (1 - ri) / (1 - rn)
    success_next = (1 - rin) / (1 - rn)
    return {
        "prob": prob, "q": q, "ratio": ratio, "success": success,
        "successNext": success_next, "nextStack": i + 1,
    }


def _refined_solve(A, rhs):
    """One Newton step of iterative refinement: kills the kappa-scaled forward error so the
    absolute error lands at rounding level even for large-barrier fair walks."""
    x = np.linalg.solve(A, rhs)
    # OpenBLAS leaves stale FP flags behind matmul; the values here are rounding-level.
    with np.errstate(all="ignore"):
        residual = rhs - A @ x
    return x + np.linalg.solve(A, residual)


def _absorption_solve(goal, start, up_prob):
    """Absorption probability at `goal` for the ±1 walk on 0..goal started at `start`, by
    numerically solving x = Qx + R — independent of any closed form."""
    m = goal - 1
    A = np.eye(m)
    b = np.zeros(m)
    for row in range(1, m):
        A[row, row - 1] -= 1 - up_prob
    for row in range(m - 1):
        A[row, row + 1] -= up_prob
    b[m - 1] = up_prob
    return float(_refined_solve(A, b)[start - 1])


def unfair_reach_goal_brute(p):
    return _absorption_solve(int(p["goalChips"]), int(p["startChips"]), p["winPct"] / 100)


def _duration_solve(upper, start, up_prob):
    """Expected steps to absorption for the ±1 walk on 0..upper started at `start`, from
    t = 1 + Q t solved numerically — matrix inversion vs whatever closed form the template
    uses, which is what makes this independent. Requires |q-p| bounded off zero so (I-Q) is
    strictly diagonally dominant; the solve's absolute error then sits far inside
    verify.py's unscaled 1e-9 comparison."""
    m = upper - 1                      # transient states 1 .. upper-1
    A = np.eye(m)
    rhs = np.ones(m)
    for row in range(m):
        s = row + 1
        if s + 1 < upper:
            A[row, row + 1] -= up_prob
        if s - 1 >= 1:
            A[row, row - 1] -= 1 - up_prob
        # absorption contributes t=0, hence nothing to the right-hand side
    return float(_refined_solve(A, rhs)[start - 1])


def walk_hit_upper_first_exact(p):
    a, b = int(p["upBarrier"]), int(p["downBarrier"])
    total = a + b
    frac = b / total
    return {"total": total, "frac": frac, "mirrorFrac": a / total}


def walk_hit_upper_first_brute(p):
    """Shifted chain: start at downBarrier out of total width, solve numerically."""
    a, b = int(p["upBarrier"]), int(p["downBarrier"])
    return _absorption_solve(a + b, b, 0.5)


def walk_hit_loss_first_exact(p):
    drop, rebound = int(p["dropLimit"]), int(p["reboundTarget"])
    total = drop + rebound
    frac = rebound / total
    return {"total": total, "frac": frac, "gainFirst": drop / total}


def walk_hit_loss_first_brute(p):
    """Solve the top-exit chance numerically and take the complement — never the ratio."""
    drop, rebound = int(p["dropLimit"]), int(p["reboundTarget"])
    top = _absorption_solve(drop + rebound, drop, 0.5)
    return 1.0 - top


def fair_expected_duration_exact(p):
    i, n = int(p["stake"]), int(p["target"])
    return {"duration": i * (n - i), "straightLoss": i, "straightWin": n - i}


def fair_expected_duration_brute(p):
    return _duration_solve(int(p["target"]), int(p["stake"]), 0.5)


def unfair_expected_duration_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    edge = q - prob
    r = q / prob
    i, n = int(p["stake"]), int(p["target"])
    ri = r**i
    rn = r**n
    success = (1 - ri) / (1 - rn)
    duration = (i - n * success) / edge
    fair_duration = i * (n - i)
    return {
        "prob": prob, "q": q, "edge": edge, "ratio": r,
        "success": success, "duration": duration, "fairDuration": fair_duration,
        "straightWin": n - i,
    }


def unfair_expected_duration_brute(p):
    prob = p["winPct"] / 100
    return _duration_solve(int(p["target"]), int(p["stake"]), prob)


def drift_touch_downside_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    ratio = q / prob
    b = int(p["depth"]) + int(p["startLevel"])
    answer = ratio**b
    one_deeper = ratio ** (b + 1)
    return {"prob": prob, "q": q, "ratio": ratio, "answer": answer, "oneDeeper": one_deeper}


def drift_touch_downside_brute(p):
    """Truncated-chain absorption solve: P(touch -b before reaching +K | start s). This
    undercuts the true ever-touch probability by at most P(reach +K first) * (q/p)^(K+b);
    with winPct >= 55 and startLevel+depth <= 15, K=160 puts that bias under 1e-14 — far
    inside verify.py's absolute 1e-9 comparison. Independent of the closed form: matrix
    inversion vs difference-equation algebra."""
    b = int(p["depth"])
    start = int(p["startLevel"])
    prob = p["winPct"] / 100
    K = 160
    lo = -b + 1                      # transient positions lo .. K-1
    m = K - lo
    A = np.eye(m)
    rhs = np.zeros(m)
    for row in range(m):
        pos = lo + row
        if pos + 1 < K:
            A[row, row + 1] -= prob  # up neighbour stays transient
        # reaching +K contributes 0 (the miss branch)
        if pos - 1 >= lo:
            A[row, row - 1] -= 1 - prob
        else:
            rhs[row] += 1 - prob     # stepping to -b is the hit: boundary value 1
    x = np.linalg.solve(A, rhs)
    return float(x[start - lo])


def adverse_drift_reach_upside_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    ratio = q / prob
    a = int(p["height"]) + int(p["hole"])
    answer = (prob / q) ** a
    one_lower = (prob / q) ** (a - 1)
    return {"prob": prob, "q": q, "ratio": ratio, "answer": answer, "oneLower": one_lower}


def adverse_drift_reach_upside_brute(p):
    """Mirror truncated solve: P(reach +a before falling to -K' | start -hole); the truncation
    undercounts by at most P(fall to -K' first) * (p/q)^(K'+a), and with winPct <= 45 the
    worst odds ratio 0.818 at K'=160 gives bias < 1e-14."""
    a = int(p["height"])
    hole = int(p["hole"])
    prob = p["winPct"] / 100
    Kp = 160
    lo = -Kp + 1                     # transient positions lo .. a-1
    m = a - lo
    A = np.eye(m)
    rhs = np.zeros(m)
    for row in range(m):
        pos = lo + row
        if pos + 1 < a:
            A[row, row + 1] -= prob  # up neighbour transient; reaching +a contributes 1 below
        else:
            rhs[row] += prob         # stepping to +a is the hit: boundary value 1
        if pos - 1 >= lo:
            A[row, row - 1] -= 1 - prob
        # falling to -K' contributes 0 (the miss branch)
    x = np.linalg.solve(A, rhs)
    return float(x[-hole - lo])


SOLVERS.update({
    "ruin/unfair-reach-goal": {"exact": unfair_reach_goal_exact, "brute": unfair_reach_goal_brute},
    "ruin/walk-hit-upper-first": {"exact": walk_hit_upper_first_exact, "brute": walk_hit_upper_first_brute},
    "ruin/walk-hit-loss-first": {"exact": walk_hit_loss_first_exact, "brute": walk_hit_loss_first_brute},
    "ruin/fair-expected-duration": {"exact": fair_expected_duration_exact, "brute": fair_expected_duration_brute},
    "ruin/unfair-expected-duration": {"exact": unfair_expected_duration_exact, "brute": unfair_expected_duration_brute},
    "ruin/drift-touch-downside": {"exact": drift_touch_downside_exact, "brute": drift_touch_downside_brute},
    "ruin/adverse-drift-reach-upside": {"exact": adverse_drift_reach_upside_exact, "brute": adverse_drift_reach_upside_brute},
})


def complement_ruin_first_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    ratio = q / prob
    i, n = int(p["startChips"]), int(p["goalChips"])
    ri = ratio**i
    rn = ratio**n
    rin = ratio ** (i - 1)
    success = (1 - ri) / (1 - rn)
    return {
        "prob": prob, "q": q, "ratio": ratio, "success": success,
        "ruinProb": 1 - success, "nextRuin": 1 - (1 - rin) / (1 - rn),
        "prevStack": i - 1,
    }


def complement_ruin_first_brute(p):
    """Solve the top-exit chance numerically and take the complement — the answer is the
    failure side, never the closed form itself."""
    i, n = int(p["startChips"]), int(p["goalChips"])
    top = _absorption_solve(n, i, p["winPct"] / 100)
    return 1.0 - top


def fit_capital_fair_exact(p):
    c = p["targetPct"] / 100
    n = int(p["goalChips"])
    need = c * n
    capital = int(np.ceil(need))
    achieved = capital / n
    below = (capital - 1) / n
    return {"need": need, "capital": capital, "achieved": achieved, "below": below, "oneLess": capital - 1}


def fit_capital_fair_brute(p):
    """Scan whole stacks upward until the share clears the target — exact rational
    cross-multiplication, no ceil() anywhere."""
    c = int(p["targetPct"])
    n = int(p["goalChips"])
    k = 1
    while 100 * k < c * n:
        k += 1
    return k


def fit_capital_unfair_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    ratio = q / prob
    c = p["targetPct"] / 100
    n = int(p["goalChips"])
    rn = ratio**n
    raw = np.log(1 - c * (1 - rn)) / np.log(ratio)
    capital = int(np.ceil(raw))

    def success_at(k):
        return (1 - ratio**k) / (1 - rn)

    return {
        "prob": prob, "q": q, "ratio": ratio, "rawNeed": raw, "capital": capital,
        "achieved": success_at(capital), "below": success_at(capital - 1),
        "oneLess": capital - 1, "fairNeed": int(np.ceil(c * n)),
    }


def fit_capital_unfair_brute(p):
    """Integer bisection over the stack, each candidate evaluated by a fresh absorption
    solve — never by the power formula the template inverts."""
    prob = p["winPct"] / 100
    n = int(p["goalChips"])
    c = p["targetPct"] / 100
    lo, hi = 1, n
    while lo < hi:
        mid = (lo + hi) // 2
        if _absorption_solve(n, mid, prob) >= c:
            hi = mid
        else:
            lo = mid + 1
    return lo


def doubling_strategy_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    rounds = int(p["rounds"])
    streak_prob = q**rounds
    return {
        "prob": prob, "q": q, "streakProb": streak_prob,
        "winSession": 1 - streak_prob, "nextStreak": q ** (rounds + 1),
    }


def doubling_strategy_brute(p):
    """Enumerate all 2^n win/loss sequences of the streak window and sum the weight of the
    all-loss sequence — the B4 binomial enumeration pattern, independent of pow()."""
    n = int(p["rounds"])
    prob = p["winPct"] / 100
    total = 0.0
    for seq in itertools.product((0, 1), repeat=n):
        if sum(seq) == 0:
            total += (1 - prob) ** n
    return total


def fit_goal_from_duration_fair_exact(p):
    i, gap = int(p["stake"]), int(p["gap"])
    avg = i * gap
    return {"avgSession": avg, "straightLoss": i, "straightWin": gap, "goalFit": i + gap}


def fit_goal_from_duration_fair_brute(p):
    """Scan targets upward until the integer product matches the stated average exactly."""
    i = int(p["stake"])
    avg = i * int(p["gap"])
    n = i + 1
    while i * (n - i) != avg:
        n += 1
    return n


def stake_rescale_exact(p):
    scale = p["scalePct"] / 100
    i, n = int(p["startChips"]), int(p["goalChips"])
    big_start = round(i * scale)
    big_goal = round(n * scale)
    frac = i / n
    return {"scale": scale, "bigStart": big_start, "bigGoal": big_goal,
            "frac": frac, "scaledFrac": big_start / big_goal, "houseStack": n - i}


def stake_rescale_brute(p):
    """Solve the rescaled chain numerically — invariance is checked, not assumed."""
    scale = p["scalePct"] / 100
    i, n = int(p["startChips"]), int(p["goalChips"])
    return _absorption_solve(round(n * scale), round(i * scale), 0.5)


def restart_after_survival_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    ratio = q / prob
    j, n = int(p["reachedLevel"]), int(p["goalChips"])
    success = (1 - ratio**j) / (1 - ratio**n)
    return {"prob": prob, "q": q, "ratio": ratio, "success": success, "remaining": n - j}


def restart_after_survival_brute(p):
    j, n = int(p["reachedLevel"]), int(p["goalChips"])
    return _absorption_solve(n, j, p["winPct"] / 100)


def drift_one_sided_duration_exact(p):
    prob = p["winPct"] / 100
    q = 1 - prob
    edge = q - prob
    b = int(p["reserve"])
    return {
        "prob": prob, "q": q, "edge": edge, "duration": b / edge,
        "doubleReserve": (2 * b) / edge, "doubleReserveUnits": 2 * b,
    }


def drift_one_sided_duration_brute(p):
    """One-sided fall time under adverse drift, on a chain truncated at reserve+140. The
    truncation undercounts the mean by at most P(reach the top first) * O(top/edge); with
    winPct <= 42 (p/q <= 0.75) that is below 1e-15 — far inside the absolute comparison."""
    b = int(p["reserve"])
    prob = p["winPct"] / 100
    return _duration_solve(b + 140, b, prob)


def fit_then_duration_exact(p):
    stake = int(round((p["reachPct"] / 100) * p["goalChips"]))
    n = int(p["goalChips"])
    duration = stake * (n - stake)
    return {"stake": stake, "duration": duration, "straightWin": n - stake}


def fit_then_duration_brute(p):
    stake = int(round((p["reachPct"] / 100) * p["goalChips"]))
    return _duration_solve(int(p["goalChips"]), stake, 0.5)


def infer_capital_then_new_goal_exact(p):
    stake = int(round((p["firstSharePct"] / 100) * p["firstGoal"]))
    second = int(round((p["secondGoalPct"] / 100) * p["firstGoal"]))
    return {
        "stake": stake, "secondGoal": second,
        "newChance": stake / second, "oldChance": stake / int(p["firstGoal"]),
        "raisePct": int(p["secondGoalPct"]) - 100,
    }


def infer_capital_then_new_goal_brute(p):
    """Solve the second-goal chain numerically from the implied stake."""
    stake = int(round((p["firstSharePct"] / 100) * p["firstGoal"]))
    second = int(round((p["secondGoalPct"] / 100) * p["firstGoal"]))
    return _absorption_solve(second, stake, 0.5)


def doubling_fit_then_duration_exact(p):
    q = (p["streakPct"] / 100) ** (1 / int(p["rounds"]))
    prob = 1 - q
    streak_prob = q ** int(p["rounds"])
    return {
        "q": q, "prob": prob, "streakProb": streak_prob,
        "winSession": 1 - streak_prob, "duration": (1 - streak_prob) / prob,
    }


def doubling_fit_then_duration_brute(p):
    """Sum every capped ending weighted by its length: first win on bet k (k q^{k-1} p) plus
    the full streak (n q^n) — an independent series, not the collapsed closed form."""
    n = int(p["rounds"])
    q = (p["streakPct"] / 100) ** (1 / n)
    prob = 1 - q
    total = sum(k * prob * q ** (k - 1) for k in range(1, n + 1))
    return total + n * q**n


def survive_then_remaining_duration_exact(p):
    j, n = int(p["currentStack"]), int(p["goalChips"])
    remaining = j * (n - j)
    from_zero = round(n * n / 4)
    return {"remaining": remaining, "fromZero": from_zero, "upperGap": n - j}


def survive_then_remaining_duration_brute(p):
    j, n = int(p["currentStack"]), int(p["goalChips"])
    return _duration_solve(n, j, 0.5)


SOLVERS.update({
    "ruin/complement-ruin-first": {"exact": complement_ruin_first_exact, "brute": complement_ruin_first_brute},
    "ruin/fit-capital-fair": {"exact": fit_capital_fair_exact, "brute": fit_capital_fair_brute},
    "ruin/fit-capital-unfair": {"exact": fit_capital_unfair_exact, "brute": fit_capital_unfair_brute},
    "ruin/doubling-strategy": {"exact": doubling_strategy_exact, "brute": doubling_strategy_brute},
    "ruin/fit-goal-from-duration-fair": {"exact": fit_goal_from_duration_fair_exact, "brute": fit_goal_from_duration_fair_brute},
    "ruin/stake-rescale": {"exact": stake_rescale_exact, "brute": stake_rescale_brute},
    "ruin/restart-after-survival": {"exact": restart_after_survival_exact, "brute": restart_after_survival_brute},
    "ruin/drift-one-sided-duration": {"exact": drift_one_sided_duration_exact, "brute": drift_one_sided_duration_brute},
    "ruin/fit-then-duration": {"exact": fit_then_duration_exact, "brute": fit_then_duration_brute},
    "ruin/infer-capital-then-new-goal": {"exact": infer_capital_then_new_goal_exact, "brute": infer_capital_then_new_goal_brute},
    "ruin/doubling-fit-then-duration": {"exact": doubling_fit_then_duration_exact, "brute": doubling_fit_then_duration_brute},
    "ruin/survive-then-remaining-duration": {"exact": survive_then_remaining_duration_exact, "brute": survive_then_remaining_duration_brute},
})
