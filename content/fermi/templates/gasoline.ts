import { MF21_GASOLINE, US_STATES } from "../tables/us-states";
import type { FermiTemplate } from "../types";

/**
 * How much gasoline a state burns in a year.
 *
 * The rates are the expensive part of authoring — they have no table to hide in and each needs
 * its own citation (spec §11). All three come from one federal table, FHWA Highway Statistics
 * 2024 Table VM-1, column "ALL LIGHT DUTY VEHICLES" (cars, light trucks, vans, SUVs — the
 * household fleet, which is what burns gasoline; combination trucks run on diesel).
 *
 * VM-1 IS INTERNALLY CONSISTENT, so it cannot check itself: its published
 * "average fuel consumption per vehicle" of 460.3646 gallons is exactly
 * 10,786.6516 / 23.4307. That is precisely why `truth` is read from MF-21 instead — a table
 * built from state fuel-TAX RECEIPTS rather than from the HPMS travel model. Nationally the two
 * routes agree to 1.9% (+0.008 log10), which is the corroboration this template rests on.
 */
const RETRIEVED = "2026-08-24";
const VM1 = "FHWA Highway Statistics 2024, Table VM-1 (all light duty vehicles), https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/vm1.xlsx";

/** VM-1 "Number of motor vehicles registered", all light duty. */
const LIGHT_DUTY_REGISTERED = 271_085_742;
/** Census Vintage 2025, POPESTIMATE2024 for the United States. Same year as the VM-1 column. */
const US_POPULATION_2024 = 340_003_797;

/** DERIVED, and said so: VM-1 publishes a fleet count, not a per-person rate. */
const VEHICLES_PER_PERSON = {
  value: LIGHT_DUTY_REGISTERED / US_POPULATION_2024,
  source: `derived — ${LIGHT_DUTY_REGISTERED.toLocaleString("en-US")} light-duty vehicles registered (${VM1}) divided by a U.S. population of ${US_POPULATION_2024.toLocaleString("en-US")} (${US_STATES.source})`,
  retrievedAt: RETRIEVED,
  vintage: "2024",
};

/** VM-1 "Average miles traveled per vehicle". Published directly. */
const MILES_PER_VEHICLE_YEAR = { value: 10_786.6516, source: VM1, retrievedAt: RETRIEVED, vintage: "2024" };

/** VM-1 "Average miles traveled per gallon of fuel consumed". Published directly. */
const MILES_PER_GALLON = { value: 23.4307, source: VM1, retrievedAt: RETRIEVED, vintage: "2024" };

const gasolineByState = new Map(MF21_GASOLINE.rows.map((r) => [r.state, r.thousandGallons]));

export const gasoline: FermiTemplate = {
  id: "fermi/gasoline",
  count: US_STATES.rows.length,
  itemAt(i) {
    const row = US_STATES.rows[i % US_STATES.rows.length];
    const thousandGallons = gasolineByState.get(row.name);
    if (thousandGallons === undefined) throw new Error(`no MF-21 gasoline row for ${row.name}`);

    return {
      id: `fermi/gasoline#${row.name}`,
      statement: `How many gallons of gasoline are burned on the roads of ${row.name} in a year?`,
      chain: [
        { label: `Population of ${row.name}`, value: row.population },
        { label: "Light-duty vehicles per person", value: VEHICLES_PER_PERSON.value, cite: VEHICLES_PER_PERSON },
        { label: "Miles driven per vehicle per year", value: MILES_PER_VEHICLE_YEAR.value, cite: MILES_PER_VEHICLE_YEAR },
        { label: "1 / (miles per gallon)", value: 1 / MILES_PER_GALLON.value, cite: MILES_PER_GALLON },
      ],
      truth: {
        // Published, not computed. MF-21 reports thousands of gallons; the question asks gallons.
        value: thousandGallons * 1000,
        source: MF21_GASOLINE.source,
        retrievedAt: MF21_GASOLINE.retrievedAt,
        vintage: MF21_GASOLINE.vintage,
      },
      unitLabel: "gallons of gasoline",
    };
  },
};
