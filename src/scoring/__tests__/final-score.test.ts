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
    // 9 * 0.5(Cq) + 1(sym) = 5.5, independent of bonusMalus
    expect(bd.cMark).toBeCloseTo(5.5, 5);
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
    // 9 * 0.5 + 0 = 4.5
    expect(bd.cMark).toBeCloseTo(4.5, 5);
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
    // sat + stall carry no bonus, so bonusPercent = 0; the malus alone
    // makes bonusFinal negative. The malus subtracts directly from
    // (Tq-scaled bonus%) inside (techFinal + choreoFinal) × … / 100.
    expect(bd.bonusPercent).toBe(0);
    expect(bd.bonusFinal).toBeLessThan(0);
  });

  it('scales bonusPercent by Tq but leaves the malus raw (asymmetric)', () => {
    // AWT § 6.6.1 weights each trick's bonus by its per-trick technical
    // mark before summing; the malus is then subtracted as a flat %.
    // We model per-trick technical marks with the global Tq slider, so:
    //   bonusFinal = (tech + choreo) × (bonus% × Tq/100 − malus%) / 100
    // Bug regression to guard against: applying `× Tq/100` to the whole
    // (bonus − malus) bracket (or to neither) gives different numbers.
    const rWithBonus = run(
      placedTrick('helicopter', { selectedBonuses: ['twisted'] }),
      placedTrick('stall'),
    );
    const tq = 80;
    const malus = 13;
    const bd = runScoreBreakdown(
      rWithBonus,
      MANOEUVRES_BY_ID,
      symmetry,
      malus,
      DEFAULT_DISTRIBUTION,
      { technical: tq, choreo: 100 },
    );
    expect(bd.bonusPercent).toBeGreaterThan(0);
    const expectedScaledBonus = bd.bonusPercent * (tq / 100);
    const expected =
      (bd.techFinal + bd.choreoFinal) *
      ((expectedScaledBonus - malus) / 100);
    // techFinal/choreoFinal in the breakdown are individually
    // ceil-rounded; bonusFinal is computed from raw values then
    // rounded - a few-thousandths slack is rounding noise, not a bug.
    expect(bd.bonusFinal).toBeCloseTo(expected, 2);
  });

  it('malus contribution to bonusFinal is independent of Tq', () => {
    // With bonusPercent = 0 the bonus side drops out, so the only
    // way Tq could touch bonusFinal is via (techFinal + choreoFinal).
    // We pin Tq while comparing two malus values: the Δ must equal
    // (techFinal + choreoFinal) × (malusΔ / 100), with no extra Tq
    // factor on the malus.
    const tq = 60;
    const a = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      10,
      DEFAULT_DISTRIBUTION,
      { technical: tq, choreo: 100 },
    );
    const b = runScoreBreakdown(
      r,
      MANOEUVRES_BY_ID,
      symmetry,
      30,
      DEFAULT_DISTRIBUTION,
      { technical: tq, choreo: 100 },
    );
    const expectedDelta =
      (a.techFinal + a.choreoFinal) * ((30 - 10) / 100);
    expect(a.bonusFinal - b.bonusFinal).toBeCloseTo(expectedDelta, 2);
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
