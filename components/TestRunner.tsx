"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { answerCurrent, makeRng, parseAnswer, skipCurrent, startSession, summarize, type Item, type Preset, type SessionState, type Summary } from "@qp/engine";
import { arithmeticItem, sequenceItem } from "@qp/generators";
import Results from "./Results";

function generate(preset: Preset, seed: number): Item[] {
  const rng = makeRng(seed);
  const make = (i: number) =>
    preset.topic === "arithmetic" ? arithmeticItem(rng, preset.difficulty(i)) : sequenceItem(rng, preset.difficulty(i));
  const items: Item[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < preset.count; i++) {
    let item = make(i);
    for (let tries = 0; tries < 20 && seen.has(item.id); tries++) item = make(i);
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

export default function TestRunner({ preset, seed, onDone }: { preset: Preset; seed: number; onDone: (s: Summary) => void }) {
  const items = useMemo(() => generate(preset, seed), [preset, seed]);
  const [state, setState] = useState<SessionState>(() => startSession(preset, items, seed));
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [remaining, setRemaining] = useState(preset.durationS);
  const qStart = useRef(Date.now());
  const endAt = useRef(Date.now() + preset.durationS * 1000);
  const doneRef = useRef(false);

  const finish = useCallback((s: SessionState) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(summarize(s));
  }, [onDone]);

  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setState((s) => (s.finished ? s : { ...s, finished: true }));
    }, 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (state.finished) finish(state); }, [state, finish]);

  if (state.finished) return <Results summary={summarize(state)} preset={preset} items={items} state={state} />;

  const item = state.items[state.index];
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  function submit() {
    const parsed = parseAnswer(value);
    if (value.trim() !== "" && parsed === null) {
      setShowHint(true); // typo — do not burn the question (no backtracking)
      return;
    }
    const elapsed = Date.now() - qStart.current;
    qStart.current = Date.now();
    setState((s) => (parsed === null ? skipCurrent(s, elapsed) : answerCurrent(s, parsed, elapsed)));
    setValue("");
    setShowHint(false);
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: "var(--card-border)" }}>
        <div style={{ height: "100%", width: `${(state.index / preset.count) * 100}%`, background: "var(--teal)" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <p className="mono" style={{ color: "var(--teal)", fontSize: 14 }}>
          {mm}:{ss} · Q{state.index + 1}/{preset.count} · +{preset.scoring.correct} / {preset.scoring.wrong}
        </p>
        <p data-testid="prompt" className="mono" style={{ fontSize: 40, fontWeight: 600, margin: "22px 0 8px" }}>{item.prompt}</p>
        <input
          aria-label="answer"
          autoFocus
          inputMode={preset.topic === "sequences" ? "text" : "decimal"}
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowHint(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="mono"
          style={{ border: "none", borderBottom: "2px solid var(--teal)", background: "transparent", textAlign: "center", fontSize: 24, width: 220, color: "var(--ink)" }}
        />
        {showHint && <p data-testid="parse-hint" className="mono" style={{ color: "var(--bad)", fontSize: 12, marginTop: 8 }}>couldn't read that answer</p>}
        <p className="microlabel" style={{ marginTop: 20 }}>Enter submits · empty Enter skips · no backtracking</p>
      </div>
    </div>
  );
}
