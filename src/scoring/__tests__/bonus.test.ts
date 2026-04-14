import { describe, it, expect } from 'vitest';
import { runBonus } from '../bonus';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { placedTrick, run } from '../../rules/validators/__tests__/helpers';

describe('runBonus', () => {
  it('returns 0 when no bonuses selected', () => {
    expect(runBonus(run(placedTrick('sat')), MANOEUVRES_BY_ID)).toBe(0);
  });

  it('sums selected bonus percents across tricks', () => {
    const r = run(
      placedTrick('wingovers', { selectedBonuses: ['twisted'] }),
      placedTrick('stall', { side: null, selectedBonuses: ['twisted_exit', 'devil_twist'] }),
    );
    expect(runBonus(r, MANOEUVRES_BY_ID)).toBeCloseTo(3.5 + 4.5 + 7, 5);
  });

  it('skips repeated twisted/flipped bonus on repetition-allowed manoeuvres', () => {
    const r = run(
      placedTrick('stall', { side: null, selectedBonuses: ['twisted'] }),
      placedTrick('stall', { side: null, selectedBonuses: ['twisted', 'flip'] }),
    );
    expect(runBonus(r, MANOEUVRES_BY_ID)).toBeCloseTo(2.5 + 4.5, 5);
  });

  it('excludes bonuses of scoring-ineligible tricks', () => {
    const excluded = placedTrick('tumbling', { selectedBonuses: ['flip'] });
    const r = run(
      placedTrick('stall', { side: null, selectedBonuses: ['flip'] }),
      placedTrick('misty_to_helicopter', { selectedBonuses: ['flip'] }),
      excluded,
    );
    expect(runBonus(r, MANOEUVRES_BY_ID)).toBeCloseTo(4.5 + 3, 5);
  });
});
