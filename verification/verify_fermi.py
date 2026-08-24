"""CI gate: the Fermi game's mathematics, re-derived independently.

Fermi CONTENT cannot be verified in Python — there is no second route to a real-world count, and
that is what content/fermi/fermi.test.ts's cross-check gate is for. The MATHEMATICS can be, and
this is that check.

TypeScript computes the combined interval in closed form (the product of independent lognormals
is exactly lognormal). Python re-derives it by SAMPLING, which shares no algebra with the closed
form — the same exact/brute split every solver in verification/solvers/ uses.

Run after `npm run verify:fermi-emit`. Exit 1 on any failure.
"""
import json
import sys
from pathlib import Path

import numpy as np

Z95 = 1.6449
N_SAMPLES = 400_000

# Tolerance lives in LOG space and scales with sigma, because that is the shape of the sampling
# noise. The standard error of a sampled 5%/95% log-quantile is
#     sqrt(p(1-p)/N) / phi(z) * sigma = sqrt(.05*.95/400000) / 0.1031 * sigma = 0.00334 * sigma,
# so this is a 6-sigma band. A fixed 2% RELATIVE tolerance in value space was tried first and is
# wrong: sigma reaches ~2.4 decades at six factors, where 1 SE is already ~1.9% of the endpoint.
# MEASURED against this file's own fixture, 200 cases x 2 endpoints, on 2026-08-24. A fixed 2%
# RELATIVE tolerance in value space was tried first and is wrong; this rule fails 0/400 on a
# correct implementation. Against the exact mutation Task 6 step 5 seeds (`varSum += s`, so
# sigma becomes sqrt(sum s) rather than sqrt(sum s^2)) it fails 400/400 — tightest catch 4.01x
# the tolerance, median 16.7x, max 51.6x. The tightest catch is the number that matters: the two
# sigmas converge as every factor's sigma approaches 1.0, so do NOT widen ATOL_LOG without
# re-running that measurement. Past about 4x this stops catching the bug it was built to catch.
ATOL_LOG = 0.02           # per unit of sigma
ATOL_SCORE = 1e-9

data = json.loads((Path(__file__).parent / "fermi-instances.json").read_text())
rng = np.random.default_rng(20260824)
failures = []

for i, case in enumerate(data["cases"]):
    ts = case["combined"]

    # BRUTE: sample each factor as a lognormal and multiply the draws. No summing of variances.
    logs = np.zeros(N_SAMPLES)
    for f in case["factors"]:
        a, b = np.log10(f["lo"]), np.log10(f["hi"])
        mu, sigma = (a + b) / 2, (b - a) / (2 * Z95)
        logs += rng.normal(mu, sigma, N_SAMPLES)
    sampled_lo, sampled_hi = np.percentile(logs, [5, 95])

    tol = ATOL_LOG * ts["sigma"]
    for name, got, want in (("lo", sampled_lo, np.log10(ts["lo"])), ("hi", sampled_hi, np.log10(ts["hi"]))):
        if abs(got - want) > tol:
            failures.append(
                f"case {i}: log10 {name} sampled {got:.6f} vs closed form {want:.6f} "
                f"(gap {abs(got - want):.6f} > tol {tol:.6f}, sigma {ts['sigma']:.3f})")

    # TRANSCRIPTION, not a second route: this is the same formula written twice, so it cannot
    # catch an error in the scoring algebra. It catches emit and serialisation drift, which is
    # worth having. The independence claim rests entirely on the sampling check above.
    lo, hi, y = np.log10(ts["lo"]), np.log10(ts["hi"]), np.log10(case["truth"])
    s = hi - lo
    if y < lo:
        s += 20.0 * (lo - y)
    elif y > hi:
        s += 20.0 * (y - hi)
    if abs(s - case["score"]) > ATOL_SCORE + 1e-9 * abs(case["score"]):
        failures.append(f"case {i}: score {s:.12g} vs TS {case['score']:.12g}")

if failures:
    print(f"FERMI VERIFY FAILED — {len(failures)} problems")
    for f in failures[:60]:
        print(" ", f)
    sys.exit(1)

print(f"fermi ok: {len(data['cases'])} cases, intervals re-derived by sampling")
