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
  defaultBonuses: string[];
  /**
   * Free-form program-level notes. Populated by the user via the notes editor
   * and by AWT imports (combined judges' notes per run, prefixed with
   * `Run N: `). Empty string when nothing has been entered. Always a string,
   * never undefined - imports default missing values to '' so consumers can
   * read it without optional-chaining. Length is capped at MAX_NOTES_LENGTH;
   * the JSON validator rejects oversized notes and AWT imports truncate.
   */
  notes: string;
}

/**
 * Hard ceiling on `Program.notes` length. Enough room for ~2 000 words of
 * free-form notes plus pasted AWT judges' notes - well above any realistic
 * use case. Enforced at: JSON import validator (rejects), AWT mapping
 * (truncates combined output), notes editor textarea (browser stops typing).
 * Avoids: localStorage quota exhaustion, JSON.parse memory blow-up on
 * malicious imports, and oversized share-link payloads.
 */
export const MAX_NOTES_LENGTH = 10_000;

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
   * Bonus malus in percent, attributed to the specific run. Per FAI
   * 3.3.3, the repetition penalty applies to the run containing the
   * repeated (second or later) occurrence - not a global total across
   * runs. The penalty is subtracted from the run's bonus percentage,
   * matching the AWT canonical formula
   * `bonus = (technical + choreography) * (bonus% - malus%) / 100`.
   */
  bonusMalusByRun?: Record<number, number>;
}
