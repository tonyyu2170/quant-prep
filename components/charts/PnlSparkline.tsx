"use client";

/**
 * Cumulative P&L across the rounds of one session. Deliberately NOT a reuse of
 * components/charts/LineChart.tsx: that one is date-indexed (SeriesPoint, Date.parse, and an
 * empty state about "two days of drilling"), while this is round-indexed and needs a zero
 * line, because P&L crosses zero and a stats series never does.
 */
export default function PnlSparkline({ pnls, totalRounds }: { pnls: readonly number[]; totalRounds: number }) {
  const W = 220, H = 56, PAD = 4;
  const cum: number[] = [];
  let run = 0;
  for (const p of pnls) { run += p; cum.push(run); }

  const lo = Math.min(0, ...cum), hi = Math.max(0, ...cum);
  const span = hi - lo || 1;
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - 2 * PAD);
  const x = (i: number) => PAD + (totalRounds <= 1 ? 0 : (i / (totalRounds - 1)) * (W - 2 * PAD));
  const last = cum.length ? cum[cum.length - 1] : 0;
  const stroke = last >= 0 ? "var(--teal)" : "var(--bad)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
         aria-label={`Cumulative profit and loss over ${pnls.length} rounds`} style={{ display: "block" }}>
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--card-border)" strokeWidth={1} />
      {cum.length > 1 && (
        <polyline fill="none" stroke={stroke} strokeWidth={2}
                  points={cum.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      )}
      {cum.length > 0 && <circle cx={x(cum.length - 1)} cy={y(last)} r={2.5} fill={stroke} />}
    </svg>
  );
}
