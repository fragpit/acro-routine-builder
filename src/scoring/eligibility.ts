import type { BonusCategory, Manoeuvre, Run } from '../rules/types';

const BONUS_LIMITS: Record<BonusCategory, number> = {
  twisted: 5,
  reversed: 3,
  flipped: 2,
};
const HIGH_COEFF_LIMIT = 2;
const HIGH_COEFF_THRESHOLD = 1.95;

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
      const cat = m.availableBonuses.find((ab) => ab.id === b)?.countsAs;
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
