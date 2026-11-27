/**
 * Deterministic exposure, commute savings, and assumptions engine for CleanSaans.
 * All numerical health-risk and savings outputs originate strictly from this module.
 * All outputs are approximate estimates for awareness, not medical advice.
 */

export type Activity = "rest" | "walk" | "exercise";
export type Place = "outdoor" | "open_window" | "closed" | "purifier" | "n95_outdoor";
export type Mode = "car" | "bike" | "bus" | "metro" | "walk" | "cycle";

export interface Slot {
  hours: number;
  place: Place;
  activity: Activity;
  pm25: number;
}

export interface Range {
  low: number;
  high: number;
}

export interface CompareResult {
  baseline: Range;
  plan: Range;
  percentSaved: number;
}

export interface SwitchImpactResult {
  co2KgSaved: number;
  inrSaved: number;
}

export interface Assumption {
  id: string;
  label: string;
  value: string;
  source: string;
  note: string;
}

// Approximate inhalation rate multipliers relative to resting breathing:
// rest = 1x baseline, walk = 1.5x light exertion, exercise = 3x vigorous exertion.
const BREATH: Record<Activity, number> = {
  rest: 1,
  walk: 1.5,
  exercise: 3,
};

// Approximate [low, high] PM2.5 penetration/exposure factors vs. ambient outdoor air:
// - outdoor: 1.0-1.0 (unfiltered ambient outdoor PM2.5)
// - open_window: 0.7-0.9 (indoor/outdoor infiltration with open windows)
// - closed: 0.4-0.6 (closed windows/doors; varies by home sealing and gaps)
// - purifier: 0.15-0.3 (properly sized HEPA purifier in a closed room)
// - n95_outdoor: 0.2-0.4 (well-fitted N95 outdoors accounting for real-world seal leakage)
const FACTOR: Record<Place, readonly [number, number]> = {
  outdoor: [1, 1],
  open_window: [0.7, 0.9],
  closed: [0.4, 0.6],
  purifier: [0.15, 0.3],
  n95_outdoor: [0.2, 0.4],
};

// Berkeley Earth approximation: ~22 ug/m3 of 24-hour PM2.5 exposure corresponds
// to roughly 1 cigarette per day in long-term mortality risk communication.
const UG_PER_CIGARETTE_DAY = 22;

// Approximate CO2 emissions per passenger-km (kg CO2/km); verify against IPCC / India GHG Program:
// - car: 0.17 (low-occupancy urban petrol/diesel car estimate)
// - bike: 0.08 (conservative mixed two-wheeler estimate)
// - bus: 0.04 (urban intra-city bus per passenger-km estimate)
// - metro: 0.03 (Indian grid-powered metro rail per passenger-km estimate)
// - walk / cycle: 0 (zero tailpipe emissions)
const CO2_PER_KM: Record<Mode, number> = {
  car: 0.17,
  bike: 0.08,
  bus: 0.04,
  metro: 0.03,
  walk: 0,
  cycle: 0,
};

// Indicative Indian urban out-of-pocket running cost per km (INR/km), approximate:
// - car: Rs 8/km, bike: Rs 3/km, bus: Rs 1.5/km, metro: Rs 2/km, walk/cycle: Rs 0/km.
const INR_PER_KM: Record<Mode, number> = {
  car: 8,
  bike: 3,
  bus: 1.5,
  metro: 2,
  walk: 0,
  cycle: 0,
};

const round = (value: number): number => {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const nonNegativeFinite = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

/**
 * Estimates the approximate daily cigarette-equivalent PM2.5 exposure range
 * across a list of time-slotted activities and micro-environments.
 */
export function cigarettes(slots: readonly Slot[]): Range {
  const calc = (boundIndex: 0 | 1): number =>
    slots.reduce((total, slot) => {
      const pm25 = nonNegativeFinite(slot.pm25);
      const hours = nonNegativeFinite(slot.hours);
      const factor = FACTOR[slot.place][boundIndex];
      const breath = BREATH[slot.activity];
      return total + pm25 * factor * breath * hours;
    }, 0) /
    24 /
    UG_PER_CIGARETTE_DAY;

  return {
    low: round(calc(0)),
    high: round(calc(1)),
  };
}

/**
 * Compares baseline vs. planned exposure ranges and returns approximate percentage saved
 * using range midpoints. Returns percentSaved = 0 if baseline exposure is 0.
 */
export function compare(baseline: readonly Slot[], plan: readonly Slot[]): CompareResult {
  const baselineRange = cigarettes(baseline);
  const planRange = cigarettes(plan);
  const midpoint = (range: Range): number => (range.low + range.high) / 2;
  const baselineMid = midpoint(baselineRange);
  const percentSaved =
    baselineMid > 0 ? Math.round(((baselineMid - midpoint(planRange)) / baselineMid) * 100) : 0;

  return {
    baseline: baselineRange,
    plan: planRange,
    percentSaved: Object.is(percentSaved, -0) ? 0 : percentSaved,
  };
}

/**
 * Estimates approximate CO2 (kg) and out-of-pocket cost (INR) saved when switching
 * commute modes over a given distance in kilometers.
 * Returns the real signed value (negative if switching to a higher-emission/cost mode).
 */
export function switchImpact(fromMode: Mode, toMode: Mode, km: number): SwitchImpactResult {
  const safeKm = nonNegativeFinite(km);
  const co2KgSaved = round((CO2_PER_KM[fromMode] - CO2_PER_KM[toMode]) * safeKm);
  const rawInrSaved = Math.round((INR_PER_KM[fromMode] - INR_PER_KM[toMode]) * safeKm);

  return {
    co2KgSaved,
    inrSaved: Object.is(rawInrSaved, -0) ? 0 : rawInrSaved,
  };
}

/**
 * Transparent list of all modeling assumptions and citations surfaced in the UI
 * ("Ye numbers kaise nikle?" modal). Every entry explicitly notes approximation status and source.
 */
export const ASSUMPTIONS: readonly Assumption[] = [
  {
    id: "cigarette_equivalence",
    label: "PM2.5 to cigarette equivalence",
    value: `~${UG_PER_CIGARETTE_DAY} ug/m3 PM2.5 over 24h approx = 1 cigarette`,
    source:
      "Berkeley Earth, Air Pollution and Cigarette Equivalence (approximation, not a clinical measure)",
    note: "Approximate statistical mortality-risk communication tool; not literal chemical/medical equivalence and not medical advice.",
  },
  {
    id: "breathing_multipliers",
    label: "Activity breathing rate multipliers",
    value: `Rest ${BREATH.rest}x, Walk ${BREATH.walk}x, Exercise ${BREATH.exercise}x (approx)`,
    source: "US EPA Exposure Factors Handbook (approximate adult minute-ventilation scaling)",
    note: "Approximate inhalation scaling relative to resting intake; actual breathing varies by age, child/elderly physiology, and exertion.",
  },
  {
    id: "open_window_factor",
    label: "Open window indoor infiltration",
    value: `${FACTOR.open_window[0]}-${FACTOR.open_window[1]} of outdoor PM2.5 (approx)`,
    source:
      "Indoor/outdoor PM2.5 infiltration literature (approximate natural-ventilation I/O ratio)",
    note: "Approximate range; varies with wind, window opening area, floor height, and indoor sources such as cooking smoke.",
  },
  {
    id: "closed_window_factor",
    label: "Closed window indoor infiltration",
    value: `${FACTOR.closed[0]}-${FACTOR.closed[1]} of outdoor PM2.5 (approx)`,
    source: "Indoor/outdoor PM2.5 infiltration literature (approximate closed-envelope I/O ratio)",
    note: "Approximate range; depends strongly on frame gaps, door sealing, and building air-exchange rates.",
  },
  {
    id: "purifier_factor",
    label: "HEPA purifier in closed room",
    value: `${FACTOR.purifier[0]}-${FACTOR.purifier[1]} of outdoor PM2.5 (approx)`,
    source: "Closed-room HEPA CADR indoor air-quality studies (approximate indoor reduction)",
    note: "Approximate range assuming a correctly sized HEPA purifier running continuously with doors and windows closed.",
  },
  {
    id: "n95_factor",
    label: "Well-fitted N95 mask outdoors",
    value: `${FACTOR.n95_outdoor[0]}-${FACTOR.n95_outdoor[1]} of outdoor PM2.5 (approx)`,
    source: "NIOSH/BIS N95 respiratory filtration effectiveness studies in real-world use (approx)",
    note: "Approximate effective exposure range accounting for real-world face-seal leakage; cloth or surgical masks offer much less protection.",
  },
  {
    id: "co2_per_km",
    label: "Commute CO2 emissions per km",
    value: `Car ${CO2_PER_KM.car}, Bike ${CO2_PER_KM.bike}, Bus ${CO2_PER_KM.bus}, Metro ${CO2_PER_KM.metro}, Walk/Cycle ${CO2_PER_KM.walk} kg CO2/km (approx)`,
    source:
      "Approximate planning factors; verify against IPCC / India GHG Program (WRI India / CII / TERI) and CEA India grid factors",
    note: "Approximate per-passenger-km estimates: India GHG Program reports ~0.10-0.17+ kg/km for petrol/diesel cars, ~0.03-0.04 kg/km for typical two-wheelers (0.08 used conservatively for mixed fleets), ~0.015-0.08 kg/pax-km for intra-city buses, and ~0.02-0.045 kg/pax-km for Indian metro rail.",
  },
  {
    id: "inr_per_km",
    label: "Commute out-of-pocket cost per km",
    value: `Car Rs ${INR_PER_KM.car}, Bike Rs ${INR_PER_KM.bike}, Bus Rs ${INR_PER_KM.bus}, Metro Rs ${INR_PER_KM.metro}, Walk/Cycle Rs ${INR_PER_KM.walk}/km (approx)`,
    source: "Indicative Indian urban fuel and public transit fare assumptions (approx)",
    note: "Approximate running-cost estimate based on typical Indian metro/bus fares and fuel prices; excludes vehicle ownership, maintenance, and parking.",
  },
] as const;
