import type { Program, Manoeuvre, Violation } from '../types';

/**
 * 4.4: In AWT, Misty to Misty does not exist and cannot be used.
 */
export function validateAwtMistyToMisty(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  if (!program.awtMode) return [];
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    run.tricks.forEach((trick, trickIndex) => {
      const m = manoeuvres[trick.manoeuvreId];
      if (m?.awtExcluded) {
        violations.push({
          ruleId: 'awt-misty-to-misty',
          severity: 'error',
          description: `Run ${runIndex + 1}: ${m.name} cannot be used in AWT`,
          affectedCells: [{ runIndex, trickIndex }],
        });
      }
    });
  });
  return violations;
}
