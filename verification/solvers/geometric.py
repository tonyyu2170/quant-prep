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
