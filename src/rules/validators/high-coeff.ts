import type { Program, Manoeuvre, Violation } from '../types';

/**
 * 3.1: Maximum 2 manoeuvres with coefficient >= 1.95 per run. Extras are
 * unscored (warning, not error).
 */
export function validateHighCoeff(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    const highCoeff = run.tricks
      .map((t, i) => ({ m: manoeuvres[t.manoeuvreId], i }))
      .filter(({ m }) => m && m.coefficient >= 1.95);
    if (highCoeff.length > 2) {
      violations.push({
        ruleId: 'high-coeff',
        severity: 'warning',
        description: `Run ${runIndex + 1}: more than 2 manoeuvres with coefficient >= 1.95 (${highCoeff.length})`,
        affectedCells: highCoeff.map(({ i }) => ({ runIndex, trickIndex: i })),
      });
    }
  });
  return violations;
}
