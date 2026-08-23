"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { answerLabel, answerOf, drawParams, fmtNum, grade, parseAnswerExpr, type ProblemTemplate } from "@qp/engine";
import ChoiceGrid from "./ChoiceGrid";
import { enqueueReview, getStore } from "@/lib/store/useStore";
import { supabaseBrowser } from "@/lib/supabase/client";
import { problemsFor, TOPIC_LABELS } from "@/content/problems";
import Tex from "./Tex";

// Outer: hydration-safe randomness (mirrors DrillRunner).
export default function ProblemRunner({ topic, difficulty }: { topic?: string; difficulty?: 1 | 2 | 3 }) {
  const [nonce, setNonce] = useState<number | null>(null);
  useEffect(() => { setNonce(Math.floor(Math.random() * 2 ** 31)); }, []);
  if (nonce === null) return null;
  return <ProblemPicker key={`${topic}-${difficulty}`} topic={topic} difficulty={difficulty} nonce={nonce} />;
}

function ProblemPicker({ topic, difficulty, nonce }: { topic?: string; difficulty?: 1 | 2 | 3; nonce: number }) {
  const [i, setI] = useState(0);
  const [override, setOverride] = useState<ProblemTemplate | null>(null);
  const pool = useMemo(() => problemsFor(topic, difficulty), [topic, difficulty]);
  if (pool.length === 0) return <p className="microlabel" style={{ marginTop: 30 }}>No problems here yet — more ship every few days.</p>;
  const template = override ?? pool[(nonce + i) % pool.length];
  const harder = problemsFor(topic, undefined).filter((t) => t.difficulty === template.difficulty + 1);
  return (
    <ProblemSession
      key={`${template.id}-${i}`}
      template={template}
      seed={(nonce ^ Math.imul(i + 1, 2654435761)) >>> 0}
      onNext={() => { setOverride(null); setI((v) => v + 1); }}
      onHarder={harder.length ? () => { setOverride(harder[(nonce + i) % harder.length]); setI((v) => v + 1); } : null}
    />
  );
}

export function ProblemSession({ template, seed, onNext, onHarder, mode = "practice", onGraded }: {
  template: ProblemTemplate; seed: number; onNext: () => void; onHarder: (() => void) | null;
  mode?: "practice" | "review"; onGraded?: (correct: boolean) => void;
}) {
  const [roll, setRoll] = useState(0);
  const p = useMemo(() => drawParams(template, (seed + roll) >>> 0), [template, seed, roll]);
  const d = useMemo(() => template.derived(p), [template, p]);
  const exact = answerOf(template, d);
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState<null | boolean>(null);
  const [reported, setReported] = useState(false);
  const [queued, setQueued] = useState(false);
  const qStart = useRef(Date.now());
  const walkthroughRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done !== null) walkthroughRef.current?.focus();
  }, [done]);

  function submit() {
    const parsed = parseAnswerExpr(value);
    if (parsed === null) { if (value.trim() !== "") setShowHint(true); return; }
    finish(grade(parsed, exact, template.accepted.tolerance), value);
  }

  // A choice problem grades on the 1-based index of the label picked, so the same `grade`
  // and the same stored `answer` shape (user-visible text) serve both input modes.
  function pick(label: string) {
    finish(template.choices!.indexOf(label) + 1 === exact, label);
  }

  function finish(ok: boolean, given: string) {
    getStore().saveAttempts([{
      problemId: template.id, problemVersion: template.version, seed: (seed + roll) >>> 0, mode,
      topic: template.topic, answer: given, correct: ok, timeMs: Date.now() - qStart.current,
      sessionId: null, createdAt: new Date().toISOString(),
    }]).catch(() => {});
    if (mode === "review") onGraded?.(ok);
    else if (!ok) { setQueued(true); enqueueReview(template.id).catch(() => {}); } // auto-intake on a miss (spec §6)
    setDone(ok);
  }

  function reroll() { setRoll((r) => r + 1); setValue(""); setDone(null); setReported(false); setQueued(false); qStart.current = Date.now(); }

  function addToReview() { setQueued(true); enqueueReview(template.id).catch(() => {}); }

  async function report() {
    setReported(true); // optimistic; reports are best-effort
    try {
      const supa = supabaseBrowser();
      const { data } = await supa.auth.getUser();
      await supa.from("problem_reports").insert({ problem_id: template.id, reason: "drill-flag", note: `seed ${(seed + roll) >>> 0} v${template.version}`, user_id: data.user?.id ?? null });
    } catch { /* studying never blocks */ }
  }

  const label = TOPIC_LABELS[template.topic] ?? template.topic;
  return (
    <div>
      <p className="microlabel">{label} · L{template.difficulty} · {template.id}</p>
      <p data-testid="prompt" style={{ fontSize: 19, lineHeight: 1.55, maxWidth: "62ch", margin: "18px 0 20px", color: "var(--ink)" }}>
        <Tex text={template.statement(p, d)} />
      </p>
      {done === null ? (
        template.choices ? (
          <ChoiceGrid options={template.choices} onPick={(o) => { setValue(o); pick(o); }} picked={null} />
        ) : (
        <>
          <input
            aria-label="answer" autoFocus inputMode="text" value={value}
            onChange={(e) => { setValue(e.target.value); setShowHint(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat) submit(); }}
            placeholder="fraction, decimal, or expression"
            className="mono"
            style={{ border: "1.5px solid var(--card-border)", background: "var(--surface)", borderRadius: 8, padding: "10px 14px", fontSize: 17, width: 280 }}
          />
          <p data-testid={showHint ? "parse-hint" : undefined} aria-live="polite" className="mono" style={{ color: "var(--bad)", fontSize: 12, marginTop: 8, minHeight: 18 }}>{showHint ? "couldn't read that answer" : ""}</p>
        </>
        )
      ) : (
        <div data-testid="walkthrough" tabIndex={0} ref={walkthroughRef}
             onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat && e.target === e.currentTarget) onNext(); }}
             style={{ borderTop: `2px solid ${done ? "var(--good)" : "var(--bad)"}`, paddingTop: 14, maxWidth: "68ch" }}>
          <p data-testid="verdict" className="mono" style={{ color: done ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>{done ? "correct" : "incorrect"}</span>
            {done ? "✓ CORRECT" : "✗"} · you: {value || "—"} · exact: {template.choices ? answerLabel(template, d) : fmtNum(exact)}
          </p>
          <ol style={{ margin: "14px 0 0 18px" }}>
            {template.solution(p, d).map((s, i) => (
              <li key={i} style={{ margin: "10px 0", color: "var(--body)", fontSize: 14.5, lineHeight: 1.6 }}>
                <b style={{ color: "var(--ink)" }}>{s.title}.</b> <Tex text={s.body} />
              </li>
            ))}
          </ol>
          <p style={{ marginTop: 14, padding: "10px 14px", borderLeft: "3px solid var(--teal)", color: "var(--body)", fontSize: 14 }}>
            <b style={{ color: "var(--teal)" }}>Key insight.</b> {template.keyInsight}
          </p>
          <p style={{ marginTop: 8, padding: "10px 14px", borderLeft: "3px solid var(--bad)", color: "var(--body)", fontSize: 14 }}>
            <b style={{ color: "var(--bad)" }}>Common trap.</b> {template.commonTrap}
          </p>
          <p className="mono" style={{ marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
            seen at: {template.firms.map((f) => f.firm).join(" · ") || "—"} · expected pace ~{template.expectedPaceS}s
          </p>
          <p className="mono" style={{ marginTop: 14, fontSize: 12 }}>
            {/* Advancing was keyboard-only until now — the Enter hint below is real but it is
                not reachable on a touch device, which left a phone user stuck on the
                walkthrough with no way forward but a reload. */}
            <button type="button" onClick={onNext} data-testid="next-problem"
                    style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 700, marginRight: 16, padding: 0 }}>
              {mode === "review" ? "Next in queue →" : "Next problem →"}
            </button>
            {/* No re-roll in review: a second submission would grade the same queue row again from stale state. */}
            {mode === "practice" && (
              <button type="button" onClick={reroll} style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 700 }}>Re-roll numbers</button>
            )}
            {onHarder && <button type="button" onClick={onHarder} style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 700, marginLeft: 16 }}>Harder variant</button>}
            {mode === "practice" && (
              <button type="button" onClick={addToReview} disabled={queued} data-testid="add-review"
                      style={{ background: "none", border: "none", color: queued ? "var(--muted)" : "var(--teal)", fontWeight: queued ? 400 : 700, marginLeft: 16 }}>
                {queued ? "In review queue ✓" : "Add to review queue"}
              </button>
            )}
            <button type="button" onClick={report} disabled={reported} style={{ background: "none", border: "none", color: reported ? "var(--muted)" : "var(--faint)", marginLeft: 16 }}>{reported ? "Reported ✓" : "Report issue"}</button>
            <span style={{ marginLeft: 16, color: "var(--faint)" }}>Enter for next</span>
          </p>
        </div>
      )}
    </div>
  );
}
