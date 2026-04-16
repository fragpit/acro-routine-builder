import type { Program, Manoeuvre, Violation } from '../types';
import { getBonusCategory } from '../bonus-category';

/**
 * 1.2: Certain manoeuvres cannot be in the last two positions of a run.
 * Also: flipped manoeuvres cannot be in the last 2 positions.
 */
export function validateLastTwo(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    if (run.tricks.length < 2) return;
    const lastTwoIndices = [run.tricks.length - 2, run.tricks.length - 1];
    for (const idx of lastTwoIndices) {
      const trick = run.tricks[idx];
      const m = manoeuvres[trick.manoeuvreId];
      if (!m) continue;
      if (m.cannotBeLastTwo) {
        violations.push({
          ruleId: 'last-two',
          severity: 'error',
          description: `Run ${runIndex + 1}: ${m.name} cannot be one of the last two manoeuvres`,
          affectedCells: [{ runIndex, trickIndex: idx }],
        });
      }
      const hasFlip = trick.selectedBonuses.some(
        (b) => getBonusCategory(m, b) === 'flipped',
      );
      if (hasFlip) {
        violations.push({
          ruleId: 'last-two',
          severity: 'error',
          description: `Run ${runIndex + 1}: flipped ${m.name} cannot be one of the last two manoeuvres`,
          affectedCells: [{ runIndex, trickIndex: idx }],
        });
      }
    }
  });
  return violations;
}
