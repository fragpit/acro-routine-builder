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
    // cBase = 10, factor = 0.5, Cq = 0.6 -> cMark = 3
    expect(bd.cMark).toBeCloseTo(3, 5);
    expect(bd.choreoFinal).toBeGreaterThan(0);
  });

  it('clamps choreo to zero when penalty exceeds 100%', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      117,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    expect(bd.cMark).toBe(0);
    expect(bd.choreoFinal).toBe(0);
    // bonus is (tech + choreo) * bonus%, so a zero choreo must not
    // produce a negative contribution even at 100% bonus
    expect(bd.bonusFinal).toBeGreaterThanOrEqual(0);
    expect(bd.total).toBeGreaterThan(0);
  });

  it('treats exactly 100% penalty as zero choreo', () => {
    const bd = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      100,
      DEFAULT_DISTRIBUTION,
      DEFAULT_QUALITY,
    );
    expect(bd.cMark).toBe(0);
    expect(bd.choreoFinal).toBe(0);
  });
});
