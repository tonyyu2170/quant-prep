"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { grade, makeRng, parseAnswer, type Item, type Topic } from "@qp/engine";
import { arithmeticItem, sequenceItem } from "@qp/generators";
import { getStore } from "@/lib/store/useStore";

type Feedback = { ok: boolean; item: Item } | null;

export default function DrillRunner({ topic }: { topic: Topic }) {
  // Hydration-safe: randomness only exists client-side, after mount.
  const [seed, setSeed] = useState<number | null>(null);
  useEffect(() => { setSeed(Math.floor(Math.random() * 2 ** 31)); }, []);
  if (seed === null) return null;
  return <DrillSession topic={topic} seed={seed} />;
}

function DrillSession({ topic, seed }: { topic: Topic; seed: number }) {
  const rng = useMemo(() => makeRng(seed), [seed]);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const next = () => (topic === "arithmetic" ? arithmeticItem(rng, difficulty) : sequenceItem(rng, difficulty));
  const [item, setItem] = useState<Item>(next);
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [streak, setStreak] = useState(0);
  const qStart = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const parsed = parseAnswer(value);
    if (parsed === null) {
      if (value.trim() !== "") setShowHint(true);
      return;
    }
    const ok = grade(parsed, item.answer);
    getStore().saveAttempts([{
      problemId: item.id, problemVersion: 1, seed, mode: "practice",
      topic, answer: value, correct: ok, timeMs: Date.now() - qStart.current,
      sessionId: null, createdAt: new Date().toISOString(),
    }]).catch(() => {});
    setFeedback({ ok, item });
    setStreak((s) => (ok ? s + 1 : 0));
    setShowHint(false);
  }

  function advance() {
    let n = next();
    for (let tries = 0; tries < 5 && n.prompt === item.prompt; tries++) n = next();
    setItem(n);
    setValue("");
    setFeedback(null);
    qStart.current = Date.now();
  }

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p className="microlabel">{topic} drill · endless</p>
        <p className="mono" style={{ fontSize: 12 }}>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === difficulty}
              onClick={() => { setDifficulty(d as 1 | 2 | 3); inputRef.current?.focus(); }}
              style={{ background: "none", border: "none", marginLeft: 12, color: d === difficulty ? "var(--teal)" : "var(--faint)", fontWeight: d === difficulty ? 700 : 400, borderBottom: d === difficulty ? "2px solid var(--teal)" : "none" }}
            >
              L{d}
            </button>
          ))}
          <span style={{ marginLeft: 18, color: "var(--muted)" }}>streak {streak}</span>
        </p>
      </div>
      <p id="drill-prompt" data-testid="prompt" className="mono" style={{ fontSize: 32, fontWeight: 600, margin: "34px 0 16px" }}>{item.prompt}</p>
      {feedback === null ? (
        <>
          <input
            ref={inputRef}
            aria-label="answer" aria-describedby="drill-prompt" autoFocus inputMode={topic === "sequences" ? "text" : "decimal"} value={value}
            onChange={(e) => { setValue(e.target.value); setShowHint(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat) submit(); }}
            className="mono"
            style={{ border: "1.5px solid var(--card-border)", background: "var(--surface)", borderRadius: 8, padding: "10px 14px", fontSize: 18, width: 220 }}
          />
          <p data-testid={showHint ? "parse-hint" : undefined} aria-live="polite" className="mono" style={{ color: "var(--bad)", fontSize: 12, marginTop: 8, minHeight: 18 }}>{showHint ? "couldn't read that answer" : ""}</p>
        </>
      ) : (
        <div data-testid="feedback" style={{ borderTop: `2px solid ${feedback.ok ? "var(--good)" : "var(--bad)"}`, paddingTop: 12 }}
             onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat) advance(); }} tabIndex={0} ref={(el) => el?.focus()}>
          <p className="mono" style={{ color: feedback.ok ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>
            {feedback.ok ? "✓ CORRECT" : `✗ ANSWER: ${feedback.item.answer}`}
          </p>
          {feedback.item.rule && <p data-testid="rule" style={{ color: "var(--body)", marginTop: 6, fontSize: 14 }}>{feedback.item.rule}</p>}
          <p className="microlabel" style={{ marginTop: 12 }}>Enter for next</p>
        </div>
      )}
    </div>
  );
}
