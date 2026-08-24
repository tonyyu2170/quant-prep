import { makeRng } from "@qp/engine";
import type { FermiItem, FermiTemplate } from "./types";
import { gasoline } from "./templates/gasoline";
import { vehicleMiles } from "./templates/vehicle-miles";

/**
 * The second registry. NOT `PROBLEMS`, and that is the design (see content/fermi/types.ts).
 * Nothing here is emitted to instances.json and nothing here needs a Python solver keyed by
 * problem id; the mathematics gets its counterpart through verification/verify_fermi.py instead.
 */
export const FERMI_TEMPLATES: readonly FermiTemplate[] = [gasoline, vehicleMiles];

/** Total distinct items reachable across all templates. */
export const fermiReach = () => FERMI_TEMPLATES.reduce((a, t) => a + t.count, 0);

/** `n` distinct items for one session, no template-and-index repeated. */
export function fermiSession(seed: number, n = 8): FermiItem[] {
  const rng = makeRng(seed);
  const seen = new Set<string>();
  const out: FermiItem[] = [];
  for (let guard = 0; out.length < n && guard < n * 50; guard++) {
    const t = FERMI_TEMPLATES[Math.floor(rng() * FERMI_TEMPLATES.length)];
    const item = t.itemAt(Math.floor(rng() * t.count));
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
