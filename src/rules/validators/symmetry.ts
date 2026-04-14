import type { Manoeuvre, PlacedTrick, Program, Violation } from '../types';

export interface RunSymmetry {
  left: number;
  right: number;
  sided: number;
  balanced: boolean;
}

function isSided(t: PlacedTrick, m: Manoeuvre | undefined): boolean {
  return !!m && !m.noSide && (t.side === 'L' || t.side === 'R');
}

/**
 * Choreography criterion "Trick directions balance" (FAI 3.2, 1/8 of choreo):
 * a run should contain the same number of tricks in both directions. An odd
 * total is fine as long as the difference is exactly 1, so a single sided
 * trick also counts as balanced. Tricks without a side (`noSide`) are ignored
 * in the count, and a run made up entirely of them is considered balanced.
 */
export function runSymmetry(
  tricks: PlacedTrick[],
  manoeuvres: Record<string, Manoeuvre>,
): RunSymmetry {
  let left = 0;
  let right = 0;
  for (const t of tricks) {
    const m = manoeuvres[t.manoeuvreId];
    if (!isSided(t, m)) continue;
    if (t.side === 'L') left++;
    else if (t.side === 'R') right++;
  }
  const sided = left + right;
  const balanced = Math.abs(left - right) <= 1;
  return { left, right, sided, balanced };
}

export function validateSymmetry(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    if (run.tricks.length === 0) return;
    const sym = runSymmetry(run.tricks, manoeuvres);
    if (sym.balanced) return;
    const sidedCells = run.tricks
      .map((t, trickIndex) => ({ t, trickIndex }))
      .filter(({ t }) => isSided(t, manoeuvres[t.manoeuvreId]))
      .map(({ trickIndex }) => ({ runIndex, trickIndex }));
    const cells = sidedCells.length > 0
      ? sidedCells
      : run.tricks.map((_, trickIndex) => ({ runIndex, trickIndex }));
    violations.push({
      ruleId: 'symmetry',
      severity: 'warning',
      description: `Run ${runIndex + 1} directions unbalanced (L:${sym.left} / R:${sym.right})`,
      affectedCells: cells,
    });
  });
  return violations;
}
