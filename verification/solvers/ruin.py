"""Independent Python counterparts for content/problems/ruin/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry), same
convention as bayes/counting/ev_variance/distributions.
brute()/simulate(): recompute the ANSWER by an independent path per spec §5 (as corrected by
plan constraint 1) — a numpy absorption-system solve for two-barrier probabilities, Monte
Carlo walkers for durations, drift touches, and doubling sessions."""

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
    return float(np.linalg.solve(A, b)[start - 1])


def unfair_reach_goal_brute(p):
    return _absorption_solve(int(p["goalChips"]), int(p["startChips"]), p["winPct"] / 100)


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


def _walk_duration_batch(i, n, prob_up, rng, size):
    """One lockstep batch: every walker steps simultaneously until absorbed; returns (sum,
    sum-of-squares) of absorption times."""
    pos = np.full(size, float(i))
    steps = np.zeros(size)
    alive = np.ones(size, dtype=bool)
    while alive.any():
        idx = np.nonzero(alive)[0]
        moves = (rng.random(idx.size) < prob_up) * 2 - 1
        pos[idx] += moves
        steps[idx] += 1
        alive[idx] &= (pos[idx] > 0) & (pos[idx] < n)
    return steps.sum(), (steps**2).sum()


def _adaptive_walk_mean(i, n, prob_up, rng, chunk=400_000, min_count=800_000, max_count=40_000_000):
    """Adaptive trial count: keep batching until 3*se <= 0.001*mean — a 25 percent margin
    inside verify.py's 3se <= bound/2 requirement (bound = 0.005*answer). Required N scales
    with (sigma/E)^2 while cost scales with sigma^2/E, so adapting per instance keeps every
    corner of the legal space seconds-cheap instead of sizing one constant for the worst."""
    total = 0.0
    total2 = 0.0
    count = 0
    while True:
        s, s2 = _walk_duration_batch(i, n, prob_up, rng, chunk)
        total += s
        total2 += s2
        count += chunk
        est = total / count
        var = max(total2 / count - est * est, 1e-9)
        se = var**0.5 / count**0.5
        if (count >= min_count and 3 * se <= 0.001 * est) or count >= max_count:
            return est, se


def fair_expected_duration_sim(p, rng):
    i, n = int(p["stake"]), int(p["target"])
    return _adaptive_walk_mean(i, n, 0.5, rng)


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


def unfair_expected_duration_sim(p, rng):
    i, n = int(p["stake"]), int(p["target"])
    prob = p["winPct"] / 100
    return _adaptive_walk_mean(i, n, prob, rng)


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
    "ruin/fair-expected-duration": {"exact": fair_expected_duration_exact, "simulate": fair_expected_duration_sim},
    "ruin/unfair-expected-duration": {"exact": unfair_expected_duration_exact, "simulate": unfair_expected_duration_sim},
    "ruin/drift-touch-downside": {"exact": drift_touch_downside_exact, "brute": drift_touch_downside_brute},
    "ruin/adverse-drift-reach-upside": {"exact": adverse_drift_reach_upside_exact, "brute": adverse_drift_reach_upside_brute},
})
