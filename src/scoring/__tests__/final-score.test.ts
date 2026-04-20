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

  it('applies repetition penalty proportionally up to 100%', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      50,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    // 9 * 0.5(rep) * 0.6(Cq) + 1(sym) = 3.7
    expect(bd.cMark).toBeCloseTo(3.7, 5);
    expect(bd.choreoFinal).toBeGreaterThan(0);
  });

  it('clamps subjective part to zero when penalty exceeds 100%', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      117,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    // subjective 9 is zeroed, symmetry bonus still contributes +1
    expect(bd.cMark).toBe(1);
    expect(bd.choreoFinal).toBeGreaterThan(0);
    expect(bd.bonusFinal).toBeGreaterThanOrEqual(0);
    expect(bd.total).toBeGreaterThan(0);
  });

  it('retains only symmetry bonus at exactly 100% penalty', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      100,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    expect(bd.cMark).toBe(1);
  });

  it('zeroes C when symmetry unbalanced and penalty reaches 100%', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      { left: 2, right: 0, sided: 2, balanced: false },
      100,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    expect(bd.cMark).toBe(0);
    expect(bd.choreoFinal).toBe(0);
  });
});
