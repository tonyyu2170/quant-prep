"""Independent Python counterparts for content/problems/geometric/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry), same
convention as the other topic modules. math.pi is bit-identical to Math.PI (spec §2).
simulate(): recompute the ANSWER by uniform sampling — every geometric problem is a
Bernoulli-style Monte Carlo over points, pairs, triples, or needle drops, chunked like
distributions.py's sims so memory stays flat."""

import math

import numpy as np


def _bernoulli_sim(hit_fn, trials, rng, chunk=1_000_000):
    """Chunked Bernoulli estimator: hit_fn(m) draws m uniform samples and returns the hit
    count as an int. Returns (est, se) per verify.py's contract."""
    hits = 0
    done = 0
    while done < trials:
        m = min(chunk, trials - done)
        hits += hit_fn(m)
        done += m
    est = hits / trials
    se = (est * (1 - est) / trials) ** 0.5
    return est, se


def segment_subinterval_exact(p):
    window_left = p["trailLength"] - p["endMark"]
    frac = p["endMark"] / p["trailLength"]
    return {"frac": frac, "complement": 1 - frac, "windowLeft": window_left}


def segment_subinterval_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    length = p["trailLength"]
    left = length - p["endMark"]

    def hits(m):
        return int((rng.uniform(0, length, m) >= p["endMark"]).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def two_points_gap_exact(p):
    t = p["gapUnits"] / p["stickLength"]
    corner_leg = p["stickLength"] - p["gapUnits"]
    answer = 1 - (1 - t) ** 2
    return {"t": t, "answer": answer, "farProb": (1 - t) ** 2, "cornerLeg": corner_leg}


def two_points_gap_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    length = p["stickLength"]
    d = p["gapUnits"]

    def hits(m):
        x = rng.uniform(0, length, m)
        y = rng.uniform(0, length, m)
        return int((np.abs(x - y) < d).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def meeting_window_exact(p):
    miss_leg = p["windowMinutes"] - p["waitMinutes"]
    answer = 1 - (miss_leg / p["windowMinutes"]) ** 2
    return {"answer": answer, "missProb": (miss_leg / p["windowMinutes"]) ** 2, "missLeg": miss_leg}


def meeting_window_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    t = p["windowMinutes"]
    w = p["waitMinutes"]

    def hits(m):
        x = rng.uniform(0, t, m)
        y = rng.uniform(0, t, m)
        return int((np.abs(x - y) <= w).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def square_inner_disk_exact(p):
    disk_area = math.pi * p["diskR"] ** 2
    board_area = p["boardW"] * p["boardH"]
    return {"diskArea": disk_area, "boardArea": board_area, "answer": disk_area / board_area}


def square_inner_disk_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    w, h, r = p["boardW"], p["boardH"], p["diskR"]
    cx, cy = w / 2, h / 2

    def hits(m):
        x = rng.uniform(0, w, m)
        y = rng.uniform(0, h, m)
        return int(((x - cx) ** 2 + (y - cy) ** 2 <= r * r).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def concentric_circles_exact(p):
    ratio = p["bullR"] / p["boardR"]
    answer = ratio**2
    return {"ratio": ratio, "answer": answer, "ringShare": 1 - answer}


def concentric_circles_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    board_r, bull_r = p["boardR"], p["bullR"]

    def hits(m):
        # uniform on the disk: radius sqrt-uniform, angle uniform
        rad = board_r * np.sqrt(rng.random(m))
        return int((rad <= bull_r).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def broken_stick_left_share_exact(p):
    threshold = (p["sharePct"] / 100) * p["stickCm"]
    share_frac = p["sharePct"] / 100
    return {
        "threshold": threshold, "answer": 1 - share_frac,
        "qualifying": p["stickCm"] - threshold, "shareFrac": share_frac,
    }


def broken_stick_left_share_sim(p, rng, trials=15_000_000, chunk=3_000_000):
    length = p["stickCm"]
    threshold = (p["sharePct"] / 100) * length

    def hits(m):
        return int((rng.uniform(0, length, m) > threshold).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def border_band_exact(p):
    board_area = p["boardW"] * p["boardH"]
    inner_w = p["boardW"] - 2 * p["bandWidth"]
    inner_h = p["boardH"] - 2 * p["bandWidth"]
    inner_area = inner_w * inner_h
    return {
        "boardArea": board_area, "innerW": inner_w, "innerH": inner_h,
        "innerArea": inner_area, "answer": 1 - inner_area / board_area,
    }


def border_band_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    w, h, e = p["boardW"], p["boardH"], p["bandWidth"]

    def hits(m):
        x = rng.uniform(0, w, m)
        y = rng.uniform(0, h, m)
        near_edge = (x < e) | (x > w - e) | (y < e) | (y > h - e)
        return int(near_edge.sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def chord_angle_cap_exact(p):
    answer = p["capPct"] / 100
    return {"answer": answer, "complement": 1 - answer}


def chord_angle_cap_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    cap = (p["capPct"] / 100) * math.pi

    def hits(m):
        a1 = rng.uniform(0, 2 * math.pi, m)
        a2 = rng.uniform(0, 2 * math.pi, m)
        diff = np.abs(a1 - a2) % (2 * math.pi)
        minor = np.minimum(diff, 2 * math.pi - diff)
        return int((minor < cap).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


SOLVERS = {
    "geometric/segment-subinterval": {"exact": segment_subinterval_exact, "simulate": segment_subinterval_sim},
    "geometric/two-points-gap": {"exact": two_points_gap_exact, "simulate": two_points_gap_sim},
    "geometric/meeting-window": {"exact": meeting_window_exact, "simulate": meeting_window_sim},
    "geometric/square-inner-disk": {"exact": square_inner_disk_exact, "simulate": square_inner_disk_sim},
    "geometric/concentric-circles": {"exact": concentric_circles_exact, "simulate": concentric_circles_sim},
    "geometric/broken-stick-left-share": {"exact": broken_stick_left_share_exact, "simulate": broken_stick_left_share_sim},
    "geometric/border-band": {"exact": border_band_exact, "simulate": border_band_sim},
    "geometric/chord-angle-cap": {"exact": chord_angle_cap_exact, "simulate": chord_angle_cap_sim},
}


def meeting_inverse_fit_exact(p):
    wait = p["windowMinutes"] * (1 - math.sqrt(1 - p["targetPct"] / 100))
    miss_leg = p["windowMinutes"] - wait
    return {"wait": wait, "missLeg": miss_leg, "missProb": (miss_leg / p["windowMinutes"]) ** 2}


def meeting_inverse_fit_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    """B4 fit pattern: simulate at the fitted wait, then invert the noisy probability back
    through the closed form; delta-method carries the standard error into minutes."""
    t = p["windowMinutes"]
    wait = t * (1 - math.sqrt(1 - p["targetPct"] / 100))

    def hits(m):
        x = rng.uniform(0, t, m)
        y = rng.uniform(0, t, m)
        return int((np.abs(x - y) <= wait).sum())

    est_p, se_p = _bernoulli_sim(hits, trials, rng, chunk)
    est_w = t * (1 - math.sqrt(max(1 - est_p, 0.0)))
    se_w = (t / (2 * math.sqrt(max(1 - est_p, 1e-12)))) * se_p
    return est_w, se_w


def stick_triangle_conditional_exact(p):
    u = p["firstBreakPct"] / 100
    return {"answer": u / (1 - u), "seqUnconditional": math.log(2) - 0.5,
            "remainderPct": 100 - p["firstBreakPct"]}


def stick_triangle_conditional_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    length = p["stickCm"]
    u = p["firstBreakPct"] / 100

    def hits(m):
        v = rng.uniform(0, 1, m)          # second break as a share of the remainder
        left = u
        mid = v * (1 - u)
        right = (1 - v) * (1 - u)
        triangle = (left < 0.5) & (mid < 0.5) & (right < 0.5)
        return int(triangle.sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def buffon_short_needle_exact(p):
    answer = (2 * p["needleCm"]) / (math.pi * p["boardCm"])
    return {"answer": answer, "ratio": p["needleCm"] / p["boardCm"]}


def buffon_short_needle_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    t = p["boardCm"]
    half = p["needleCm"] / 2

    def hits(m):
        y = rng.uniform(0, t, m)
        theta = rng.uniform(0, math.pi, m)
        reach = half * np.sin(theta)
        crosses = (y <= reach) | (y >= t - reach)
        return int(crosses.sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def three_points_spacing_exact(p):
    t = (p["stickLength"] - 2 * p["gapUnits"]) / p["stickLength"]
    return {"t": t, "answer": t**3, "consumed": 2 * p["gapUnits"]}


def three_points_spacing_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    length = p["stickLength"]
    d = p["gapUnits"]

    def hits(m):
        pts = rng.uniform(0, length, (m, 3))
        pts.sort(axis=1)
        gaps = np.diff(pts, axis=1)
        return int(((gaps >= d).all(axis=1)).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def corner_quarter_disk_exact(p):
    zone_area = math.pi * p["zoneR"] ** 2 / 4
    board_area = p["boardW"] * p["boardH"]
    return {"zoneArea": zone_area, "boardArea": board_area, "answer": zone_area / board_area}


def corner_quarter_disk_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    w, h, r = p["boardW"], p["boardH"], p["zoneR"]

    def hits(m):
        x = rng.uniform(0, w, m)
        y = rng.uniform(0, h, m)
        return int((x * x + y * y <= r * r).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def disk_in_rect_complement_exact(p):
    disk_share = math.pi * p["diskR"] ** 2 / (p["boardW"] * p["boardH"])
    return {"diskShare": disk_share, "answer": 1 - disk_share}


def disk_in_rect_complement_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    w, h, r = p["boardW"], p["boardH"], p["diskR"]
    cx, cy = w / 3.0, h / 3.0          # any off-center spot; area law ignores it

    def hits(m):
        x = rng.uniform(0, w, m)
        y = rng.uniform(0, h, m)
        inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r
        return int((~inside).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def buffon_fit_length_inverse_exact(p):
    needle = (p["targetPct"] / 100) * p["boardCm"] * (math.pi / 2)
    return {"needle": needle, "ratio": needle / p["boardCm"]}


def buffon_fit_length_inverse_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    """Fit pattern: drop needles of the implied length, then invert the noisy crossing
    estimate through the linear closed form."""
    t = p["boardCm"]
    needle = (p["targetPct"] / 100) * t * (math.pi / 2)

    def hits(m):
        y = rng.uniform(0, t, m)
        theta = rng.uniform(0, math.pi, m)
        reach = (needle / 2) * np.sin(theta)
        return int(((y <= reach) | (y >= t - reach)).sum())

    est_p, se_p = _bernoulli_sim(hits, trials, rng, chunk)
    est_l = est_p * t * math.pi / 2
    se_l = se_p * t * math.pi / 2
    return est_l, se_l


def triangle_parallel_cut_exact(p):
    t = p["cutPct"] / 100
    top = t**2
    return {"t": t, "answer": 1 - top, "topShare": top}


def triangle_parallel_cut_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    cut = p["cutPct"] / 100

    def hits(m):
        # uniform point in apex-up triangle via two uniforms folded below the diagonal:
        # (a, b) uniform on unit square with a + b <= 1 maps affinely to the triangle.
        a = rng.uniform(0, 1, m)
        b = rng.uniform(0, 1, m)
        over = a + b > 1
        a[over] = 1 - a[over]
        b[over] = 1 - b[over]
        # height fraction below the cut equals a + b on this simplex
        return int((a + b > cut).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


SOLVERS.update({
    "geometric/meeting-inverse-fit": {"exact": meeting_inverse_fit_exact, "simulate": meeting_inverse_fit_sim},
    "geometric/stick-triangle-conditional": {"exact": stick_triangle_conditional_exact, "simulate": stick_triangle_conditional_sim},
    "geometric/buffon-short-needle": {"exact": buffon_short_needle_exact, "simulate": buffon_short_needle_sim},
    "geometric/three-points-spacing": {"exact": three_points_spacing_exact, "simulate": three_points_spacing_sim},
    "geometric/corner-quarter-disk": {"exact": corner_quarter_disk_exact, "simulate": corner_quarter_disk_sim},
    "geometric/disk-in-rect-complement": {"exact": disk_in_rect_complement_exact, "simulate": disk_in_rect_complement_sim},
    "geometric/buffon-fit-length-inverse": {"exact": buffon_fit_length_inverse_exact, "simulate": buffon_fit_length_inverse_sim},
    "geometric/triangle-parallel-cut": {"exact": triangle_parallel_cut_exact, "simulate": triangle_parallel_cut_sim},
})


def fit_window_then_other_window_exact(p):
    wait = p["firstWindow"] * (1 - math.sqrt(1 - p["targetPct"] / 100))
    miss_leg = p["secondWindow"] - wait
    return {"wait": wait, "answer": 1 - (miss_leg / p["secondWindow"]) ** 2, "missLeg": miss_leg}


def fit_window_then_other_window_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    """Simulate both arrivals in the SECOND window with the stage-one-implied wait."""
    t2 = p["secondWindow"]
    wait = p["firstWindow"] * (1 - math.sqrt(1 - p["targetPct"] / 100))

    def hits(m):
        x = rng.uniform(0, t2, m)
        y = rng.uniform(0, t2, m)
        return int((np.abs(x - y) <= wait).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def buffon_fit_then_other_board_exact(p):
    needle = (p["targetPct"] / 100) * p["firstBoardCm"] * (math.pi / 2)
    second = round((p["secondBoardPct"] / 100) * p["firstBoardCm"])
    return {"needle": needle, "secondBoard": second,
            "answer": (2 * needle) / (math.pi * second)}


def buffon_fit_then_other_board_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    needle = (p["targetPct"] / 100) * p["firstBoardCm"] * (math.pi / 2)
    t2 = round((p["secondBoardPct"] / 100) * p["firstBoardCm"])

    def hits(m):
        y = rng.uniform(0, t2, m)
        theta = rng.uniform(0, math.pi, m)
        reach = (needle / 2) * np.sin(theta)
        return int(((y <= reach) | (y >= t2 - reach)).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def delayed_arrival_meeting_exact(p):
    full_span = p["windowMinutes"] - p["delayMinutes"] - p["waitMinutes"]
    answer = (2 * p["waitMinutes"] * (p["windowMinutes"] - p["delayMinutes"])) / p["windowMinutes"] ** 2
    full_area = 2 * p["waitMinutes"] * full_span
    taper_area = 2 * p["waitMinutes"] ** 2
    board_area = p["windowMinutes"] ** 2
    stripe_width = 2 * p["waitMinutes"]
    total_area = full_area + taper_area
    return {"fullSpan": full_span, "answer": answer, "fullArea": full_area,
            "taperArea": taper_area, "boardArea": board_area, "stripeWidth": stripe_width,
            "totalArea": total_area}


def delayed_arrival_meeting_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    t = p["windowMinutes"]
    s = p["delayMinutes"]
    w = p["waitMinutes"]

    def hits(m):
        a = rng.uniform(0, t, m)
        b = rng.uniform(s, t + s, m)
        return int((np.abs(a - b) <= w).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


def concentric_fit_then_ring_exact(p):
    bull_r = p["boardR"] * math.sqrt(p["bullseyePct"] / 100)
    outer_r = (p["outerPct"] / 100) * p["boardR"]
    ring_share = (p["outerPct"] / 100) ** 2 - p["bullseyePct"] / 100
    return {"bullR": bull_r, "outerR": outer_r, "ringShare": ring_share}


def concentric_fit_then_ring_sim(p, rng, trials=15_000_000, chunk=1_500_000):
    board_r = p["boardR"]
    bull_r = board_r * math.sqrt(p["bullseyePct"] / 100)
    outer_r = (p["outerPct"] / 100) * board_r

    def hits(m):
        rad = board_r * np.sqrt(rng.random(m))
        return int(((rad > bull_r) & (rad <= outer_r)).sum())

    return _bernoulli_sim(hits, trials, rng, chunk)


SOLVERS.update({
    "geometric/fit-window-then-other-window": {"exact": fit_window_then_other_window_exact, "simulate": fit_window_then_other_window_sim},
    "geometric/buffon-fit-then-other-board": {"exact": buffon_fit_then_other_board_exact, "simulate": buffon_fit_then_other_board_sim},
    "geometric/delayed-arrival-meeting": {"exact": delayed_arrival_meeting_exact, "simulate": delayed_arrival_meeting_sim},
    "geometric/concentric-fit-then-ring": {"exact": concentric_fit_then_ring_exact, "simulate": concentric_fit_then_ring_sim},
})
