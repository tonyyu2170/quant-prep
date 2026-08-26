"""CI gate: every emitted instance is re-derived independently (spec §4).
Run after `npm run verify:emit`. Exit 1 on any failure."""
import json
import math
import sys
from pathlib import Path

import numpy as np

from solvers import SOLVERS

REL_EXACT = 1e-9
MC_INSTANCES = 5      # probabilistic cross-check per problem
BF_INSTANCES = 25     # enumeration cross-check per problem

data = json.loads((Path(__file__).parent / "instances.json").read_text())
failures = []

for prob in data["problems"]:
    pid = prob["id"]
    solver = SOLVERS.get(pid)
    if solver is None:
        failures.append(f"{pid}: NO PYTHON SOLVER — every problem ships with its counterpart")
        continue
    tol = prob["tolerance"]

    for inst in prob["instances"]:
        exact = solver["exact"](inst["params"])
        for key, ts_val in inst["derived"].items():
            py_val = exact.get(key)
            if py_val is None:
                failures.append(f"{pid} seed {inst['seed']}: derived '{key}' not re-derived in Python")
            elif not math.isfinite(py_val):
                failures.append(f"{pid} seed {inst['seed']}: derived '{key}' came back {py_val} from Python")
            elif abs(py_val - ts_val) > REL_EXACT * max(1.0, abs(ts_val)):
                failures.append(f"{pid} seed {inst['seed']}: derived '{key}' TS={ts_val} PY={py_val}")
        ans = inst["answer"]
        # Every comparison below is guarded for finiteness first. A NaN fails every inequality
        # it appears in, so an unguarded `abs(a - b) > tol` reports a solver that returned NaN
        # as a PASS — silence that reads exactly like agreement.
        if not math.isfinite(exact[prob["answerKey"]]):
            failures.append(f"{pid} seed {inst['seed']}: Python answer came back {exact[prob['answerKey']]}")
        elif abs(exact[prob["answerKey"]] - ans) > REL_EXACT * max(1.0, abs(ans)):
            failures.append(f"{pid} seed {inst['seed']}: answer TS={ans} PY={exact[prob['answerKey']]}")

    if prob["method"] == "montecarlo":
        rng = np.random.default_rng(12345)
        for inst in prob["instances"][:MC_INSTANCES]:
            est, se = solver["simulate"](inst["params"], rng)
            ans = inst["answer"]
            bound = tol.get("abs") if tol.get("abs") is not None else tol["rel"] * abs(ans)
            if 3 * se > bound / 2:
                failures.append(f"{pid} seed {inst['seed']}: MC noise 3se={3*se:.2e} not well inside "
                                f"tolerance {bound:.2e} — raise trials or switch to symbolic")
            if not math.isfinite(est):
                failures.append(f"{pid} seed {inst['seed']}: MC estimate came back {est}")
            elif abs(est - ans) > max(4 * se, 1e-12):
                failures.append(f"{pid} seed {inst['seed']}: MC est {est:.6f} vs closed form {ans:.6f}")
    elif prob["method"] == "brute-force":
        for inst in prob["instances"][:BF_INSTANCES]:
            bf = solver["brute"](inst["params"])
            if not math.isfinite(bf):
                failures.append(f"{pid} seed {inst['seed']}: brute-force came back {bf}")
            elif abs(bf - inst["answer"]) > REL_EXACT:
                failures.append(f"{pid} seed {inst['seed']}: brute-force {bf} vs {inst['answer']}")
    elif prob["method"] == "symbolic":
        failures.append(f"{pid}: symbolic method declared but not implemented in this suite yet")

if failures:
    print(f"VERIFY FAILED — {len(failures)} issue(s):")
    for f in failures[:60]:
        print("  " + f)
    sys.exit(1)
print(f"Verified {len(data['problems'])} problems: derived re-derivation + answer cross-checks green.")
