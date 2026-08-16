"use client";
import { Suspense, use, useCallback, useMemo, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { getPreset, type Summary } from "@qp/engine";
import TestRunner from "@/components/TestRunner";
import { saveRun } from "@/lib/store/useStore";

function TestPageInner({ presetId, base }: { presetId: string; base: NonNullable<ReturnType<typeof getPreset>> }) {
  const sp = useSearchParams();
  // e2e/testing overrides: ?count=5&seed=42 (harmless in prod; guarded against junk)
  const preset = useMemo(() => {
    const raw = sp.get("count");
    const n = Number(raw);
    return { ...base, count: raw !== null && Number.isFinite(n) ? Math.max(1, Math.min(base.count, Math.floor(n))) : base.count };
  }, [base, sp]);
  const [seed] = useState(() => {
    const raw = sp.get("seed");
    const n = raw === null ? NaN : Number(raw);
    return Number.isInteger(n) ? n : Math.floor(Math.random() * 2 ** 31);
  });
  const onDone = useCallback((s: Summary) => { void saveRun(preset, s); }, [preset]);
  return <TestRunner preset={preset} seed={seed} onDone={onDone} />;
}

export default function TestPage({ params }: { params: Promise<{ preset: string }> }) {
  const { preset: presetId } = use(params);
  const base = getPreset(presetId);
  if (!base) notFound();
  return (
    <Suspense>
      <TestPageInner presetId={presetId} base={base} />
    </Suspense>
  );
}
