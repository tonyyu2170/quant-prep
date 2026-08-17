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
    total = p["countB"] + p["nonMorning"]
    return {"total": total, "pAgivenB": p["countAB"] / p["countB"]}


def survey_overlap_conditional_brute(p):
    # Enumerate the countB morning-person respondents directly.
    countB, countAB = int(p["countB"]), int(p["countAB"])
    return float(Fraction(countAB, countB))


def prosecutors_fallacy_match_exact(p):
    others = p["pop"] - 1
    falseMatchMass = p["q"] * others
    denom = 1 + falseMatchMass
    postGuilty = 1 / denom
    postInnocent = falseMatchMass / denom
    return {"others": others, "falseMatchMass": falseMatchMass, "denom": denom,
            "postGuilty": postGuilty, "postInnocent": postInnocent}


def prosecutors_fallacy_match_brute(p):
    # Enumerate the population's match-mass directly: the guilty candidate matches with
    # certainty (mass 1/pop); each of the other candidates matches by chance with probability q.
    pop = int(p["pop"])
    q = Fraction(str(p["q"]))
    n = pop - 1
    mass_guilty_match = Fraction(1, pop)
    mass_innocent_match = Fraction(n, pop) * q
    mass_match = mass_guilty_match + mass_innocent_match
    return float(mass_innocent_match / mass_match)


def card_draw_without_replacement_exact(p):
    total = p["aces"] + p["others"]
    remaining = total - 1
    remainingAces = p["aces"] - 1
    pSecondAce = remainingAces / remaining
    return {"total": total, "remaining": remaining, "remainingAces": remainingAces, "pSecondAce": pSecondAce}


def card_draw_without_replacement_brute(p):
    # Enumerate every ordered pair of distinct cards: index < aces is an ace.
    aces, others = int(p["aces"]), int(p["others"])
    total = aces + others
    w = Fraction(1, total * (total - 1))
    num = Fraction(0)  # first ace, second ace
    den = Fraction(0)  # first ace
    for i in range(total):
        for j in range(total):
            if i == j:
                continue
            first_ace = i < aces
            second_ace = j < aces
            if first_ace:
                den += w
                if second_ace:
                    num += w
    return float(num / den)


def three_coin_at_least_one_head_exact(p):
    tailProb = 1 - p["headProb"]
    pAllTails = tailProb ** 3
    pAtLeastOne = 1 - pAllTails
    pOneTwoHeadSeq = p["headProb"] ** 2 * tailProb
    pExactlyTwo = 3 * pOneTwoHeadSeq
    postExactlyTwo = pExactlyTwo / pAtLeastOne
    return {"tailProb": tailProb, "pAllTails": pAllTails, "pAtLeastOne": pAtLeastOne,
            "pOneTwoHeadSeq": pOneTwoHeadSeq, "pExactlyTwo": pExactlyTwo, "postExactlyTwo": postExactlyTwo}


def three_coin_at_least_one_head_brute(p):
    # Enumerate all eight three-flip sequences with exact Fraction weights.
    hp = Fraction(str(p["headProb"]))
    tp = 1 - hp
    num = Fraction(0)  # exactly two heads
    den = Fraction(0)  # at least one head
    for a in (1, 0):
        for b in (1, 0):
            for c in (1, 0):
                heads = a + b + c
                prob = (hp if a else tp) * (hp if b else tp) * (hp if c else tp)
                if heads >= 1:
                    den += prob
                    if heads == 2:
                        num += prob
    return float(num / den)


def bookmaker_odds_update_exact(p):
    denomOdds = p["againstOdds"] + 1
    priorProb = 1 / denomOdds
    complement = p["againstOdds"] / denomOdds
    priorOdds = priorProb / complement
    postOdds = priorOdds * p["likelihoodRatio"]
    onePlusPostOdds = postOdds + 1
    postProb = postOdds / onePlusPostOdds
    return {"denomOdds": denomOdds, "priorProb": priorProb, "complement": complement,
            "priorOdds": priorOdds, "postOdds": postOdds, "onePlusPostOdds": onePlusPostOdds, "postProb": postProb}


def bookmaker_odds_update_brute(p):
    # Independent Fraction recomputation of the odds conversion and update.
    A = Fraction(int(p["againstOdds"]))
    LR = Fraction(str(p["likelihoodRatio"]))
    denomOdds = A + 1
    priorProb = Fraction(1) / denomOdds
    complement = A / denomOdds
    priorOdds = priorProb / complement
    postOdds = priorOdds * LR
    return float(postOdds / (postOdds + 1))


def three_box_unequal_prior_exact(p):
    p3 = 1 - p["p1"] - p["p2"]
    halfP1 = 0.5 * p["p1"]
    denom = halfP1 + p3
    postBox3 = p3 / denom
    return {"p3": p3, "halfP1": halfP1, "denom": denom, "postBox3": postBox3}


def three_box_unequal_prior_brute(p):
    # True enumeration over (prize location, coin-flip) atoms with Fraction weights, applying
    # the stated host procedure atom-by-atom — no Bayes formula anywhere.
    p1 = Fraction(str(p["p1"]))
    p2 = Fraction(str(p["p2"]))
    p3 = 1 - p1 - p2
    half = Fraction(1, 2)
    priors = {"box1": p1, "box2": p2, "box3": p3}
    mass_open2 = Fraction(0)
    mass_open2_and_box3 = Fraction(0)
    for prize, prior in priors.items():
        for coin in ("heads", "tails"):
            atom_mass = prior * half
            # Host never opens the contestant's box (box1) or the prize box.
            if prize == "box1":
                # Both box2 and box3 are empty — the coin flip breaks the tie.
                opens = "box2" if coin == "heads" else "box3"
            elif prize == "box2":
                opens = "box3"  # box3 is the only empty non-chosen box (forced)
            else:
                opens = "box2"  # box2 is the only empty non-chosen box (forced)
            if opens == "box2":
                mass_open2 += atom_mass
                if prize == "box3":
                    mass_open2_and_box3 += atom_mass
    return float(mass_open2_and_box3 / mass_open2)


def dice_max_given_threshold_exact(p):
    x, m = int(p["x"]), int(p["m"])
    complementCount = 0
    favorable = 0
    for d1 in range(1, 7):
        for d2 in range(1, 7):
            if d1 < x and d2 < x:
                complementCount += 1
            if max(d1, d2) == m:
                favorable += 1
    total = 36 - complementCount
    probMax = favorable / total
    probMaxUnconditional = favorable / 36
    return {"complementCount": complementCount, "total": total, "favorable": favorable,
            "probMax": probMax, "probMaxUnconditional": probMaxUnconditional}


def dice_max_given_threshold_brute(p):
    # Enumerate the full 36-outcome sample space of two fair dice.
    x, m = int(p["x"]), int(p["m"])
    w = Fraction(1, 36)
    total = Fraction(0)
    favorable = Fraction(0)
    for d1 in range(1, 7):
        for d2 in range(1, 7):
            if max(d1, d2) >= x:
                total += w
                if max(d1, d2) == m:
                    favorable += w
    return float(favorable / total)


def two_children_at_least_one_boy_exact(p):
    qComplement = 1 - p["q"]
    pBB = p["q"] * p["q"]
    pBG = p["q"] * qComplement
    qComplementSq = qComplement * qComplement
    pAtLeastOneBoy = 1 - qComplementSq
    postBothBoys = pBB / pAtLeastOneBoy
    twoMinusQ = 2 - p["q"]
    return {"qComplement": qComplement, "pBB": pBB, "pBG": pBG, "qComplementSq": qComplementSq,
            "pAtLeastOneBoy": pAtLeastOneBoy, "postBothBoys": postBothBoys, "twoMinusQ": twoMinusQ}


def two_children_at_least_one_boy_brute(p):
    # Enumerate the four birth-order outcomes BB, BG, GB, GG with exact Fraction weights.
    q = Fraction(str(p["q"]))
    g = 1 - q
    outcomes = {"BB": q * q, "BG": q * g, "GB": g * q, "GG": g * g}
    at_least_one = outcomes["BB"] + outcomes["BG"] + outcomes["GB"]
    return float(outcomes["BB"] / at_least_one)


def coffee_supplier_all_pass_exact(p):
    priorB = 1 - p["priorA"]
    passA = 1 - p["defA"]
    passB = 1 - p["defB"]
    passAn = passA ** p["n"]
    passBn = passB ** p["n"]
    numA = p["priorA"] * passAn
    numB = priorB * passBn
    denom = numA + numB
    postA = numA / denom
    return {"priorB": priorB, "passA": passA, "passB": passB, "passAn": passAn, "passBn": passBn,
            "numA": numA, "numB": numB, "denom": denom, "postA": postA}


def coffee_supplier_all_pass_brute(p):
    # Enumerate (supplier, all-n-pass?) atoms directly via exact Fraction powers.
    n = int(p["n"])
    priorA = Fraction(str(p["priorA"]))
    priorB = 1 - priorA
    passA = 1 - Fraction(str(p["defA"]))
    passB = 1 - Fraction(str(p["defB"]))
    numA = priorA * passA ** n
    numB = priorB * passB ** n
    return float(numA / (numA + numB))


def airport_two_stage_screening_exact(p):
    legit = 1 - p["prior"]
    hitProduct = p["sens1"] * p["sens2"]
    fpProduct = p["fpr1"] * p["fpr2"]
    threatMass = p["prior"] * hitProduct
    clearMass = legit * fpProduct
    denom = threatMass + clearMass
    post2 = threatMass / denom
    return {"legit": legit, "hitProduct": hitProduct, "fpProduct": fpProduct,
            "threatMass": threatMass, "clearMass": clearMass, "denom": denom, "post2": post2}


def airport_two_stage_screening_brute(p):
    # Enumerate (threat?, flag1, flag2) joint atoms directly — no sequential chaining.
    prior = Fraction(str(p["prior"]))
    sens1 = Fraction(str(p["sens1"]))
    fpr1 = Fraction(str(p["fpr1"]))
    sens2 = Fraction(str(p["sens2"]))
    fpr2 = Fraction(str(p["fpr2"]))
    legit = 1 - prior
    both_threat = prior * sens1 * sens2
    both_legit = legit * fpr1 * fpr2
    return float(both_threat / (both_threat + both_legit))


def network_outage_joint_alerts_exact(p):
    legit = 1 - p["prior"]
    productD = p["pS1D"] * p["pS2D"]
    jointD = p["boostD"] * productD
    numD = p["prior"] * jointD
    numND = legit * p["jointND"]
    denom = numD + numND
    postD = numD / denom
    return {"legit": legit, "productD": productD, "jointD": jointD, "numD": numD,
            "numND": numND, "denom": denom, "postD": postD}


def network_outage_joint_alerts_brute(p):
    # Use the given joint conditionals directly (never the marginal product) as Fraction masses.
    prior = Fraction(str(p["prior"]))
    legit = 1 - prior
    pS1D = Fraction(str(p["pS1D"]))
    pS2D = Fraction(str(p["pS2D"]))
    boostD = Fraction(str(p["boostD"]))
    jointD = boostD * pS1D * pS2D
    jointND = Fraction(str(p["jointND"]))
    numD = prior * jointD
    numND = legit * jointND
    return float(numD / (numD + numND))


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
    "bayes/prosecutors-fallacy-match": {"exact": prosecutors_fallacy_match_exact, "brute": prosecutors_fallacy_match_brute},
    "bayes/card-draw-without-replacement": {"exact": card_draw_without_replacement_exact, "brute": card_draw_without_replacement_brute},
    "bayes/three-coin-at-least-one-head": {"exact": three_coin_at_least_one_head_exact, "brute": three_coin_at_least_one_head_brute},
    "bayes/bookmaker-odds-update": {"exact": bookmaker_odds_update_exact, "brute": bookmaker_odds_update_brute},
    "bayes/three-box-unequal-prior": {"exact": three_box_unequal_prior_exact, "brute": three_box_unequal_prior_brute},
    "bayes/dice-max-given-threshold": {"exact": dice_max_given_threshold_exact, "brute": dice_max_given_threshold_brute},
    "bayes/two-children-at-least-one-boy": {"exact": two_children_at_least_one_boy_exact, "brute": two_children_at_least_one_boy_brute},
    "bayes/coffee-supplier-all-pass": {"exact": coffee_supplier_all_pass_exact, "brute": coffee_supplier_all_pass_brute},
    "bayes/airport-two-stage-screening": {"exact": airport_two_stage_screening_exact, "brute": airport_two_stage_screening_brute},
    "bayes/network-outage-joint-alerts": {"exact": network_outage_joint_alerts_exact, "brute": network_outage_joint_alerts_brute},
}
