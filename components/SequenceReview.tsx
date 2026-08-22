"use client";
import { useMemo, useRef, useState } from "react";
import { grade, makeRng, parseAnswer } from "@qp/engine";
import { sequenceItemOfFamily, type SeqFamily } from "@qp/generators";
import { getStore } from "@/lib/store/useStore";

/**
 * One review of a sequence pattern family, regenerated with fresh terms.
 *
 * Deliberately not DrillRunner: that component is an endless session with its own difficulty
 * selector, streak and advance loop. This grades exactly one item and reports the result.
 */
export default function SequenceReview({ family, difficulty, onGraded, onNext }: {
  family: SeqFamily; difficulty: 1 | 2 | 3; onGraded: (correct: boolean) => void; onNext: () => void;
}) {
  const item = useMemo(() => sequenceItemOfFamily(makeRng(Math.floor(Math.random() * 2 ** 31)), family, difficulty), [family, difficulty]);
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState<null | boolean>(null);
  const qStart = useRef(Date.now());

  function submit() {
    const parsed = parseAnswer(value);
    if (parsed === null) { if (value.trim() !== "") setShowHint(true); return; }
    const ok = grade(parsed, item.answer);
    getStore().saveAttempts([{
      problemId: item.id, problemVersion: 1, seed: 0, mode: "review",
      topic: "sequences", answer: value, correct: ok, timeMs: Date.now() - qStart.current,
      sessionId: null, createdAt: new Date().toISOString(),
    }]).catch(() => {});
    onGraded(ok);
    setDone(ok);
  }

  return (
    <div>
      <p className="microlabel">sequences · {family} · L{difficulty}</p>
      <p id="review-prompt" data-testid="prompt" className="mono" style={{ fontSize: 32, fontWeight: 600, margin: "30px 0 16px" }}>{item.prompt}</p>
      {done === null ? (
        <>
          <input
            aria-label="answer" aria-describedby="review-prompt" autoFocus inputMode="text" value={value}
            onChange={(e) => { setValue(e.target.value); setShowHint(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat) submit(); }}
            className="mono"
            style={{ border: "1.5px solid var(--card-border)", background: "var(--surface)", borderRadius: 8, padding: "10px 14px", fontSize: 18, width: 220 }}
          />
          <p data-testid={showHint ? "parse-hint" : undefined} aria-live="polite" className="mono" style={{ color: "var(--bad)", fontSize: 12, marginTop: 8, minHeight: 18 }}>{showHint ? "couldn't read that answer" : ""}</p>
        </>
      ) : (
        <div data-testid="feedback" tabIndex={0} ref={(el) => el?.focus()}
             onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat) onNext(); }}
             style={{ borderTop: `2px solid ${done ? "var(--good)" : "var(--bad)"}`, paddingTop: 12 }}>
          <p className="mono" style={{ color: done ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>
            {done ? "✓ CORRECT" : `✗ ANSWER: ${item.answer}`}
          </p>
          {item.rule && <p data-testid="rule" style={{ color: "var(--body)", marginTop: 6, fontSize: 14 }}>{item.rule}</p>}
          <p className="microlabel" style={{ marginTop: 12 }}>Enter for next</p>
        </div>
      )}
    </div>
  );
}
