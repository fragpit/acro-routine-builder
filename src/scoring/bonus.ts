import type { Manoeuvre, Run } from '../rules/types';
import { unrewardedBonusesByTrick } from '../rules/repeated-bonus';
import { excludedFromScoring } from './eligibility';

/**
 * Raw sum of selected bonus percents across scoring-eligible tricks in a run.
 *
 * AWT bonus per 3.4.1 scales each trick's bonus by the judge's technical
 * score for that trick (bonus * T / 10). Without judge marks we return the
 * raw upper bound - what the pilot would earn at a perfect T of 10.
 * AWQ uses raw percents directly (no scaling), so this matches AWQ exactly.
 */
export function runBonus(run: Run, manoeuvres: Record<string, Manoeuvre>): number {
  const excluded = excludedFromScoring(run, manoeuvres);
  const unrewarded = unrewardedBonusesByTrick(run, manoeuvres);
  let total = 0;
  for (const t of run.tricks) {
    if (excluded.has(t.id)) continue;
    const m = manoeuvres[t.manoeuvreId];
    if (!m) continue;
    const skip = unrewarded.get(t.id);
    for (const bonusId of t.selectedBonuses) {
      if (skip?.has(bonusId)) continue;
      const def = m.availableBonuses.find((ab) => ab.id === bonusId);
      if (def) total += def.percent;
    }
  }
  return total;
}
