"""Independent Python counterparts for content/problems/bayes/*.
exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).
simulate()/brute(): checks the answer WITHOUT the closed form — raw simulation
or sample-space enumeration only."""
import itertools
import numpy as np
from fractions import Fraction


def base_rate_exact(p):
    fpr = 1 - p["spec"]
    healthy = 1 - p["prev"]
    tp = p["prev"] * p["sens"]
    fp = healthy * fpr
    pos = tp + fp
    return {"fpr": fpr, "healthy": healthy, "tp": tp, "fp": fp, "pos": pos, "posterior": tp / pos}


def base_rate_sim(p, rng, trials=20_000_000, chunk=4_000_000):
    pos = hits = 0
    done = 0
    while done < trials:
        n = min(chunk, trials - done)
        diseased = rng.random(n) < p["prev"]
        r = rng.random(n)
        positive = np.where(diseased, r < p["sens"], r < (1 - p["spec"]))
        pos += int(positive.sum())
        hits += int((positive & diseased).sum())
        done += n
    est = hits / pos
    se = (est * (1 - est) / pos) ** 0.5
    return est, se


def two_urns_exact(p):
    a_total = p["aRed"] + p["aBlue"]
    b_total = p["bRed"] + p["bBlue"]
    p_red_a = p["aRed"] / a_total
    p_red_b = p["bRed"] / b_total
    p_red = 0.5 * p_red_a + 0.5 * p_red_b
    return {"aTotal": a_total, "bTotal": b_total, "pRedA": p_red_a, "pRedB": p_red_b,
            "pRed": p_red, "postA": (0.5 * p_red_a) / p_red}


def two_urns_brute(p):
    # Enumerate the atomic sample space (urn, ball) — no Bayes formula anywhere.
    red_mass = Fraction(0)
    red_and_a = Fraction(0)
    for urn, red, blue in (("A", p["aRed"], p["aBlue"]), ("B", p["bRed"], p["bBlue"])):
        total = int(red) + int(blue)
        for ball in range(total):
            w = Fraction(1, 2) * Fraction(1, total)
            if ball < red:
                red_mass += w
                if urn == "A":
                    red_and_a += w
    return float(red_and_a / red_mass)


def two_signal_fraud_exact(p):
    legit = 1 - p["prior"]
    numA = p["prior"] * p["sensA"]
    fpA = legit * p["fprA"]
    denomA = numA + fpA
    post1 = numA / denomA
    legit1 = 1 - post1
    numB = post1 * p["sensB"]
    fpB = legit1 * p["fprB"]
    denomB = numB + fpB
    post2 = numB / denomB
    return {"legit": legit, "numA": numA, "fpA": fpA, "denomA": denomA, "post1": post1,
            "legit1": legit1, "numB": numB, "fpB": fpB, "denomB": denomB, "post2": post2}


def two_signal_fraud_brute(p):
    # Enumerate (status, A-fires, B-fires) atoms directly — joint mass, no update formula.
    prior = Fraction(str(p["prior"]))
    sensA = Fraction(str(p["sensA"]))
    fprA = Fraction(str(p["fprA"]))
    sensB = Fraction(str(p["sensB"]))
    fprB = Fraction(str(p["fprB"]))
    legit = 1 - prior
    both_fraud = prior * sensA * sensB
    both_legit = legit * fprA * fprB
    return float(both_fraud / (both_fraud + both_legit))


def weather_alarm_exact(p):
    pNoRain = 1 - p["pRain"]
    tp = p["pRain"] * p["pAlarmGivenRain"]
    fp = pNoRain * p["pAlarmGivenNoRain"]
    pAlarm = tp + fp
    postRain = tp / pAlarm
    return {"pNoRain": pNoRain, "tp": tp, "fp": fp, "pAlarm": pAlarm, "postRain": postRain}


def weather_alarm_brute(p):
    pRain = Fraction(str(p["pRain"]))
    pAR = Fraction(str(p["pAlarmGivenRain"]))
    pANR = Fraction(str(p["pAlarmGivenNoRain"]))
    pNoRain = 1 - pRain
    tp = pRain * pAR
    fp = pNoRain * pANR
    return float(tp / (tp + fp))


def spam_filter_odds_exact(p):
    priorHam = 1 - p["priorSpam"]
    priorOdds = p["priorSpam"] / priorHam
    likelihoodRatio = p["pPhraseSpam"] / p["pPhraseHam"]
    posteriorOdds = priorOdds * likelihoodRatio
    onePlusOdds = posteriorOdds + 1
    posterior = posteriorOdds / onePlusOdds
    return {"priorHam": priorHam, "priorOdds": priorOdds, "likelihoodRatio": likelihoodRatio,
            "posteriorOdds": posteriorOdds, "onePlusOdds": onePlusOdds, "posterior": posterior}


def spam_filter_odds_brute(p):
    # Enumerate (class, phrase-present) atoms directly — no odds formula.
    priorSpam = Fraction(str(p["priorSpam"]))
    priorHam = 1 - priorSpam
    pPhraseSpam = Fraction(str(p["pPhraseSpam"]))
    pPhraseHam = Fraction(str(p["pPhraseHam"]))
    massSpamPhrase = priorSpam * pPhraseSpam
    massHamPhrase = priorHam * pPhraseHam
    return float(massSpamPhrase / (massSpamPhrase + massHamPhrase))


def strategy_outcome_table_exact(p):
    totalWin = p["momWin"] + p["mrWin"]
    pMomGivenWin = p["momWin"] / totalWin
    return {"totalWin": totalWin, "pMomGivenWin": pMomGivenWin}


def strategy_outcome_table_brute(p):
    # Enumerate individual trades and filter to the winning column.
    trades = (
        [("mom", "win")] * int(p["momWin"]) + [("mom", "loss")] * int(p["momLoss"]) +
        [("mr", "win")] * int(p["mrWin"]) + [("mr", "loss")] * int(p["mrLoss"])
    )
    winners = [t for t in trades if t[1] == "win"]
    mom_winners = [t for t in winners if t[0] == "mom"]
    return len(mom_winners) / len(winners)


def raffle_without_replacement_exact(p):
    total = p["W"] + p["L"]
    remaining = total - 1
    pFirstWin = p["W"] / total
    pFirstLoss = p["L"] / total
    remainingLosersAfterWin = p["L"]
    remainingLosersAfterLoss = p["L"] - 1
    pSecondLossGivenFirstWin = remainingLosersAfterWin / remaining
    pSecondLossGivenFirstLoss = remainingLosersAfterLoss / remaining
    jointWinThenLoss = pFirstWin * pSecondLossGivenFirstWin
    jointLossThenLoss = pFirstLoss * pSecondLossGivenFirstLoss
    pSecondLoss = jointWinThenLoss + jointLossThenLoss
    postFirstWin = jointWinThenLoss / pSecondLoss
    return {"total": total, "remaining": remaining, "pFirstWin": pFirstWin, "pFirstLoss": pFirstLoss,
            "remainingLosersAfterWin": remainingLosersAfterWin, "remainingLosersAfterLoss": remainingLosersAfterLoss,
            "pSecondLossGivenFirstWin": pSecondLossGivenFirstWin, "pSecondLossGivenFirstLoss": pSecondLossGivenFirstLoss,
            "jointWinThenLoss": jointWinThenLoss, "jointLossThenLoss": jointLossThenLoss,
            "pSecondLoss": pSecondLoss, "postFirstWin": postFirstWin}


def raffle_without_replacement_brute(p):
    # Enumerate every ordered pair of distinct tickets: index < W is a winner.
    W, L = int(p["W"]), int(p["L"])
    total = W + L
    n = Fraction(0)   # mass of (first=win, second=loss)
    m = Fraction(0)   # mass of (second=loss)
    w = Fraction(1, total * (total - 1))
    for i in range(total):
        for j in range(total):
            if i == j:
                continue
            first_win = i < W
            second_loss = j >= W
            if second_loss:
                m += w
                if first_win:
                    n += w
    return float(n / m)


def three_machine_defect_exact(p):
    shareC = 1 - p["shareA"] - p["shareB"]
    massA = p["shareA"] * p["defA"]
    massB = p["shareB"] * p["defB"]
    massC = shareC * p["defC"]
    totalDef = massA + massB + massC
    postC = massC / totalDef
    return {"shareC": shareC, "massA": massA, "massB": massB, "massC": massC, "totalDef": totalDef, "postC": postC}


def three_machine_defect_brute(p):
    # Enumerate (source, defective?) atoms directly — no Bayes formula.
    shareA = Fraction(str(p["shareA"]))
    shareB = Fraction(str(p["shareB"]))
    shareC = 1 - shareA - shareB
    defA = Fraction(str(p["defA"]))
    defB = Fraction(str(p["defB"]))
    defC = Fraction(str(p["defC"]))
    massA = shareA * defA
    massB = shareB * defB
    massC = shareC * defC
    return float(massC / (massA + massB + massC))


def coin_identification_streak_exact(p):
    k = p["k"]
    pFairK = 0.5 ** k
    pBiasedK = p["pBiased"] ** k
    numBiased = 0.5 * pBiasedK
    numFair = 0.5 * pFairK
    denom = numBiased + numFair
    postBiased = numBiased / denom
    return {"pFairK": pFairK, "pBiasedK": pBiasedK, "numBiased": numBiased, "numFair": numFair,
            "denom": denom, "postBiased": postBiased}


def coin_identification_streak_brute(p):
    # Full enumeration of every flip sequence of length k, for each coin.
    k = int(p["k"])
    pBiased = Fraction(str(p["pBiased"]))
    half = Fraction(1, 2)
    coins = {"biased": pBiased, "fair": half}
    mass_all_heads = {}
    for name, ph in coins.items():
        total = Fraction(0)
        for seq in itertools.product([True, False], repeat=k):
            w = Fraction(1)
            for flip in seq:
                w *= ph if flip else (1 - ph)
            if all(seq):
                total += w
        mass_all_heads[name] = half * total  # prior 0.5 on drawing this coin
    num = mass_all_heads["biased"]
    denom = mass_all_heads["biased"] + mass_all_heads["fair"]
    return float(num / denom)


def taxi_cab_witness_exact(p):
    total = p["blueCount"] + p["greenCount"]
    pBlue = p["blueCount"] / total
    pGreen = p["greenCount"] / total
    missBlue = 1 - p["accGreen"]
    numBlue = pBlue * p["accBlue"]
    numGreenAsBlue = pGreen * missBlue
    denom = numBlue + numGreenAsBlue
    postBlue = numBlue / denom
    return {"total": total, "pBlue": pBlue, "pGreen": pGreen, "missBlue": missBlue,
            "numBlue": numBlue, "numGreenAsBlue": numGreenAsBlue, "denom": denom, "postBlue": postBlue}


def taxi_cab_witness_brute(p):
    # Enumerate (true color, witness says) atoms directly, using exact fleet fractions.
    blueCount, greenCount = int(p["blueCount"]), int(p["greenCount"])
    total = blueCount + greenCount
    pBlue = Fraction(blueCount, total)
    pGreen = Fraction(greenCount, total)
    accBlue = Fraction(str(p["accBlue"]))
    accGreen = Fraction(str(p["accGreen"]))
    missBlue = 1 - accGreen
    numBlue = pBlue * accBlue
    numGreenAsBlue = pGreen * missBlue
    return float(numBlue / (numBlue + numGreenAsBlue))


def dice_face_given_sum_exact(p):
    face, s = int(p["face"]), int(p["s"])
    total = favorable = 0
    for d1 in range(1, 7):
        for d2 in range(1, 7):
            if d1 + d2 == s:
                total += 1
                if d1 == face or d2 == face:
                    favorable += 1
    return {"total": total, "favorable": favorable, "probFace": favorable / total}


def dice_face_given_sum_brute(p):
    # Enumerate the full 36-outcome sample space of two fair dice.
    face, s = int(p["face"]), int(p["s"])
    total = Fraction(0)
    favorable = Fraction(0)
    w = Fraction(1, 36)
    for d1 in range(1, 7):
        for d2 in range(1, 7):
            if d1 + d2 == s:
                total += w
                if d1 == face or d2 == face:
                    favorable += w
    return float(favorable / total)


def survey_overlap_conditional_exact(p):
    return {"pAgivenB": p["countAB"] / p["countB"]}


def survey_overlap_conditional_brute(p):
    # Enumerate the countB morning-person respondents directly.
    countB, countAB = int(p["countB"]), int(p["countAB"])
    return float(Fraction(countAB, countB))


SOLVERS = {
    "bayes/base-rate-test": {"exact": base_rate_exact, "simulate": base_rate_sim},
    "bayes/two-urns": {"exact": two_urns_exact, "brute": two_urns_brute},
    "bayes/two-signal-fraud": {"exact": two_signal_fraud_exact, "brute": two_signal_fraud_brute},
    "bayes/weather-alarm-complement": {"exact": weather_alarm_exact, "brute": weather_alarm_brute},
    "bayes/spam-filter-odds": {"exact": spam_filter_odds_exact, "brute": spam_filter_odds_brute},
    "bayes/strategy-outcome-table": {"exact": strategy_outcome_table_exact, "brute": strategy_outcome_table_brute},
    "bayes/raffle-without-replacement": {"exact": raffle_without_replacement_exact, "brute": raffle_without_replacement_brute},
    "bayes/three-machine-defect": {"exact": three_machine_defect_exact, "brute": three_machine_defect_brute},
    "bayes/coin-identification-streak": {"exact": coin_identification_streak_exact, "brute": coin_identification_streak_brute},
    "bayes/taxi-cab-witness": {"exact": taxi_cab_witness_exact, "brute": taxi_cab_witness_brute},
    "bayes/dice-face-given-sum": {"exact": dice_face_given_sum_exact, "brute": dice_face_given_sum_brute},
    "bayes/survey-overlap-conditional": {"exact": survey_overlap_conditional_exact, "brute": survey_overlap_conditional_brute},
}
