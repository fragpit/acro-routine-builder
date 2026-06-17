import type { BonusCategory, Manoeuvre, Run } from '../rules/types';
import { getBonusCategory } from '../rules/bonus-category';
import {
  BONUS_LIMITS,
  HIGH_COEFF_LIMIT,
  HIGH_COEFF_THRESHOLD,
  STALL_TO_INFINITE_LIMIT,
  TUMBLING_RELATED_LIMIT,
} from '../data/competition-types';

interface ScoringExclusion {
  reason: string;
  excludesTechnicalMark: boolean;
}

/**
 * Returns the set of placed-trick ids that will not be scored in the given run
 * per FAI 3.1 (max 2 manoeuvres with coefficient >= 1.95), 3.2 (only one
 * stall-to-infinite family manoeuvre - covers no-side once-per-run too,
 * since MacFly/MistyFly/HeliFly/SatFly are all in that family), 3.3 (max 2
 * tumbling/infinity/rhythmic related manoeuvres) and 3.5 (bonus category
 * limits). Extras in program order are dropped - their coefficients are
 * excluded from technicity and their bonuses from the bonus total.
 */
export function excludedFromScoring(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
): Set<string> {
  return new Set(exclusionsByTrick(run, manoeuvres).keys());
}

/**
 * Returns the set of placed-trick ids excluded from averaged judge technical
 * marks. Bonus-limit extras lose coefficient and bonus credit, but still
 * receive a technical mark.
 */
export function excludedFromTechnicalMarks(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
): Set<string> {
  return new Set(
    [...exclusionDetailsByTrick(run, manoeuvres)]
      .filter(([, details]) =>
        details.some((detail) => detail.excludesTechnicalMark),
      )
      .map(([trickId]) => trickId),
  );
}

/**
 * Same as excludedFromScoring but returns a per-trick reason string for UI
 * display (e.g. "more than 5 twisted manoeuvres").
 */
export function exclusionsByTrick(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
): Map<string, string[]> {
  return new Map(
    [...exclusionDetailsByTrick(run, manoeuvres)].map(([trickId, details]) => [
      trickId,
      details.map((detail) => detail.reason),
    ]),
  );
}

function exclusionDetailsByTrick(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
): Map<string, ScoringExclusion[]> {
  const reasons = new Map<string, ScoringExclusion[]>();
  let highCoeffCount = 0;
  let tumblingRelatedCount = 0;
  let stallToInfCount = 0;
  const bonusCount: Record<BonusCategory, number> = {
    twisted: 0,
    reversed: 0,
    flipped: 0,
  };
  for (const t of run.tricks) {
    const m = manoeuvres[t.manoeuvreId];
    if (!m) continue;
    const isHigh = m.coefficient >= HIGH_COEFF_THRESHOLD;
    const isTumblingRelated = m.groups.includes('tumbling_related');
    const isStallToInf = m.groups.includes('stall_to_infinite');
    const cats = new Set<BonusCategory>();
    for (const b of t.selectedBonuses) {
      const cat = getBonusCategory(m, b);
      if (cat) cats.add(cat);
    }
    const trickReasons: ScoringExclusion[] = [];
    if (isHigh && highCoeffCount >= HIGH_COEFF_LIMIT) {
      trickReasons.push({
        reason: `more than ${HIGH_COEFF_LIMIT} manoeuvres with coefficient \u2265 ${HIGH_COEFF_THRESHOLD}`,
        excludesTechnicalMark: true,
      });
    }
    if (isTumblingRelated && tumblingRelatedCount >= TUMBLING_RELATED_LIMIT) {
      trickReasons.push({
        reason: `more than ${TUMBLING_RELATED_LIMIT} tumbling/infinity/rhythmic related manoeuvres`,
        excludesTechnicalMark: true,
      });
    }
    if (isStallToInf && stallToInfCount >= STALL_TO_INFINITE_LIMIT) {
      trickReasons.push({
        reason: 'more than one stall-to-infinite family manoeuvre',
        excludesTechnicalMark: true,
      });
    }
    for (const cat of cats) {
      if (bonusCount[cat] >= BONUS_LIMITS[cat]) {
        trickReasons.push({
          reason: `more than ${BONUS_LIMITS[cat]} ${cat} manoeuvres`,
          excludesTechnicalMark: false,
        });
      }
    }
    if (trickReasons.length > 0) {
      reasons.set(t.id, trickReasons);
      continue;
    }
    if (isHigh) highCoeffCount++;
    if (isTumblingRelated) tumblingRelatedCount++;
    if (isStallToInf) stallToInfCount++;
    for (const cat of cats) bonusCount[cat]++;
  }
  return reasons;
}
