import type { BonusCategory, Manoeuvre } from './types';

/**
 * Look up the category (`twisted`, `reversed`, `flipped`) of a bonus on a given
 * manoeuvre. Returns undefined if the bonus is not on the manoeuvre or has no
 * category (e.g. a plain percent bonus).
 *
 * Used across validators and scoring to classify selected bonuses - the
 * per-call `availableBonuses.find(...)` lookup is the canonical shape.
 */
export function getBonusCategory(
  m: Manoeuvre,
  bonusId: string,
): BonusCategory | undefined {
  return m.availableBonuses.find((ab) => ab.id === bonusId)?.countsAs;
}
