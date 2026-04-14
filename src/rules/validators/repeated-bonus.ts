import type { Manoeuvre, Program, Violation } from '../types';
import { unrewardedBonusesByTrick } from '../repeated-bonus';

/**
 * 4.3: For repetition-allowed manoeuvres, the twisted/flipped bonus is
 * rewarded only once per run. Subsequent occurrences keep the manoeuvre
 * itself but forfeit the extra bonus.
 */
export function validateRepeatedBonus(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    const unrewarded = unrewardedBonusesByTrick(run, manoeuvres);
    if (unrewarded.size === 0) return;
    const cells = run.tricks
      .map((t, trickIndex) => ({ id: t.id, trickIndex }))
      .filter((x) => unrewarded.has(x.id))
      .map((x) => ({ runIndex, trickIndex: x.trickIndex }));
    if (cells.length === 0) return;
    violations.push({
      ruleId: 'repeated-bonus',
      severity: 'warning',
      description: `Run ${runIndex + 1}: twisted/flipped bonus on a repetition-allowed manoeuvre may be used once per run - extra bonus not rewarded`,
      affectedCells: cells,
    });
  });
  return violations;
}
