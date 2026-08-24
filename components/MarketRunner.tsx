"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmtNum, isValidQuote, settle, summarizeMarket, type MarketResult } from "@qp/engine";
import { marketRounds } from "@/content/problems/market";
import PnlSparkline from "./charts/PnlSparkline";

const ROUND_S = 25;

// The player quotes in the quantity's OWN scale — 0.75 for a probability, 4.08 for a price in
// dollars, 1001 for a count — matching what the statement asks for and what ProblemRunner
// grades against everywhere else in the app. `unit` never reaches the input: it stays purely a
// scoring normaliser, which is what lets one CREDIT_CAP mean the same thing across templates.
//
// The rejected alternative was quoting IN units, with the input labelled "in percentage
// points". It reads fine on the 82 templates at unit 0.01 and the 52 at unit 1, and badly on
// the other 85: "in units of 0.1" on a question that says "a fair price for one ticket, in
// dollars" (truth $4.08) asks the player to type 40.8, and typing the natural 4.08 quotes a
// tenth of the truth and is picked off for it. A label that contradicts the question is worse
// than no label.

export default function MarketRunner({ seed }: { seed: number }) {
  const rounds = useMemo(() => marketRounds(seed), [seed]);
  const [index, setIndex] = useState(0);
  const [bid, setBid] = useState("");
  const [ask, setAsk] = useState("");
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<MarketResult[]>([]);
  const [settled, setSettled] = useState<MarketResult | null>(null);
  const [remaining, setRemaining] = useState(ROUND_S);
  const endAt = useRef(Date.now() + ROUND_S * 1000);

  const done = index >= rounds.length;
  const round = done ? rounds[rounds.length - 1] : rounds[index];

  const commit = useCallback((r: MarketResult) => {
    setSettled(r);
    setResults((rs) => [...rs, r]);
  }, []);

  // The clock runs only while a round is unsettled. Reading a deadline from a ref rather than
  // counting ticks keeps it honest when the tab is backgrounded and setInterval throttles.
  useEffect(() => {
    if (done || settled) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) commit(settle(null, round.truth, round.unit));
    }, 250);
    return () => clearInterval(t);
  }, [done, settled, round, commit]);

  function submit() {
    const b = Number(bid), a = Number(ask);
    if (bid.trim() === "" || ask.trim() === "" || !isValidQuote(b, a)) { setHint(true); return; }
    commit(settle({ bid: b, ask: a }, round.truth, round.unit));
  }

  function next() {
    setIndex((i) => i + 1);
    setSettled(null); setBid(""); setAsk(""); setHint(false);
    endAt.current = Date.now() + ROUND_S * 1000;
    setRemaining(ROUND_S);
  }

  if (done) {
    const s = summarizeMarket(results);
    return (
      <div className="container" style={{ padding: "56px 24px", maxWidth: 720 }}>
        <p className="microlabel">Session complete</p>
        <h1 className="mono" style={{ fontSize: 38, margin: "8px 0 20px" }} data-testid="total-pnl">
          {s.totalPnl >= 0 ? "+" : ""}{s.totalPnl.toFixed(1)}
        </h1>
        <PnlSparkline pnls={results.map((r) => r.pnl)} totalRounds={rounds.length} />
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", margin: "22px 0" }}>
          <div><p className="microlabel">Picked off</p><b className="mono" style={{ fontSize: 22 }}>{s.pickedOff} / {s.rounds}</b></div>
          <div><p className="microlabel">Avg width (pts)</p><b className="mono" style={{ fontSize: 22 }}>{s.avgWidthUnits.toFixed(1)}</b></div>
          <div><p className="microlabel">Avg centre error (pts)</p><b className="mono" style={{ fontSize: 22 }}>{s.avgCentreErrorUnits.toFixed(1)}</b></div>
        </div>
        <p style={{ maxWidth: "60ch", color: "var(--body)" }} data-testid="diagnosis">{s.diagnosis}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="microlabel" data-testid="round-counter">Round {index + 1} of {rounds.length}</span>
        <span className="mono" style={{ fontSize: 22 }}>{settled ? "—" : `0:${String(remaining).padStart(2, "0")}`}</span>
        <span className="microlabel">P&amp;L <b className="mono">{results.reduce((a, r) => a + r.pnl, 0).toFixed(1)}</b></span>
      </div>
      <PnlSparkline pnls={results.map((r) => r.pnl)} totalRounds={rounds.length} />
      <p style={{ fontSize: 17, margin: "20px 0", lineHeight: 1.5 }}>{round.statement}</p>

      {settled ? (
        <div>
          <p data-testid="settlement" style={{ fontSize: 16 }}>
            {!settled.quoted
              ? "You did not quote."
              : settled.traded === "lifted" ? `Bot lifts your offer. Truth ${fmtNum(round.truth)}.`
              : settled.traded === "hit" ? `Bot hits your bid. Truth ${fmtNum(round.truth)}.`
              : `No trade — truth ${fmtNum(round.truth)} landed inside your market.`}
          </p>
          <p className="mono" style={{ fontSize: 30, margin: "10px 0" }} data-testid="round-pnl">
            {settled.pnl >= 0 ? "+" : ""}{settled.pnl.toFixed(1)}
          </p>
          <button onClick={next} style={{ padding: "8px 18px" }}>
            {index + 1 === rounds.length ? "See results" : "Next round"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <label><span className="microlabel">Your bid</span><br />
            <input aria-label="bid" className="mono" value={bid} inputMode="decimal"
                   onChange={(e) => { setBid(e.target.value); setHint(false); }} style={{ width: 90 }} /></label>
          <span style={{ opacity: 0.4, paddingBottom: 6 }}>@</span>
          <label><span className="microlabel">Your ask</span><br />
            <input aria-label="ask" className="mono" value={ask} inputMode="decimal"
                   onChange={(e) => { setAsk(e.target.value); setHint(false); }} style={{ width: 90 }} /></label>
          <button onClick={submit} style={{ padding: "8px 18px" }}>Quote</button>
        </div>
      )}
      <p data-testid={hint ? "quote-hint" : undefined} aria-live="polite" className="mono"
         style={{ color: "var(--bad)", fontSize: 12, minHeight: 18, marginTop: 10 }}>
        {hint ? "bid and ask must both be numbers, and the ask cannot be below the bid" : ""}
      </p>
    </div>
  );
}
