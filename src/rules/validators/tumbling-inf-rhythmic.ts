import type { Program, Manoeuvre, Violation } from '../types';

/**
 * 3.3: Only 2 tumbling/infinity/rhythmic related manoeuvres per run.
 */
export function validateTumblingInfRhythmic(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    const cells = run.tricks
      .map((t, i) => ({ m: manoeuvres[t.manoeuvreId], i }))
      .filter(({ m }) => m && m.groups.includes('tumbling_related'));
    if (cells.length > 2) {
      violations.push({
        ruleId: 'tumbling-inf-rhythmic',
        severity: 'error',
        description: `Run ${runIndex + 1}: more than 2 tumbling/infinity/rhythmic related manoeuvres (${cells.length})`,
        affectedCells: cells.map(({ i }) => ({ runIndex, trickIndex: i })),
      });
    }
  });
  return violations;
}
