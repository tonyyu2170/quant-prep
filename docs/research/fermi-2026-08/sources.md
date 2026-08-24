# Fermi game — Task 0 retrieval log

Retrieval date: **2026-08-24**. Everything below was fetched, not recalled.
Negative results are recorded on purpose: they are the expensive part of this task
and a future session should not have to re-walk them.

---

## Part 1: the rates the plan's two templates need

Plan Task 0 Step 3 rule: *"If you cannot find a citable figure for a rate, that
template does not ship."* Applying it honestly:

### piano-tuners

| Factor | Status | What was found |
|---|---|---|
| tunings per piano-year | **citable** | Steinway & Sons, Service & Maintenance: recreational use (1 hr/day) → "Tuning: 2–4 times per year"; heavy use (6+ hr/day) → "Tuning: 12 times per year". <https://www.steinway.com/news/features/utilty/service-and-maintenance> — Corroborated by PianoBuyer (Sally Phillips, pub. 2017-09-13): "two or three times a year" for home pianos. <https://www.pianobuyer.com/post/piano-tuning-an-introduction> |
| hours per tuning | **citable** | PianoBuyer, same article: "a skilled technician can do an excellent job in 1½ to 2½ hours, sometimes less". Tunings-per-tuner-day is a *derivation* from this plus travel, not a published figure. |
| working days per year | **citable** | Trivial / standard business-day count. |
| **pianos per person** | **NOT CITABLE — kills the template** | See below. |

**pianos per person — the failed search.** The figure quoted everywhere is "over 4.5
million U.S. households own a piano, per NAMM". Every instance found is a market-research
vendor page citing NAMM with no link, no report name, and no year. The one NAMM primary
source that survives a fetch is the Gallup *American Attitudes Toward Making Music* release
<https://www.namm.org/news/press-releases/gallup-organization-reveals-findings-american-attitudes-toward-making-music>,
which gives household ownership of *any* musical instrument ("51 percent owned a musical
instrument") and **no piano-specific number** — and is a **2003** survey, which would fail
the staleness gate (`MAX_DATA_AGE_YEARS = 10`) by 13 years regardless.
Music Trades' acoustic-piano census (<https://www.musictrades.com/number-of-pianos-sold-in-the-us.html>)
is the one plausible primary source and was not retrievable.

This is exactly the failure mode the plan was rewritten to prevent: a real-looking
attribution with nothing behind it. Not substituted with a plausible number.

### barbers

| Factor | Status | What was found |
|---|---|---|
| haircuts per person-year | **NOT CITABLE** | Only Statista's paywalled *Frequency of hair cuts in the U.S. 2011–2020* (re-publishing Simmons National Consumer Survey) and Unilever-owned content marketing (allthingshair.com: "Men … 5.84 times per year … women 3.81"). No retrievable primary. |
| cuts per barber-day | **NOT CITABLE** | Nothing published found at all. |

**Both of the plan's templates fail Task 0 Step 3 as written.** The plan's four-edit drop
procedure covers dropping `barbers`; it has no path for dropping both.

### Access note

`bls.gov` returns **HTTP 403** to every automated fetch (WebFetch and curl with a browser
UA both blocked). The Step 2 OES reference figures are therefore not reachable by the
tools used here without driving a real browser.

---

## Part 2: what IS retrievable (verified live, 2026-08-24)

Checked so the replacement direction is grounded in fetched data rather than proposed
from memory — the same mistake in a new place.

| Source | Verified how | Result |
|---|---|---|
| **Census Bureau**, Vintage 2025 metro/micro population estimates | `curl` of `https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/metro/totals/cbsa-est2025-alldata.csv` | **HTTP 200, 827 KB, 2,806 data rows.** Columns include `NAME`, `LSAD`, `POPESTIMATE2025`. `LSAD` separates "Metropolitan Statistical Area" from micropolitan areas and metro divisions, which enforces the plan's "one definition, all 60 rows" rule mechanically. Vintage = July 1 2025, final release 2026-06-25 → **~9 years of staleness runway**, vs ~16 months for the UN WUP 2018 column the plan assumed. |
| **EIA** | WebFetch of `https://www.eia.gov/tools/faqs/faq.php?id=97&t=3` | HTTP 200 (not blocked). "10,791 kilowatthours (kWh)" per residential customer, 2022; "about 899 kWh per month"; page last updated 2024-01-08. State-level per-customer figures published in Today in Energy #65244 (2024 data). |
| **World Bank Open Data API** | `curl` of `api.worldbank.org/v2/country/USA;IDN;NGA/indicator/EG.USE.ELEC.KH.PC?format=json` | HTTP 200, JSON, `lastupdated: 2026-07-13`, per-country per-capita values through 2023. Machine-readable and dated — usable for *global* per-capita rates if the city table stays global. |

---

---

## Part 3: the retrieved figures (direction chosen 2026-08-24: US federal chains)

Every number below was pulled from the named file on **2026-08-24** and is reproduced with the
publisher's own precision. Nothing here is recalled.

### 3.1 Populations — U.S. Census Bureau, Vintage 2025 Population Estimates

- File: `https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv`
- Also pulled (metro-level, currently unused): `.../2020-2025/metro/totals/cbsa-est2025-alldata.csv`
- Vintage: estimates dated **July 1, 2025**; `POPESTIMATE2024` column used, to match the 2024
  vintage of the FHWA and EIA rate data. Final Vintage 2025 release **2026-06-25**.
- U.S. total, 2024: **340,003,797**. U.S. total, 2025: 341,784,857.
- Staleness runway against `MAX_DATA_AGE_YEARS = 10`: **~8-9 years.**

### 3.2 Vehicle / fuel rates — FHWA Highway Statistics 2024, Table VM-1

- Page: `https://www.fhwa.dot.gov/policyinformation/statistics/2024/vm1.cfm`
- Data file: `https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/vm1.xlsx`
- Sheet `2024_VM-1`, "ANNUAL VEHICLE DISTANCE TRAVELED IN MILES AND RELATED DATA - 2024".
  Sheet header says **Updated: February 2026**. Vintage **2024**.
- Column used: `ALL LIGHT DUTY VEHICLES` (short + long wheelbase — cars, light trucks, vans, SUVs).

| Factor | Published value |
|---|---|
| Motor vehicles registered | **271,085,742** |
| Average miles traveled per vehicle | **10,786.6516** |
| Average miles per gallon of fuel consumed | **23.4307** |
| Average fuel consumption per vehicle (gallons) | 460.3646 |
| Fuel consumed (thousand gallons) | 124,798,268.8262 |

VM-1 is internally consistent: `10,786.6516 / 23.4307 = 460.36` gal/vehicle, and
`271,085,742 x 460.36 = 124,798,126` thousand gallons vs the published 124,798,269 (rounding).
**This means the chain cannot be validated against VM-1 itself — it is the same identity.**

### 3.3 Gasoline reference figures — FHWA Highway Statistics 2024, Table MF-21

- Data file: `https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/mf21.xlsx`
- "MOTOR-FUEL USE - 2024", sheet header **December 2025**. Vintage **2024**.
- Column used: HIGHWAY USE / TOTAL / **GASOLINE**, thousands of gallons, one row per state.
- This table is produced from **state-reported fuel tax receipts** — a different measurement
  process from VM-1's HPMS travel model, which is what makes it a real cross-check.
- Sum over the 50 states: **127,179,889** thousand gallons, vs VM-1 light-duty fuel of
  124,798,269 — the two independent federal tables agree to **1.9% (+0.008 log10)**.

### 3.4 Electricity rate and reference figures — EIA, 2024

- Page: `https://www.eia.gov/electricity/sales_revenue_price/`
- Data file: `https://www.eia.gov/electricity/sales_revenue_price/xls/table_5A.xlsx`
- "2024 Average Monthly Bill- Residential", from forms EIA-861 schedules 4A-D, EIA-861S and
  EIA-861U. Vintage **2024**. The EIA-861U component matters: it covers retail-choice customers,
  so this table is full coverage, unlike the "utility bundled" tables 6 and 10.
- U.S. total: **143,144,185** residential customers, **863.27502** kWh average monthly
  consumption -> **10,359 kWh per account-year**.
- Per-state customers and average monthly consumption are published in the same table and are
  used as the per-row reference figures.

**Definitional caveat, recorded because it is load-bearing.** An EIA "residential customer" is a
metered account, not a household. 143,144,185 accounts against a population of 340,003,797 gives
**2.38 people per account**, whereas the Census average household size is nearer 2.5. Master-metered
apartment buildings, vacant units with live meters and second homes all sit in that gap. The
factor is therefore labelled as *accounts*, not households.

Census average-household-size tables were **not** used: the ACS API requires a key
(`api.census.gov` returns "Missing Key") and the CPS household table paths probed all 404'd.
Rather than substitute a remembered figure, the chain uses EIA's own published account count.

### 3.5 Measured chain-vs-reference gaps

Computed 2026-08-24 by applying the **national** rate to each state's Census population and
comparing against that state's **independently published** figure. This is the Task 0 Step 5
sanity check, run across 50-51 rows rather than the two the plan asked for.

**Gasoline** (national VM-1 rate vs each state's MF-21 receipts):

```
n=50   median -0.037 log10   min -0.204 (Alabama)   max +0.178 (New York)
within 0.3 log10 (factor 2) of the published figure: 50/50
```

The signs are physically sensible, which is the check that the numbers are real and not
coincidence: New York is the largest positive (dense, transit-served, low miles per capita, so a
national-average chain over-predicts) and Alabama the largest negative (rural, high miles per
capita).

**Residential electricity** (national EIA rate vs each state's own EIA figure):

```
n=51   median -0.029 log10   min -0.187 (Louisiana)   max +0.373 (Hawaii)
within 0.3 log10 (factor 2): 49/51   -- California +0.301 and Hawaii +0.373 exceed it
```

The two exceedances are **not** a wrong rate. Residential electricity is dominated by space
heating and cooling, so it disperses far more than driving does: Hawaii and California are
mild-climate and gas-heated, Louisiana is hot and humid. This is a genuinely wider quantity, and
Task 4 pins the tolerance from this measurement rather than from comfort.

### 3.6 District of Columbia

Excluded from the gasoline table. DC's chain value is roughly **+0.42 log10** above its MF-21
figure because a large commuting population drives in and buys fuel in Maryland and Virginia.
That is a definitional artefact of using a state-shaped row for a city-shaped place, not an
error in the rate.

---

## Part 4: what ships, and what was rejected

### 4.1 Rejected, with the measurement that rejected it

| Candidate | Verdict | Why |
|---|---|---|
| `piano-tuners` | dropped | *pianos per person* has no retrievable primary (Part 1). |
| `barbers` | dropped | both rates uncitable (Part 1). |
| residential electricity | **dropped after measurement** | see below. |
| public water supply | dropped | The fresh (2020) USGS estimates are model output distributed through ScienceBase DOIs and the National Water Availability Data Companion, not a state table. The last Circular with a clean state table is **2015 — 11 years old, which fails `MAX_DATA_AGE_YEARS = 10` outright.** USGS's own machine-learning paper reports per-capita public-supply withdrawal spanning **30 to 650 GPCD**, so the dispersion would very likely have failed the chain test as electricity did. |

**Why electricity was dropped even though its data is excellent.** Once `truth` is the published
figure (§4.2), the cross-check gate asserts *the authored chain reproduces the real answer*. The
electricity chain misses by **+0.373 log10 for Hawaii and +0.301 for California** — the reveal
would be showing a decomposition 2.4x away from the number the player was scored against. The
cause is structural, not a bad rate: residential electricity is dominated by climate-driven
heating and cooling load, which is not a factor in the chain and cannot be added without turning
a Fermi estimate into a weather model. Using per-state rates instead would make the gate circular.
So the chain is not a valid decomposition of that quantity, and the measurement is the evidence.

### 4.2 Two structural decisions

**Rows are states, not cities.** Federal fuel and electricity data is published per state, not
per metropolitan area. The Census CBSA file (§3.1) was downloaded and is **unused** — noted so a
future session does not assume it is wired in.

**`truth` is the independently published figure, not the chain product.** The plan computes
`truth` from the chain and notes that this "would make the cross-check circular if it stopped
there". With a published reference for *every* row, that compromise is unnecessary: each item's
`truth` is its own MF-21 or VM-2 figure, and the chain becomes the reveal — one way to have got
there. The player is therefore scored against reality, and the gate that compares chain to truth
is genuine evidence rather than a restatement.

Consequences: `truth.vintage` is **2024** (the FHWA data year), not the Census population vintage;
and `truth.source` names the specific FHWA table per row.

### 4.3 Row set: the 50 states

- **District of Columbia excluded** — §3.6, commuter fuel-purchase artefact (+0.42 log10).
- **Puerto Rico excluded** — present in VM-2 but not in MF-21, so it has no reference for both
  templates.
- **Tennessee** is written `Tennessee (2)` in VM-2 with footnote *"The State modified their
  process for estimating summary VMT data."* Name normalisation strips the marker. Recorded
  because the un-normalised join silently produced a **49-row table that still called itself 50**
  — the failure is quiet by nature.
- Populations are rounded to two significant figures per the plan's rule. Cost is at most
  **0.020 log10**, measured, against a tolerance of 0.30.

### 4.4 The two templates that ship

| | `fermi/gasoline` | `fermi/vehicle-miles` |
|---|---|---|
| Question | gallons of gasoline burned on the roads of *state*, per year | vehicle-miles driven in *state*, per year |
| Chain | pop x vehicles/person x miles/vehicle-yr / mpg | pop x vehicles/person x miles/vehicle-yr |
| Rates | VM-1 light duty: 0.7973 veh/person, 10,786.6516 mi/veh, 23.4307 mpg | VM-1 all vehicles: 0.8751 veh/person, 11,071.4124 mi/veh |
| Reference (`truth`) | MF-21 highway gasoline, per state | VM-2 total annual vehicle-miles, per state |
| Reference measured by | state fuel-tax receipts | HPMS traffic counts |

**Measured chain-vs-truth gaps over the 50 shipped rows, with the shipped rounded populations:**

```
gasoline       n=50  median -0.0388  min -0.2005 (Alabama)  max +0.1781 (New York)  max|gap| 0.2005
vehicle-miles  n=50  median -0.0225  min -0.2306 (Wyoming)  max +0.2050 (New York)  max|gap| 0.2306
both templates: 50/50 within 0.25 log10
```

**Honest note on variety.** The two chains are **nested** — gasoline is the vehicle-miles chain
divided by fuel economy. They are not independent content. They ship together because each has
its own separately-measured published reference and they prove the table x template pattern, but
a genuinely different domain was attempted twice (electricity, water) and rejected on evidence
both times. A third template should come from a different domain, not a third slice of FHWA.

---

## Status

Task 0 **complete**. Two templates, 50 rows each, every rate and every reference figure retrieved
from a named federal table on 2026-08-24, with the chain-vs-truth gap measured on all 100 items.

---

## Part 5: the tolerance, and where it came from

Measured by `npx tsx tools/fermi-crosscheck.ts` against the shipped content — 100 comparisons
(2 templates x 50 rows), not the 2 the plan asked for. Reproduces §3.5 exactly.

```
fermi/gasoline       n=50  median -0.0388  min -0.2005 (Alabama)  max +0.1781 (New York)  worst 0.2005
fermi/vehicle-miles  n=50  median -0.0225  min -0.2306 (Wyoming)  max +0.2050 (New York)  worst 0.2306
both: 50/50 within 0.25
```

`1.5 x 0.2306 = 0.3458`, rounded to one decimal -> **`CROSS_CHECK_TOLERANCE_LOG10 = 0.30`**.

The tolerance was chosen against the catch it has to make, not against what makes the gate pass.
A rate wrong by a factor of two shifts *every* row by exactly 0.301, and the gate trips if even
one row exceeds tolerance:

| tolerance | headroom | rows failing on a 2x rate error |
|---|---|---|
| 0.25 | 1.08x | gasoline 28/50, vehicle-miles 32/50 |
| **0.30** | **1.30x** | **gasoline 20/50, vehicle-miles 19/50** |
| 0.35 | 1.52x | gasoline 9/50, vehicle-miles 11/50 |
| 0.40 | 1.73x | gasoline 3/50, vehicle-miles 6/50 |

0.25 leaves only 8% headroom — a routine data refresh would turn CI red. 0.40 is where the catch
starts to thin out to a handful of rows. 0.30 keeps a 1.3x margin over the worst observed gap and
still fails on roughly 40% of all rows if a rate is off by 2x.

**Do not widen this to make a failure go away.** Re-run the tool, fix the chain, or record
honestly that the two sources disagree and by how much.


---

## Part 6: playing it, 2026-08-24 (plan Task 10 step 4)

Eight questions played end to end in a browser against `next dev`. Everything in the plan's
checklist behaved: adding factors, refusal of a zero bound without consuming the question,
in-place settlement, the canonical reveal, and the calibration bar reading
*"8 of 50 answers — hit rate hidden until it can mean something."* Two truths were spot-checked
against the source tables and matched exactly — New Mexico 886,527,000 gallons (MF-21 886,527
thousand) and New Jersey 79,459,800,000 vehicle-miles (VM-2 79,459.8 million).

**Spec §11, free-form chain entry — the open question, now observed.** It works, but the reveal
is a *worked example*, not a diff, and cannot be anything else. Entering
`population x vehicles per person x gallons per vehicle-year` returns a canonical chain of
`population x vehicles per person x miles per vehicle-year x 1/(miles per gallon)` — four factors
against three, and the shared ones are not aligned on screen. A player cannot read off which of
their factors was wrong; they can only compare the combined interval. The heading already says
"One way to decompose it", which is the honest framing, so nothing is broken — but any future
attempt to score or diff individual factors against the canonical chain would need commensurable
chains, and free-form entry cannot give that. Leave it as a worked example.

**The single-factor path degrades correctly.** One factor gives naive width = combined width
(2.0 and 2.0) rather than a spurious quadrature gain. The lesson paragraph still reads sensibly.

**Content variety is the real weakness, and it shows immediately.** The seeded session drew
gasoline for questions 1, 2 and 3 consecutively — three near-identical prompts differing only in
the state. This is the nesting recorded in §4.4 arriving in practice rather than in theory. The
mathematics, the gates and the runner are all template-agnostic, so the fix is content: one
template from a genuinely different domain, not a third slice of FHWA.

**Cosmetic, not a defect.** A two-line question statement shifts the form down; nothing overlaps
or clips.
