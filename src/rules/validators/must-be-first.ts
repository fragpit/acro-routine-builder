import type { Program, Manoeuvre, Violation } from '../types';

/**
 * 1.1: Flat Stall to Infinity Tumbling MUST be the first manoeuvre in a run.
 */
export function validateMustBeFirst(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    run.tricks.forEach((trick, trickIndex) => {
      const m = manoeuvres[trick.manoeuvreId];
      if (m?.mustBeFirst && trickIndex !== 0) {
        violations.push({
          ruleId: 'must-be-first',
          severity: 'error',
          description: `Run ${runIndex + 1}: ${m.name} must be the first manoeuvre of the run`,
          affectedCells: [{ runIndex, trickIndex }],
        });
      }
    });
  });
  return violations;
}
