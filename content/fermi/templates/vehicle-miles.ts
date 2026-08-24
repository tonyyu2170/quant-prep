import { US_STATES, VM2_VEHICLE_MILES } from "../tables/us-states";
import type { FermiTemplate } from "../types";

/**
 * How far a state drives in a year.
 *
 * NOT INDEPENDENT OF `fermi/gasoline`, and that is worth stating plainly rather than letting the
 * file imply otherwise: this chain is the gasoline chain with the fuel-economy step removed.
 * A player who has done one has done most of the other. The two ship together because each has
 * its own separately measured published reference and because they prove the table x template
 * pattern, but a third template should come from a different domain, not a third slice of FHWA.
 * Two genuinely different domains were attempted and rejected on evidence — see
 * docs/research/fermi-2026-08/sources.md §4.1.
 *
 * Rates are VM-1's ALL MOTOR VEHICLES column, because VM-2 counts travel by every vehicle
 * including diesel trucks — the two must describe the same fleet or the comparison is a units bug.
 */
const RETRIEVED = "2026-08-24";
const VM1 = "FHWA Highway Statistics 2024, Table VM-1 (all motor vehicles), https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/vm1.xlsx";

/** VM-1 "Number of motor vehicles registered", all motor vehicles. */
const ALL_VEHICLES_REGISTERED = 297_525_836;
/** Census Vintage 2025, POPESTIMATE2024 for the United States. Same year as the VM-1 column. */
const US_POPULATION_2024 = 340_003_797;

/** DERIVED, and said so: VM-1 publishes a fleet count, not a per-person rate. */
const VEHICLES_PER_PERSON = {
  value: ALL_VEHICLES_REGISTERED / US_POPULATION_2024,
  source: `derived — ${ALL_VEHICLES_REGISTERED.toLocaleString("en-US")} motor vehicles registered (${VM1}) divided by a U.S. population of ${US_POPULATION_2024.toLocaleString("en-US")} (${US_STATES.source})`,
  retrievedAt: RETRIEVED,
  vintage: "2024",
};

/** VM-1 "Average miles traveled per vehicle", all motor vehicles. Published directly. */
const MILES_PER_VEHICLE_YEAR = { value: 11_071.4124, source: VM1, retrievedAt: RETRIEVED, vintage: "2024" };

const milesByState = new Map(VM2_VEHICLE_MILES.rows.map((r) => [r.state, r.millionMiles]));

export const vehicleMiles: FermiTemplate = {
  id: "fermi/vehicle-miles",
  count: US_STATES.rows.length,
  itemAt(i) {
    const row = US_STATES.rows[i % US_STATES.rows.length];
    const millionMiles = milesByState.get(row.name);
    if (millionMiles === undefined) throw new Error(`no VM-2 travel row for ${row.name}`);

    return {
      id: `fermi/vehicle-miles#${row.name}`,
      statement: `How many miles are driven by all motor vehicles on the roads of ${row.name} in a year?`,
      chain: [
        { label: `Population of ${row.name}`, value: row.population },
        { label: "Motor vehicles per person", value: VEHICLES_PER_PERSON.value, cite: VEHICLES_PER_PERSON },
        { label: "Miles driven per vehicle per year", value: MILES_PER_VEHICLE_YEAR.value, cite: MILES_PER_VEHICLE_YEAR },
      ],
      truth: {
        // Published, not computed. VM-2 reports millions of miles; the question asks miles.
        value: millionMiles * 1e6,
        source: VM2_VEHICLE_MILES.source,
        retrievedAt: VM2_VEHICLE_MILES.retrievedAt,
        vintage: VM2_VEHICLE_MILES.vintage,
      },
      unitLabel: "vehicle-miles",
    };
  },
};
