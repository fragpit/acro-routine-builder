import type { BonusCategory, Manoeuvre, Program, Violation } from '../types';

const LIMITS: Record<BonusCategory, number> = {
  twisted: 5,
  reversed: 3,
  flipped: 2,
};

/**
 * 3.5: Per-run bonus category limits. Max 5 twisted / 3 reversed / 2 flipped
 * manoeuvres per run. Extras are unscored.
 */
export function validateBonusLimits(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    const byCategory: Record<BonusCategory, { trickIndex: number }[]> = {
      twisted: [],
      reversed: [],
      flipped: [],
    };
    run.tricks.forEach((t, trickIndex) => {
      const m = manoeuvres[t.manoeuvreId];
      if (!m) return;
      const categories = new Set<BonusCategory>();
      for (const bonusId of t.selectedBonuses) {
        const def = m.availableBonuses.find((ab) => ab.id === bonusId);
        if (def?.countsAs) categories.add(def.countsAs);
      }
      for (const c of categories) byCategory[c].push({ trickIndex });
    });
    (Object.keys(LIMITS) as BonusCategory[]).forEach((cat) => {
      const cells = byCategory[cat];
      if (cells.length > LIMITS[cat]) {
        violations.push({
          ruleId: `bonus-limits-${cat}`,
          severity: 'error',
          description: `Run ${runIndex + 1}: more than ${LIMITS[cat]} ${cat} manoeuvres (${cells.length})`,
          affectedCells: cells.map((c) => ({ runIndex, trickIndex: c.trickIndex })),
        });
      }
    });
  });
  return violations;
}
