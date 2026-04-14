import type { Program, Manoeuvre, Violation } from '../types';

const INCOMPATIBLE_WITH_STALL_TO_INF = new Set(['x_chopper_to_tumbling', 'misty_to_tumbling']);

/**
 * 3.4: X-Chopper to Tumbling and Misty to Tumbling cannot be in the same run
 * as a stall-to-infinite type manoeuvre.
 */
export function validateIncompatible(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    const stallToInfCells = run.tricks
      .map((t, i) => ({ m: manoeuvres[t.manoeuvreId], i }))
      .filter(({ m }) => m && m.groups.includes('stall_to_infinite'));
    const incompatibleCells = run.tricks
      .map((t, i) => ({ m: manoeuvres[t.manoeuvreId], i }))
      .filter(({ m }) => m && INCOMPATIBLE_WITH_STALL_TO_INF.has(m.id));
    if (stallToInfCells.length > 0 && incompatibleCells.length > 0) {
      violations.push({
        ruleId: 'incompatible',
        severity: 'error',
        description: `Run ${runIndex + 1}: X-Chopper/Misty to Tumbling cannot be in the same run as a stall-to-infinite manoeuvre`,
        affectedCells: [
          ...stallToInfCells.map(({ i }) => ({ runIndex, trickIndex: i })),
          ...incompatibleCells.map(({ i }) => ({ runIndex, trickIndex: i })),
        ],
      });
    }
  });
  return violations;
}
