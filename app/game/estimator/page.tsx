"use client";
import { useEffect, useState } from "react";
import FermiRunner from "@/components/FermiRunner";

export default function EstimatorPage() {
  // Seed is picked on the client only, so server and client markup agree on first paint — the
  // same reason app/game/market-maker/page.tsx defers it.
  const [seed, setSeed] = useState<number | null>(null);
  useEffect(() => { setSeed(Math.floor(Math.random() * 2 ** 31)); }, []);
  if (seed === null) return null;
  return <FermiRunner seed={seed} />;
}
