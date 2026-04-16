import type { BonusCategory, Manoeuvre, Run } from '../rules/types';
import { getBonusCategory } from '../rules/bonus-category';
import {
  BONUS_LIMITS,
  HIGH_COEFF_LIMIT,
  HIGH_COEFF_THRESHOLD,
} from '../data/competition-types';

/**
 * Returns the set of placed-trick ids that will not be scored in the given run
 * per FAI 3.1 (max 2 manoeuvres with coefficient >= 1.95) and 3.5 (bonus
 * category limits). Extras in program order are dropped - their coefficients
 * are excluded from technicity and their bonuses from the bonus total.
 */
export function excludedFromScoring(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
): Set<string> {
  return new Set(exclusionsByTrick(run, manoeuvres).keys());
}

/**
 * Same as excludedFromScoring but returns a per-trick reason string for UI
 * display (e.g. "more than 5 twisted manoeuvres").
 */
export function exclusionsByTrick(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
): Map<string, string[]> {
  const reasons = new Map<string, string[]>();
  let highCoeffCount = 0;
  const bonusCount: Record<BonusCategory, number> = { twisted: 0, reversed: 0, flipped: 0 };
  for (const t of run.tricks) {
    const m = manoeuvres[t.manoeuvreId];
    if (!m) continue;
    const isHigh = m.coefficient >= HIGH_COEFF_THRESHOLD;
    const cats = new Set<BonusCategory>();
    for (const b of t.selectedBonuses) {
      const cat = getBonusCategory(m, b);
      if (cat) cats.add(cat);
    }
    const trickReasons: string[] = [];
    if (isHigh && highCoeffCount >= HIGH_COEFF_LIMIT) {
      trickReasons.push(`more than ${HIGH_COEFF_LIMIT} manoeuvres with coefficient \u2265 ${HIGH_COEFF_THRESHOLD}`);
    }
    for (const cat of cats) {
      if (bonusCount[cat] >= BONUS_LIMITS[cat]) {
        trickReasons.push(`more than ${BONUS_LIMITS[cat]} ${cat} manoeuvres`);
      }
    }
    if (trickReasons.length > 0) {
      reasons.set(t.id, trickReasons);
      continue;
    }
    if (isHigh) highCoeffCount++;
    for (const cat of cats) bonusCount[cat]++;
  }
  return reasons;
}
