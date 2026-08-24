/**
 * The SECOND content type. Deliberately not a `ProblemTemplate`, and deliberately not in the
 * `PROBLEMS` array.
 *
 * Every existing content gate keys off `PROBLEMS` — including verification/emit.ts, which is what
 * feeds verify.py. So content that is not in PROBLEMS is outside those gates by construction, and
 * verify.py's rule that every problem ships with a Python counterpart stays fully intact for
 * PROBLEMS. This is not an exemption; it is a separate type that carries its own gates
 * (content/fermi/fermi.test.ts) because the ones next door do not apply to it.
 */

/**
 * A real-world number we cannot derive, only cite.
 *
 * `retrievedAt` and `vintage` are different dates and both earn their place. A table read in
 * 2026 whose numbers describe 2024 has `retrievedAt: "2026-.."` and `vintage: "2024"`. Gating
 * staleness on the retrieval date would let eight-year-old data pass because someone re-opened
 * the page; the age gate therefore runs on `vintage`, which is the date that actually decays.
 */
export interface Cited<T = number> {
  value: T;
  /** Where it came from. Free text, but must name something checkable. */
  source: string;
  /** ISO date we read the value from that source. */
  retrievedAt: string;
  /** ISO date (or year) the underlying data describes. Staleness is gated on THIS. */
  vintage: string;
}

export interface DataTable<Row> {
  id: string;
  /** One source, one vintage, one retrieval date for the WHOLE table — that is the point of a table.
   *  A column from a different publisher belongs in a different table, not in an extra field here. */
  source: string;
  retrievedAt: string;
  vintage: string;
  rows: readonly Row[];
}

/** One link of a canonical chain: what it is, and the cited value we claim it takes. */
export interface CanonicalFactor {
  label: string;
  value: number;
  /** Absent when the value is read from a data table, which carries its own source. */
  cite?: Omit<Cited, "value">;
}

export interface FermiItem {
  id: string;
  /** The question as shown. */
  statement: string;
  /** The authored decomposition, revealed after the player submits. */
  chain: readonly CanonicalFactor[];
  /**
   * The answer, read from an INDEPENDENTLY published figure — never computed from `chain`.
   *
   * The plan this implements computed `truth` from the chain because it had a published
   * reference for only one row per template. Task 0 landed a published figure for EVERY row
   * (FHWA MF-21 fuel-tax receipts; FHWA VM-2 traffic counts), so the compromise is unnecessary.
   * Two consequences, both wanted: the player is scored against the real number rather than
   * against our arithmetic, and gate 1 comparing chain to truth is genuine two-route evidence
   * instead of a restatement.
   */
  truth: Cited;
  unitLabel: string;
}

export interface FermiTemplate {
  id: string;
  /** How many distinct items this template can produce, for the registry's reach count. */
  count: number;
  /** Build item `i`. Deterministic: same index, same item. */
  itemAt(i: number): FermiItem;
}
