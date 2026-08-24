"use client";
import { CALIBRATION_MIN_ANSWERS, type CalibrationResult } from "@qp/engine";

/**
 * Stated confidence against actual hit rate. One bar: the player claimed 90%, and this is what
 * they achieved, against a reference line at 90%.
 *
 * Deliberately not components/charts/LineChart.tsx (date-indexed) nor PnlSparkline (round-indexed
 * and signed). This is a single rate against a target, and the target line is the whole point.
 */
export default function CalibrationCurve({ rows }: { rows: readonly CalibrationResult[] }) {
  const W = 260, H = 72, PAD = 6;
  const n = rows.length;
  const rate = n === 0 ? 0 : rows.filter((r) => r.hit).length / n;
  const ready = n >= CALIBRATION_MIN_ANSWERS;
  const x = (p: number) => PAD + p * (W - 2 * PAD);
  const barY = 26, barH = 18;
  const good = Math.abs(rate - 0.9) <= 0.07;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
         aria-label={`Hit rate ${(rate * 100).toFixed(0)} percent against a stated 90 percent, over ${n} answers`}
         style={{ display: "block" }}>
      <rect x={x(0)} y={barY} width={x(1) - x(0)} height={barH} fill="var(--card-border)" opacity={0.5} />
      {n > 0 && (
        <rect x={x(0)} y={barY} width={Math.max(1, x(rate) - x(0))} height={barH}
              fill={ready && good ? "var(--good)" : ready ? "var(--bad)" : "var(--faint)"} />
      )}
      <line x1={x(0.9)} x2={x(0.9)} y1={barY - 6} y2={barY + barH + 6} stroke="var(--ink)" strokeWidth={1.5} />
      <text x={x(0.9)} y={barY - 10} textAnchor="middle" fontSize={9} fill="var(--muted)">claimed 90%</text>
      <text x={x(0)} y={barY + barH + 18} fontSize={10} fill="var(--muted)">
        {n === 0 ? "no answers yet"
          : ready ? `${(rate * 100).toFixed(0)}% hit rate over ${n} answers`
          : `${n} of ${CALIBRATION_MIN_ANSWERS} answers — hit rate hidden until it can mean something`}
      </text>
    </svg>
  );
}
