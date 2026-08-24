"use client";
import { useMemo, useState } from "react";
import {
  combineFactors, fmtNum, isValidFactor, naiveProduct, scoreChain, summarizeCalibration,
  type CalibrationResult, type Factor,
} from "@qp/engine";
import { fermiSession } from "@/content/fermi";
import { appendAnswers, readCalibration } from "@/lib/store/calibration";
import CalibrationCurve from "./charts/CalibrationCurve";

const ROUNDS = 8;
type Row = { label: string; lo: string; hi: string };
const blankRow = (): Row => ({ label: "", lo: "", hi: "" });
const logW = (lo: number, hi: number) => Math.log10(hi) - Math.log10(lo);

export default function FermiRunner({ seed }: { seed: number }) {
  const items = useMemo(() => fermiSession(seed, ROUNDS), [seed]);
  const [index, setIndex] = useState(0);
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<CalibrationResult[]>([]);
  const [settled, setSettled] = useState<ReturnType<typeof scoreChain> | null>(null);

  const parsed = (): Factor[] | null => {
    const out: Factor[] = [];
    for (const [i, r] of rows.entries()) {
      const lo = Number(r.lo), hi = Number(r.hi);
      if (r.lo.trim() === "" || r.hi.trim() === "" || !isValidFactor(lo, hi)) return null;
      out.push({ label: r.label.trim() || `factor ${i + 1}`, lo, hi });
    }
    return out.length ? out : null;
  };

  function submit() {
    const factors = parsed();
    if (!factors) { setHint(true); return; }
    setSettled(scoreChain(factors, items[index].truth.value));
  }

  function next() {
    if (settled) {
      const { score, hit, logWidth, logCentreError } = settled;
      const row = { score, hit, logWidth, logCentreError };
      setResults((rs) => [...rs, row]);
      appendAnswers([row]);            // history is per ANSWER, not per session
    }
    setIndex((i) => i + 1);
    setSettled(null); setRows([blankRow()]); setHint(false);
  }

  if (index >= items.length) {
    const s = summarizeCalibration(results);
    const lifetime = summarizeCalibration(readCalibration());
    return (
      <div className="container" style={{ padding: "56px 24px", maxWidth: 720 }}>
        <p className="microlabel">Session complete</p>
        <h1 className="mono" style={{ fontSize: 38, margin: "8px 0 16px" }} data-testid="hit-rate">
          {s.hits} / {s.answered}
        </h1>
        <CalibrationCurve rows={readCalibration()} />
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", margin: "22px 0" }}>
          <div><p className="microlabel">Median width</p><b className="mono" style={{ fontSize: 22 }}>{s.medianLogWidth.toFixed(1)}</b><span className="microlabel"> orders</span></div>
          <div><p className="microlabel">Median centre error</p><b className="mono" style={{ fontSize: 22 }}>{s.medianLogCentreError.toFixed(2)}</b></div>
          <div><p className="microlabel">Median score</p><b className="mono" style={{ fontSize: 22 }}>{s.medianScore.toFixed(2)}</b></div>
        </div>
        <p style={{ maxWidth: "60ch", color: "var(--body)" }} data-testid="diagnosis">{lifetime.diagnosis}</p>
      </div>
    );
  }

  const item = items[index];
  const preview = parsed();
  const naive = settled ? naiveProduct(preview ?? []) : null;
  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="microlabel" data-testid="question-counter">Question {index + 1} of {items.length}</span>
        <span className="microlabel">90% intervals</span>
      </div>
      <p style={{ fontSize: 17, margin: "18px 0", lineHeight: 1.5 }}>{item.statement}</p>

      {settled ? (
        <div>
          <p data-testid="settlement" style={{ fontSize: 16 }}>
            {settled.hit ? "Inside your interval." : "Outside your interval."}{" "}
            Truth: <b className="mono">{fmtNum(Math.round(item.truth.value))}</b> {item.unitLabel}.
          </p>
          <p className="mono" style={{ fontSize: 15, margin: "10px 0" }}>
            your range {fmtNum(settled.combined.lo)} – {fmtNum(settled.combined.hi)} · score{" "}
            <b>{settled.score.toFixed(2)}</b> <span className="microlabel">(lower is better)</span>
          </p>
          {/* The quadrature lesson, shown rather than asserted. */}
          <p style={{ fontSize: 14, color: "var(--body)", maxWidth: "62ch" }}>
            Multiplying your endpoints spans{" "}
            <b className="mono" data-testid="naive-width">{logW(naive!.lo, naive!.hi).toFixed(1)}</b>{" "}
            orders of magnitude. Your stated beliefs actually imply{" "}
            <b className="mono" data-testid="combined-width">{settled.logWidth.toFixed(1)}</b>{" "}
            — uncertainty adds in quadrature, not linearly, because independent errors do not all
            point the same way. Assumes your factors are independent.
          </p>
          <div data-testid="canonical-chain" style={{ margin: "18px 0", borderTop: "1px solid var(--rule)" }}>
            <p className="microlabel" style={{ marginTop: 10 }}>One way to decompose it</p>
            {item.chain.map((f) => (
              <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
                <span>{f.label}</span>
                <span className="mono">{fmtNum(f.value)}</span>
              </div>
            ))}
          </div>
          <button onClick={next} style={{ padding: "8px 18px" }}>
            {index + 1 === items.length ? "See results" : "Next question"}
          </button>
        </div>
      ) : (
        <div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 8 }}>
              <label style={{ flex: 1 }}><span className="microlabel">What it is</span><br />
                <input aria-label={`factor ${i + 1} label`} value={r.label} style={{ width: "100%" }}
                       onChange={(e) => { const v = [...rows]; v[i] = { ...r, label: e.target.value }; setRows(v); setHint(false); }} /></label>
              <label><span className="microlabel">Low</span><br />
                <input aria-label={`factor ${i + 1} low`} className="mono" inputMode="decimal" value={r.lo} style={{ width: 90 }}
                       onChange={(e) => { const v = [...rows]; v[i] = { ...r, lo: e.target.value }; setRows(v); setHint(false); }} /></label>
              <label><span className="microlabel">High</span><br />
                <input aria-label={`factor ${i + 1} high`} className="mono" inputMode="decimal" value={r.hi} style={{ width: 90 }}
                       onChange={(e) => { const v = [...rows]; v[i] = { ...r, hi: e.target.value }; setRows(v); setHint(false); }} /></label>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
            <button onClick={() => setRows((v) => [...v, blankRow()])} style={{ padding: "6px 14px" }}>Add factor</button>
            <button onClick={submit} style={{ padding: "8px 18px" }}>Submit estimate</button>
            {preview && (
              <span className="microlabel">
                implies {fmtNum(combineFactors(preview).lo)} – {fmtNum(combineFactors(preview).hi)}
              </span>
            )}
          </div>
        </div>
      )}
      <p data-testid={hint ? "chain-hint" : undefined} aria-live="polite" className="mono"
         style={{ color: "var(--bad)", fontSize: 12, minHeight: 18, marginTop: 10 }}>
        {hint ? "every factor needs a low and a high, both greater than zero, with high at least the low" : ""}
      </p>
    </div>
  );
}
