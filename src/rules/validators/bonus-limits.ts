import type { BonusCategory, Manoeuvre, Program, Violation } from '../types';
import { getBonusCategory } from '../bonus-category';
import { BONUS_LIMITS } from '../../data/competition-types';

/**
 * 3.5: Per-run bonus category limits. Max 5 twisted / 3 reversed / 2 flipped
 * manoeuvres per run. Extras are unscored (warning, not error).
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
        const cat = getBonusCategory(m, bonusId);
        if (cat) categories.add(cat);
      }
      for (const c of categories) byCategory[c].push({ trickIndex });
    });
    (Object.keys(BONUS_LIMITS) as BonusCategory[]).forEach((cat) => {
      const cells = byCategory[cat];
      if (cells.length > BONUS_LIMITS[cat]) {
        violations.push({
          ruleId: `bonus-limits-${cat}`,
          severity: 'warning',
          description: `Run ${runIndex + 1}: more than ${BONUS_LIMITS[cat]} ${cat} manoeuvres (${cells.length})`,
          affectedCells: cells.map((c) => ({ runIndex, trickIndex: c.trickIndex })),
        });
      }
    });
  });
  return violations;
}
