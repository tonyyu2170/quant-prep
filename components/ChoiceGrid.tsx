"use client";
import { useEffect } from "react";

/**
 * Four-way choice answered by click or by pressing 1–4 — the real test runs at ~6s a question,
 * so the keyboard path is the primary one. Enter skips.
 */
export default function ChoiceGrid({
  options, onPick, onSkip, picked,
}: {
  options: readonly number[];
  onPick: (value: number) => void;
  onSkip?: () => void;
  picked?: number | null;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { if (onSkip) { e.preventDefault(); onSkip(); } return; }
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < options.length) { e.preventDefault(); onPick(options[i]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, onPick, onSkip]);

  return (
    <div data-testid="choices" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, width: "100%", maxWidth: 420, marginTop: 12 }}>
      {options.map((o, i) => (
        <button
          key={`${o}-${i}`}
          type="button"
          aria-label={`choice ${i + 1}: ${o}`}
          onClick={() => onPick(o)}
          className="mono"
          style={{
            display: "flex", alignItems: "baseline", gap: 10, justifyContent: "center",
            padding: "14px 12px", fontSize: 20, cursor: "pointer",
            borderRadius: 8, background: "var(--surface)", color: "var(--ink)",
            border: `1.5px solid ${picked === o ? "var(--teal)" : "var(--card-border)"}`,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--faint)" }}>{i + 1}</span>
          {String(o)}
        </button>
      ))}
    </div>
  );
}
