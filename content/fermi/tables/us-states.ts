import type { DataTable } from "../types";

/**
 * The three tables the Fermi templates join on, one publisher each.
 *
 * They are separate tables and not three columns of one table because `DataTable` carries a
 * single `source`/`vintage`/`retrievedAt` for all its rows — which is the point of a table. The
 * populations come from the Census Bureau, the gasoline figures from FHWA Table MF-21 and the
 * travel figures from FHWA Table VM-2; folding them together would force one of those citations
 * to be wrong. Rows are aligned by state name across all three.
 *
 * WHY STATES AND NOT CITIES. The plan called for 60 world urban agglomerations. Federal fuel and
 * travel data is published per state and has no metropolitan-area equivalent, and the design
 * needs a published reference for EVERY row (see FermiItem.truth). Retrieval decided the row
 * type, not preference. Full reasoning: docs/research/fermi-2026-08/sources.md.
 *
 * DC and Puerto Rico are excluded on purpose. DC's chain runs ~0.42 log10 above its fuel
 * receipts because commuters drive in and buy fuel in Maryland and Virginia — a state-shaped row
 * for a city-shaped place. Puerto Rico appears in VM-2 but not in MF-21, so it cannot carry both
 * references.
 */

export interface StateRow { name: string; population: number }
export interface GasolineRow { state: string; thousandGallons: number }
export interface VehicleMilesRow { state: string; millionMiles: number }

/**
 * Resident population. Rounded to two significant figures: log10 scoring cannot see more than
 * that, and rounding stops the file implying precision an estimate does not have. Measured cost
 * of the rounding is at most 0.020 log10, against a cross-check tolerance of 0.30.
 *
 * Rows are ordered by population descending — gate 2 asserts it. Not cosmetic: an out-of-order
 * row is the cheapest available signal that a value was edited in isolation rather than taken
 * from one pass of one source.
 */
export const US_STATES: DataTable<StateRow> = {
  id: "us-states",
  source:
    "U.S. Census Bureau, Vintage 2025 Population Estimates, NST-EST2025-ALLDATA (POPESTIMATE2024 column), " +
    "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv",
  retrievedAt: "2026-08-24",
  vintage: "2024-07-01",
  rows: [
    { name: "California", population: 39_000_000 },
    { name: "Texas", population: 31_000_000 },
    { name: "Florida", population: 23_000_000 },
    { name: "New York", population: 20_000_000 },
    { name: "Pennsylvania", population: 13_000_000 },
    { name: "Illinois", population: 13_000_000 },
    { name: "Ohio", population: 12_000_000 },
    { name: "Georgia", population: 11_000_000 },
    { name: "North Carolina", population: 11_000_000 },
    { name: "Michigan", population: 10_000_000 },
    { name: "New Jersey", population: 9_500_000 },
    { name: "Virginia", population: 8_800_000 },
    { name: "Washington", population: 7_900_000 },
    { name: "Arizona", population: 7_600_000 },
    { name: "Tennessee", population: 7_300_000 },
    { name: "Massachusetts", population: 7_100_000 },
    { name: "Indiana", population: 6_900_000 },
    { name: "Maryland", population: 6_200_000 },
    { name: "Missouri", population: 6_200_000 },
    { name: "Colorado", population: 6_000_000 },
    { name: "Wisconsin", population: 6_000_000 },
    { name: "Minnesota", population: 5_800_000 },
    { name: "South Carolina", population: 5_500_000 },
    { name: "Alabama", population: 5_200_000 },
    { name: "Louisiana", population: 4_600_000 },
    { name: "Kentucky", population: 4_600_000 },
    { name: "Oregon", population: 4_300_000 },
    { name: "Oklahoma", population: 4_100_000 },
    { name: "Connecticut", population: 3_700_000 },
    { name: "Utah", population: 3_500_000 },
    { name: "Nevada", population: 3_300_000 },
    { name: "Iowa", population: 3_200_000 },
    { name: "Arkansas", population: 3_100_000 },
    { name: "Kansas", population: 3_000_000 },
    { name: "Mississippi", population: 3_000_000 },
    { name: "New Mexico", population: 2_100_000 },
    { name: "Nebraska", population: 2_000_000 },
    { name: "Idaho", population: 2_000_000 },
    { name: "West Virginia", population: 1_800_000 },
    { name: "Hawaii", population: 1_400_000 },
    { name: "New Hampshire", population: 1_400_000 },
    { name: "Maine", population: 1_400_000 },
    { name: "Montana", population: 1_100_000 },
    { name: "Rhode Island", population: 1_100_000 },
    { name: "Delaware", population: 1_100_000 },
    { name: "South Dakota", population: 930_000 },
    { name: "North Dakota", population: 790_000 },
    { name: "Alaska", population: 740_000 },
    { name: "Vermont", population: 650_000 },
    { name: "Wyoming", population: 590_000 },
  ],
};

/**
 * Gasoline used on the highways of each state, thousands of gallons. Column "HIGHWAY USE / TOTAL
 * / GASOLINE".
 *
 * This is the independent route that makes gate 1 evidence rather than arithmetic: MF-21 is
 * built from state fuel-TAX RECEIPTS, a completely different measurement process from the
 * HPMS travel model behind the rates in the chain. Nationally the two agree to 1.9%.
 *
 * Values are kept at the precision the source publishes; they are citations, not estimates.
 */
export const MF21_GASOLINE: DataTable<GasolineRow> = {
  id: "mf21-gasoline",
  source:
    "FHWA Highway Statistics 2024, Table MF-21 (Motor-Fuel Use), " +
    "https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/mf21.xlsx",
  retrievedAt: "2026-08-24",
  vintage: "2024",
  rows: [
    { state: "California", thousandGallons: 12_119_277 },
    { state: "Texas", thousandGallons: 14_080_721 },
    { state: "Florida", thousandGallons: 8_333_129 },
    { state: "New York", thousandGallons: 4_871_290 },
    { state: "Pennsylvania", thousandGallons: 4_231_228 },
    { state: "Illinois", thousandGallons: 3_923_954 },
    { state: "Ohio", thousandGallons: 4_531_132 },
    { state: "Georgia", thousandGallons: 4_611_269 },
    { state: "North Carolina", thousandGallons: 4_836_696 },
    { state: "Michigan", thousandGallons: 3_873_597 },
    { state: "New Jersey", thousandGallons: 3_401_292 },
    { state: "Virginia", thousandGallons: 3_816_103 },
    { state: "Washington", thousandGallons: 2_356_049 },
    { state: "Arizona", thousandGallons: 2_773_916 },
    { state: "Tennessee", thousandGallons: 3_203_686 },
    { state: "Massachusetts", thousandGallons: 2_405_011 },
    { state: "Indiana", thousandGallons: 2_772_854 },
    { state: "Maryland", thousandGallons: 2_181_862 },
    { state: "Missouri", thousandGallons: 2_969_823 },
    { state: "Colorado", thousandGallons: 2_169_347 },
    { state: "Wisconsin", thousandGallons: 2_117_728 },
    { state: "Minnesota", thousandGallons: 2_075_288 },
    { state: "South Carolina", thousandGallons: 2_506_990 },
    { state: "Alabama", thousandGallons: 3_028_297 },
    { state: "Louisiana", thousandGallons: 1_949_665 },
    { state: "Kentucky", thousandGallons: 2_084_488 },
    { state: "Oregon", thousandGallons: 1_287_438 },
    { state: "Oklahoma", thousandGallons: 1_777_907 },
    { state: "Connecticut", thousandGallons: 1_419_824 },
    { state: "Utah", thousandGallons: 1_219_743 },
    { state: "Nevada", thousandGallons: 1_114_422 },
    { state: "Iowa", thousandGallons: 1_383_208 },
    { state: "Arkansas", thousandGallons: 1_364_123 },
    { state: "Kansas", thousandGallons: 1_271_888 },
    { state: "Mississippi", thousandGallons: 1_556_385 },
    { state: "New Mexico", thousandGallons: 886_527 },
    { state: "Nebraska", thousandGallons: 821_463 },
    { state: "Idaho", thousandGallons: 658_328 },
    { state: "West Virginia", thousandGallons: 697_329 },
    { state: "Hawaii", thousandGallons: 395_366 },
    { state: "New Hampshire", thousandGallons: 645_784 },
    { state: "Maine", thousandGallons: 573_083 },
    { state: "Montana", thousandGallons: 507_012 },
    { state: "Rhode Island", thousandGallons: 327_820 },
    { state: "Delaware", thousandGallons: 461_597 },
    { state: "South Dakota", thousandGallons: 428_090 },
    { state: "North Dakota", thousandGallons: 370_620 },
    { state: "Alaska", thousandGallons: 210_748 },
    { state: "Vermont", thousandGallons: 260_851 },
    { state: "Wyoming", thousandGallons: 315_641 },
  ],
};

/**
 * Annual vehicle-miles travelled in each state, millions. Column "TOTAL" (rural + urban, all
 * functional systems).
 *
 * Estimated from state-provided Highway Performance Monitoring System traffic counts — again a
 * different route from the registration-and-rate chain that the templates multiply out.
 *
 * Tennessee is written "Tennessee (2)" in the source, footnote: "The State modified their
 * process for estimating summary VMT data." The marker is stripped here. Recorded because the
 * un-normalised join silently dropped Tennessee and produced a 49-row table that still called
 * itself 50 — that failure is quiet by nature.
 */
export const VM2_VEHICLE_MILES: DataTable<VehicleMilesRow> = {
  id: "vm2-vehicle-miles",
  source:
    "FHWA Highway Statistics 2024, Table VM-2 (Functional System Travel), " +
    "https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/vm2.xlsx",
  retrievedAt: "2026-08-24",
  vintage: "2024",
  rows: [
    { state: "California", millionMiles: 325959.2 },
    { state: "Texas", millionMiles: 308460.7 },
    { state: "Florida", millionMiles: 249474.1 },
    { state: "New York", millionMiles: 120869.2 },
    { state: "Pennsylvania", millionMiles: 95194.0 },
    { state: "Illinois", millionMiles: 104290.2 },
    { state: "Ohio", millionMiles: 116036.3 },
    { state: "Georgia", millionMiles: 122215.7 },
    { state: "North Carolina", millionMiles: 131008.4 },
    { state: "Michigan", millionMiles: 99661.4 },
    { state: "New Jersey", millionMiles: 79459.8 },
    { state: "Virginia", millionMiles: 88511.1 },
    { state: "Washington", millionMiles: 60555.1 },
    { state: "Arizona", millionMiles: 70451.2 },
    { state: "Tennessee", millionMiles: 78904.4 },
    { state: "Massachusetts", millionMiles: 62013.3 },
    { state: "Indiana", millionMiles: 88230.8 },
    { state: "Maryland", millionMiles: 57049.4 },
    { state: "Missouri", millionMiles: 81806.5 },
    { state: "Colorado", millionMiles: 55068.0 },
    { state: "Wisconsin", millionMiles: 69225.8 },
    { state: "Minnesota", millionMiles: 59181.4 },
    { state: "South Carolina", millionMiles: 62042.1 },
    { state: "Alabama", millionMiles: 72903.9 },
    { state: "Louisiana", millionMiles: 55109.1 },
    { state: "Kentucky", millionMiles: 49168.4 },
    { state: "Oregon", millionMiles: 37398.9 },
    { state: "Oklahoma", millionMiles: 46456.2 },
    { state: "Connecticut", millionMiles: 30946.9 },
    { state: "Utah", millionMiles: 36160.2 },
    { state: "Nevada", millionMiles: 28433.0 },
    { state: "Iowa", millionMiles: 33816.7 },
    { state: "Arkansas", millionMiles: 39372.4 },
    { state: "Kansas", millionMiles: 31669.9 },
    { state: "Mississippi", millionMiles: 41554.2 },
    { state: "New Mexico", millionMiles: 28644.6 },
    { state: "Nebraska", millionMiles: 21899.7 },
    { state: "Idaho", millionMiles: 20046.4 },
    { state: "West Virginia", millionMiles: 17213.8 },
    { state: "Hawaii", millionMiles: 10647.3 },
    { state: "New Hampshire", millionMiles: 13853.6 },
    { state: "Maine", millionMiles: 15160.9 },
    { state: "Montana", millionMiles: 13865.0 },
    { state: "Rhode Island", millionMiles: 7655.9 },
    { state: "Delaware", millionMiles: 9936.6 },
    { state: "South Dakota", millionMiles: 10450.1 },
    { state: "North Dakota", millionMiles: 10029.7 },
    { state: "Alaska", millionMiles: 5502.6 },
    { state: "Vermont", millionMiles: 7208.3 },
    { state: "Wyoming", millionMiles: 9719.6 },
  ],
};
