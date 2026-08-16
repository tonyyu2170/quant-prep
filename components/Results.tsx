"use client";
import Link from "next/link";
import type { Preset, SessionState, Summary } from "@qp/engine";

export default function Results({ summary, preset, state }: { summary: Summary; preset: Preset; state: SessionState }) {
  const misses = state.grades
    .map((g, i) => ({ g, i }))
    .filter(({ g, i }) => !g && state.answers[i] !== null);
  return (
    <div className="container" style={{ padding: "56px 24px", maxWidth: 760 }}>
      <p className="microlabel">{preset.title} — result</p>
      <h1 data-testid="score" className="mono" style={{ fontSize: 52, margin: "8px 0" }}>{summary.score}</h1>
      <p className="mono" style={{ color: "var(--body)", fontSize: 14 }}>
        <span style={{ color: "var(--good)" }}>✓ {summary.correct}</span> · <span style={{ color: "var(--bad)" }}>✗ {summary.wrong}</span> · skipped {summary.skipped} · answered {summary.total}/{preset.count}
      </p>
      {misses.length > 0 && (
        <div style={{ marginTop: 30, borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
          <p className="microlabel" style={{ marginBottom: 8 }}>Misses</p>
          {misses.map(({ i }) => (
            <p key={i} className="mono" style={{ fontSize: 13, padding: "4px 0", color: "var(--body)" }}>
              {state.items[i].prompt} <span style={{ color: "var(--bad)" }}>you: {String(state.answers[i])}</span>{" "}
              <span style={{ color: "var(--good)" }}>ans: {state.items[i].answer}</span>
              {state.items[i].rule ? <span style={{ color: "var(--muted)" }}> — {state.items[i].rule}</span> : null}
            </p>
          ))}
        </div>
      )}
      <p style={{ marginTop: 30 }}>
        <a href={`/test/${preset.id}`} style={{ fontWeight: 700 }}>Run again →</a>
        <Link href="/stats" style={{ marginLeft: 20 }}>See stats</Link>
      </p>
    </div>
  );
}
