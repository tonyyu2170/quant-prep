/** The player's two-way quote, in the quantity's own scale (not scaled units). */
export interface Quote { bid: number; ask: number }

export interface MarketResult {
  /** false when no trade happened — either truth landed inside, or no quote was made. */
  traded: false | "lifted" | "hit";
  /** Distinguishes "quoted a market nobody traded" from "never quoted". */
  quoted: boolean;
  widthUnits: number;
  centreErrorUnits: number;
  pnl: number;
}

// MEASURED, NOT INVENTED (spec §5). Under the unit rule in content/problems/market.ts the
// median inter-quartile answer spread across the 219 eligible templates is 35.8 units
// (re-measured over the bank on 2026-08-24; quartile range 21.9 to 66.2). A cap at 40
// therefore makes a market as wide as the typical uncertainty worth nothing, so credit is
// earned only by quoting tighter than the quantity's own spread.
//
// This value is what keeps the two degenerate strategies unattractive without banning them:
// quoting absurdly wide floors at 0 (legal, worthless), and refusing to quote costs a full 40
// (strictly worse than quoting wide, which is the point — a market maker who will not quote is
// worse than one who quotes badly).
//
// TUNED, 2026-08-24, with tools/market-tune.ts — re-run it if you change this. Modelling a
// player whose centre lands at truth + Normal(0, sigma) units and who picks a half-width h:
//
//   cap  break-even skill   a sigma=10 player earns   a sigma=30 player earns
//    20      sigma ~ 10              +0.29                    -15.04
//    40      sigma ~ 20             +12.01                     -7.99
//    80      beyond sigma 30        +42.92                    +11.31
//
// 20 demands estimating inside ~13% of a template's spread to break even; 80 pays almost
// everyone and removes the pressure entirely. 40 puts break-even near sigma 20 — about 27% of
// the typical 75-unit p5-p95 spread. Both degenerate strategies lose at every skill level:
// zero width is always negative, and the widest earning market (h = cap/2) tops out at 0.00.
//
// COUPLED TO THE DIAGNOSIS BELOW: 33% is the optimal pick-off rate at cap 40 for a mid-skill
// player, which is why summarizeMarket tells the player to aim for about a third and treats
// rate > 1/3 as too tight. At cap 20 that optimum is 32% for a sigma=5 player and at cap 80 it
// is 33% for sigma=20 — the number moves with the cap AND the skill. Change CREDIT_CAP and the
// one-third advice has to be re-derived, not carried over.
export const CREDIT_CAP = 40;

/** Inverted quotes are refused at the input rather than scored. Zero width is legal. */
export function isValidQuote(bid: number, ask: number): boolean {
  return Number.isFinite(bid) && Number.isFinite(ask) && ask >= bid;
}

export function settle(quote: Quote | null, truth: number, unit: number): MarketResult {
  if (quote === null) {
    return { traded: false, quoted: false, widthUnits: 0, centreErrorUnits: 0, pnl: -CREDIT_CAP };
  }
  const { bid, ask } = quote;
  const widthUnits = (ask - bid) / unit;
  const centreErrorUnits = Math.abs((bid + ask) / 2 - truth) / unit;
  const base = { quoted: true as const, widthUnits, centreErrorUnits };
  if (truth > ask) return { ...base, traded: "lifted", pnl: (ask - truth) / unit };
  if (truth < bid) return { ...base, traded: "hit", pnl: (truth - bid) / unit };
  return { ...base, traded: false, pnl: Math.max(0, CREDIT_CAP - widthUnits) };
}

export interface MarketSummary {
  rounds: number;
  totalPnl: number;
  pickedOff: number;
  avgWidthUnits: number;
  avgCentreErrorUnits: number;
  diagnosis: string;
}

// A bare P&L cannot distinguish the two opposite mistakes, which have opposite fixes. The
// thresholds: a third is the pick-off rate above which width is not paying for the risk it
// takes, and a market only earns anything at all below CREDIT_CAP wide.
//
// Both branches name the mistake in the same words the reader would use for it ("too tight",
// "too wide"), which is also what the tests pin — a diagnosis that described the symptom
// without naming the error read as advice about someone else's session.
export function summarizeMarket(results: readonly MarketResult[]): MarketSummary {
  const rounds = results.length;
  const mean = (f: (r: MarketResult) => number) =>
    rounds === 0 ? 0 : results.reduce((a, r) => a + f(r), 0) / rounds;
  const pickedOff = results.filter((r) => r.traded !== false).length;
  const avgWidthUnits = mean((r) => r.widthUnits);
  const avgCentreErrorUnits = mean((r) => r.centreErrorUnits);
  const rate = rounds === 0 ? 0 : pickedOff / rounds;

  let diagnosis =
    "Balanced — your width is roughly matched to how well you are centred. Push tighter and watch the pick-off rate.";
  if (rounds === 0) {
    diagnosis = "No rounds played.";
  } else if (rate > 1 / 3) {
    diagnosis = `Your markets are too tight for how well you are centred. A width of ${avgWidthUnits.toFixed(1)} only pays if your centre is usually within ${(avgWidthUnits / 2).toFixed(1)} — yours is off by ${avgCentreErrorUnits.toFixed(1)}. Widen until the pick-off rate falls under a third, then work on centring.`;
  } else if (avgWidthUnits >= CREDIT_CAP) {
    diagnosis = `Your markets are too wide to earn. You are rarely picked off, but at an average width of ${avgWidthUnits.toFixed(1)} there is nothing left to collect — credit runs out at ${CREDIT_CAP}. Tighten until you start getting picked off about a third of the time.`;
  }

  return {
    rounds,
    totalPnl: results.reduce((a, r) => a + r.pnl, 0),
    pickedOff,
    avgWidthUnits,
    avgCentreErrorUnits,
    diagnosis,
  };
}
