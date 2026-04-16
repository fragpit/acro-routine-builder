import type { Manoeuvre, Run } from './types';
import { getBonusCategory } from './bonus-category';

/**
 * 4.3 second paragraph: for repetition-allowed manoeuvres (Tail Slide,
 * Wingovers, Stall, ...) the twisted/flipped bonus is rewarded only on the
 * first occurrence within a run. Returns the bonus ids per placed-trick id
 * that should be ignored by scoring and surfaced by the UI.
 */
export function unrewardedBonusesByTrick(
  run: Run,
  manoeuvres: Record<string, Manoeuvre>,
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  const seen = new Set<string>();
  for (const t of run.tricks) {
    const m = manoeuvres[t.manoeuvreId];
    if (!m || !m.repetitionAllowed) continue;
    const trickCategories = new Set<'twisted' | 'flipped'>();
    for (const bonusId of t.selectedBonuses) {
      const cat = getBonusCategory(m, bonusId);
      if (cat === 'twisted' || cat === 'flipped') trickCategories.add(cat);
    }
    for (const cat of trickCategories) {
      const key = `${m.id}:${cat}`;
      if (!seen.has(key)) {
        seen.add(key);
        continue;
      }
      for (const bonusId of t.selectedBonuses) {
        if (getBonusCategory(m, bonusId) !== cat) continue;
        const set = result.get(t.id) ?? new Set<string>();
        set.add(bonusId);
        result.set(t.id, set);
      }
    }
  }
  return result;
}
