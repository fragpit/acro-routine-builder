/**
 * Bonus that can be applied to a trick. Affects technical score calculation.
 * Some bonuses are mutually exclusive within a trick (see availableBonuses on Manoeuvre).
 */
export interface BonusDefinition {
  id: string;
  label: string;
  percent: number;
  countsAs?: BonusCategory;
}

export type BonusCategory = 'twisted' | 'reversed' | 'flipped';

/**
 * Groups used by validators to check per-run limits and mutual exclusions.
 * stall_to_infinite - section 3.2 of trick_rules.md
 * tumbling_related - section 3.3 (tumbling/infinity/rhythmic family)
 */
export type ManoeuvreGroup = 'stall_to_infinite' | 'tumbling_related';

/**
 * Full definition of an aerobatic solo manoeuvre with both structured fields
 * (for validators) and description bullet points (for UI display).
 */
export interface Manoeuvre {
  id: string;
  name: string;
  coefficient: number;
  sectionNumber: string;
  description: string[];
  forbiddenConnectionTo: string[];
  cannotBeLastTwo: boolean;
  mustBeFirst: boolean;
  repetitionAllowed: boolean;
  noSide: boolean;
  availableBonuses: BonusDefinition[];
  mutualExclusions: string[][];
  groups: ManoeuvreGroup[];
  awtExcluded?: boolean;
}

export type Side = 'L' | 'R';

export interface PlacedTrick {
  id: string;
  manoeuvreId: string;
  side: Side | null;
  selectedBonuses: string[];
}

export interface Run {
  id: string;
  tricks: PlacedTrick[];
}

export interface Program {
  awtMode: boolean;
  runs: Run[];
  repeatAfterRuns: number;
}

export interface AffectedCell {
  runIndex: number;
  trickIndex: number;
}

export interface Violation {
  ruleId: string;
  description: string;
  severity: 'error' | 'warning';
  affectedCells: AffectedCell[];
  /**
   * Choreography mark deduction in percent, attributed to the specific run.
   * Per FAI 3.3.3, repetition penalty reduces the choreography mark of the
   * run containing the repeated (second or later) occurrence - not a global
   * total across runs.
   */
  choreoPenaltyByRun?: Record<number, number>;
}
