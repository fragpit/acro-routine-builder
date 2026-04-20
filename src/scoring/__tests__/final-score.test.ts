import { describe, it, expect } from 'vitest';
import {
  runScoreBreakdown,
  DEFAULT_DISTRIBUTION,
  DEFAULT_QUALITY,
} from '../final-score';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { placedTrick, run } from '../../rules/validators/__tests__/helpers';

describe('runScoreBreakdown', () => {
  const r = run(placedTrick('sat'), placedTrick('stall'));
  const symmetry = { left: 1, right: 1, sided: 2, balanced: true };

  it('does not apply the repetition penalty to C (now a bonus malus)', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      50,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    // 9 * 0.6(Cq) + 1(sym) = 6.4, independent of choreoPenalty
    expect(bd.cMark).toBeCloseTo(6.4, 5);
  });

  it('keeps symmetry bonus when unbalanced = 0', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      { left: 2, right: 0, sided: 2, balanced: false },
      0,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    // 9 * 0.6 + 0 = 5.4
    expect(bd.cMark).toBeCloseTo(5.4, 5);
  });

  it('applies repetition penalty to the bonus as a malus', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      26,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    // bonusFinal = (tech + choreo) * (bonusPercent - 26)/100 * Tq.
    // sat + stall carry no bonus, so bonusPercent = 0; result is negative.
    expect(bd.bonusPercent).toBe(0);
    expect(bd.bonusFinal).toBeLessThan(0);
  });

  it('reduces total when malus exceeds bonus (negative bonusFinal)', () => {
    const withMalus = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      50,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    const withoutMalus = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      0,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    expect(withMalus.total).toBeLessThan(withoutMalus.total);
  });
});
