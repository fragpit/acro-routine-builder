import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import type { PlacedTrick, Program, Run, Side } from '../rules/types';
import type {
  AwtCompetitionWithResults,
  AwtFlight,
  AwtUniqueTrick,
} from './awt-api';

/**
 * Shape of a trick the AWT API returned that couldn't be placed into the
 * current ARB catalog (unknown manoeuvre, or manoeuvre + bonus combination
 * that ARB doesn't model). Shown to the user in the import preview so they
 * understand why the imported run is shorter than the original.
 */
export interface UnmappedTrick {
  runIndex: number;
  trickIndex: number;
  awtName: string;
  reason: 'unknown-manoeuvre' | 'unknown-bonus';
  details?: string;
}

export interface MappedFlight {
  run: Run;
  unmapped: UnmappedTrick[];
}

/**
 * Summary of the pilot's real scoring at the imported competition.
 *
 * `overallScore` is the server-aggregated sum of per-run final scores
 * (read from `results.results.overall[]`), not recomputed client-side.
 *
 * `tq` / `cq` map the averaged judges' technical / choreography marks
 * (0-10 scale) to the builder's quality corrections (0-100, rounded to
 * the nearest 10). `null` when the competition has no published judge
 * marks for the selected pilot.
 */
export interface AccuracyStats {
  overallScore: number | null;
  judgeTechAvg: number | null;
  judgeChoreoAvg: number | null;
  tq: number | null;
  cq: number | null;
  runsUsed: number;
}

export interface MappedCompetition {
  program: Program;
  pilotName: string;
  unmapped: UnmappedTrick[];
  accuracy: AccuracyStats;
}

/**
 * AWT base_trick (case-insensitive, whitespace-normalised) → ARB manoeuvreId.
 *
 * Built from two sources of truth:
 *   1. ARB catalog at src/data/manoeuvres.ts (FAI 2025 solo, 38 tricks)
 *   2. Observed AWT API strings - includes orthographic variants that differ
 *      from ARB:
 *        - AWT "Rythmic" / "Anti-Rythmic" vs ARB "Rhythmic" / "Anti-Rhythmic"
 *        - AWT "Mac Twist to SAT" (with space) vs ARB id "mactwist_to_sat"
 *      Keys here are pre-normalised by `normaliseTrickName`.
 */
const BASE_TRICK_TO_MANOEUVRE_ID: Record<string, string> = {
  'tail slide': 'tail_slide',
  'sat': 'sat',
  'asymetric spiral': 'asymetric_spiral',
  'asymmetric spiral': 'asymetric_spiral',
  'wingovers': 'wingovers',
  'looping': 'looping',
  'asymetric sat': 'asymetric_sat',
  'asymmetric sat': 'asymetric_sat',
  'stall': 'stall',
  'misty flip': 'misty_flip',
  'x-chopper': 'x_chopper',
  'xchopper': 'x_chopper',
  'x-chopper to sat': 'x_chopper_to_sat',
  'misty to sat': 'misty_to_sat',
  'helicopter': 'helicopter',
  'mac twist': 'mac_twist',
  'mactwist': 'mac_twist',
  'misty to helicopter': 'misty_to_helicopter',
  'misty to misty': 'misty_to_misty',
  'twister': 'twister',
  'twister (helicopter to helicopter)': 'twister',
  'tumbling': 'tumbling',
  'anti-rhythmic sat': 'anti_rhythmic_sat',
  'anti-rythmic sat': 'anti_rhythmic_sat',
  'anti rhythmic sat': 'anti_rhythmic_sat',
  'anti rythmic sat': 'anti_rhythmic_sat',
  'sat to helicopter': 'sat_to_helicopter',
  'helicopter to sat': 'helicopter_to_sat',
  'mac twist to sat': 'mactwist_to_sat',
  'mactwist to sat': 'mactwist_to_sat',
  'mac twist to helicopter': 'mac_twist_to_helicopter',
  'mactwist to helicopter': 'mac_twist_to_helicopter',
  'infinity tumbling': 'infinity_tumbling',
  'cowboy': 'cowboy',
  'supercowboy': 'supercowboy',
  'super cowboy': 'supercowboy',
  'corkscrew': 'corkscrew',
  'joker': 'joker',
  'mac twist to tumbling': 'mac_twist_to_tumbling',
  'mactwist to tumbling': 'mac_twist_to_tumbling',
  'rhythmic sat': 'rhythmic_sat',
  'rythmic sat': 'rhythmic_sat',
  'esfera': 'esfera',
  'x-chopper to tumbling': 'x_chopper_to_tumbling',
  'super stall to infinity tumbling': 'super_stall_to_infinity',
  'super stall to infinity': 'super_stall_to_infinity',
  'flat stall to infinity tumbling': 'flat_stall_to_infinity',
  'flat stall to infinity': 'flat_stall_to_infinity',
  'macfly': 'macfly',
  'mistyfly': 'mistyfly',
  'helifly': 'helifly',
  'satfly': 'satfly',
  'misty to tumbling': 'misty_to_tumbling',
};

/**
 * AWT bonus name (from UniqueTrick.bonuses[*].name, lowercased) → ARB bonus id.
 * ARB bonus ids are declared in src/data/manoeuvres.ts lines 3-13.
 */
const BONUS_NAME_TO_ARB_ID: Record<string, string> = {
  'twisted': 'twisted',
  'twist': 'twisted',
  'twisted exit': 'twisted_exit',
  'full twisted': 'full_twisted',
  'devil twist': 'devil_twist',
  'devil twist stall': 'devil_twist_stall',
  'reverse': 'reverse',
  'reversed': 'reverse',
  'flip': 'flip',
  'double flip': 'double_flip',
  'hardcore entry': 'hardcore_entry',
  'hardcore': 'hardcore_entry',
  'cab slide': 'cab_slide',
  'to twisted sat': 'to_twisted_sat',
};

function normaliseTrickName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Look up an AWT base_trick string in the mapping table. Case/space insensitive. */
export function mapBaseTrickName(awtBaseTrick: string): string | null {
  const normalised = normaliseTrickName(awtBaseTrick);
  return BASE_TRICK_TO_MANOEUVRE_ID[normalised] ?? null;
}

/** Map a single AWT bonus name to an ARB bonus id, or null if unknown. */
export function mapBonusName(awtBonusName: string): string | null {
  const normalised = normaliseTrickName(awtBonusName);
  return BONUS_NAME_TO_ARB_ID[normalised] ?? null;
}

function pickSide(uniqueness: string[], noSide: boolean): Side | null {
  if (noSide) return null;
  if (uniqueness.includes('left')) return 'L';
  if (uniqueness.includes('right')) return 'R';
  return null;
}

function makeId(prefix: string, runIndex: number, trickIndex: number): string {
  return `awt_${prefix}_${runIndex}_${trickIndex}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapUniqueTrick(
  trick: AwtUniqueTrick,
  runIndex: number,
  trickIndex: number,
): { placed: PlacedTrick | null; unmapped: UnmappedTrick | null } {
  const manoeuvreId = mapBaseTrickName(trick.base_trick);
  if (!manoeuvreId) {
    return {
      placed: null,
      unmapped: {
        runIndex,
        trickIndex,
        awtName: trick.name,
        reason: 'unknown-manoeuvre',
        details: `base_trick "${trick.base_trick}" has no ARB equivalent`,
      },
    };
  }
  const manoeuvre = MANOEUVRES_BY_ID[manoeuvreId];
  if (!manoeuvre) {
    return {
      placed: null,
      unmapped: {
        runIndex,
        trickIndex,
        awtName: trick.name,
        reason: 'unknown-manoeuvre',
        details: `ARB manoeuvre id "${manoeuvreId}" not in catalog`,
      },
    };
  }
  const allowedBonusIds = new Set(manoeuvre.availableBonuses.map((b) => b.id));
  const mappedBonuses: string[] = [];
  const droppedBonuses: string[] = [];
  for (const b of trick.bonuses ?? []) {
    const arbId = mapBonusName(b.name);
    if (arbId && allowedBonusIds.has(arbId)) {
      if (!mappedBonuses.includes(arbId)) mappedBonuses.push(arbId);
    } else {
      droppedBonuses.push(b.name);
    }
  }
  const placed: PlacedTrick = {
    id: makeId('trick', runIndex, trickIndex),
    manoeuvreId,
    side: pickSide(trick.uniqueness ?? [], manoeuvre.noSide),
    selectedBonuses: mappedBonuses,
  };
  const unmapped: UnmappedTrick | null =
    droppedBonuses.length > 0
      ? {
          runIndex,
          trickIndex,
          awtName: trick.name,
          reason: 'unknown-bonus',
          details: `dropped bonuses: ${droppedBonuses.join(', ')}`,
        }
      : null;
  return { placed, unmapped };
}

/** Transform one AWT flight into an ARB Run. */
export function mapFlightToRun(flight: AwtFlight, runIndex: number): MappedFlight {
  const run: Run = {
    id: makeId('run', runIndex, 0),
    tricks: [],
  };
  const unmapped: UnmappedTrick[] = [];
  const tricks = flight.tricks ?? [];
  tricks.forEach((trick, trickIndex) => {
    const { placed, unmapped: skip } = mapUniqueTrick(trick, runIndex, trickIndex);
    if (placed) run.tricks.push(placed);
    if (skip) unmapped.push(skip);
  });
  return { run, unmapped };
}

/**
 * Extract all unique pilots who flew in this competition, with flight counts.
 * Looks at every run's overall results and deduplicates by civlid.
 */
export interface PilotSummary {
  civlid: number;
  name: string;
  runCount: number;
}

export function extractPilots(comp: AwtCompetitionWithResults): PilotSummary[] {
  const byCivlid = new Map<number, PilotSummary>();
  for (const run of comp.results?.runs_results ?? []) {
    const flights = run.results?.overall ?? [];
    for (const flight of flights) {
      const pilot = flight.pilot;
      if (!pilot) continue;
      const existing = byCivlid.get(pilot.civlid);
      if (existing) {
        existing.runCount += 1;
      } else {
        byCivlid.set(pilot.civlid, {
          civlid: pilot.civlid,
          name: pilot.name,
          runCount: 1,
        });
      }
    }
  }
  return Array.from(byCivlid.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gather one pilot's flights across all runs and transform them into an ARB
 * Program. Returns the program plus a list of unmapped tricks so the UI can
 * warn the user before they commit the import.
 */
function roundMarkToQuality(mark: number): number {
  // Judges' marks are on the 0-10 scale; quality corrections are 0-100.
  // Multiply, round to the nearest 10, clamp.
  const scaled = mark * 10;
  const rounded = Math.round(scaled / 10) * 10;
  return Math.max(0, Math.min(100, rounded));
}

function extractAccuracy(
  comp: AwtCompetitionWithResults,
  civlid: number,
): AccuracyStats {
  const techMarks: number[] = [];
  const choreoMarks: number[] = [];
  const runsResults = comp.results?.runs_results ?? [];
  for (const runResult of runsResults) {
    const flights = runResult.results?.overall ?? [];
    const flight = flights.find((f) => f.pilot?.civlid === civlid);
    if (!flight || flight.did_not_start) continue;
    const jm = flight.final_marks?.judges_mark;
    if (!jm) continue;
    if (typeof jm.technical === 'number') techMarks.push(jm.technical);
    if (typeof jm.choreography === 'number') choreoMarks.push(jm.choreography);
  }
  const runsUsed = Math.max(techMarks.length, choreoMarks.length);
  const avg = (arr: number[]) =>
    arr.length === 0 ? null : arr.reduce((s, v) => s + v, 0) / arr.length;
  const judgeTechAvg = avg(techMarks);
  const judgeChoreoAvg = avg(choreoMarks);
  const overall =
    comp.results?.results?.overall?.find((e) => e.pilot?.civlid === civlid) ??
    null;
  return {
    overallScore: typeof overall?.score === 'number' ? overall.score : null,
    judgeTechAvg,
    judgeChoreoAvg,
    tq: judgeTechAvg == null ? null : roundMarkToQuality(judgeTechAvg),
    cq: judgeChoreoAvg == null ? null : roundMarkToQuality(judgeChoreoAvg),
    runsUsed,
  };
}

export function mapCompetitionToProgram(
  comp: AwtCompetitionWithResults,
  civlid: number,
): MappedCompetition {
  const runs: Run[] = [];
  const unmapped: UnmappedTrick[] = [];
  let pilotName = '';
  const runsResults = comp.results?.runs_results ?? [];
  runsResults.forEach((runResult, runIndex) => {
    const flights = runResult.results?.overall ?? [];
    const flight = flights.find((f) => f.pilot?.civlid === civlid);
    if (!flight) {
      runs.push({ id: makeId('run', runIndex, 0), tricks: [] });
      return;
    }
    if (flight.pilot && !pilotName) pilotName = flight.pilot.name;
    if (flight.did_not_start) {
      runs.push({ id: makeId('run', runIndex, 0), tricks: [] });
      return;
    }
    const mapped = mapFlightToRun(flight, runIndex);
    runs.push(mapped.run);
    unmapped.push(...mapped.unmapped);
  });
  const program: Program = {
    // Always import in AWQ mode. AWT mode adds restrictions (e.g.
    // Misty-to-Misty ban) that would flag violations on routines the
    // pilot actually flew - users can flip the toggle manually if
    // they want to build against AWT rules.
    awtMode: false,
    runs,
    repeatAfterRuns: runs.length === 5 ? 2 : Math.max(1, runs.length || 1),
    defaultBonuses: [],
  };
  return {
    program,
    pilotName: pilotName || `Pilot ${civlid}`,
    unmapped,
    accuracy: extractAccuracy(comp, civlid),
  };
}
