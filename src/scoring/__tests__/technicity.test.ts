import { describe, it, expect } from 'vitest';
import { runTechnicity } from '../technicity';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { placedTrick, run } from '../../rules/validators/__tests__/helpers';

describe('technicity', () => {
  it('returns 0 for empty run', () => {
    expect(runTechnicity(run(), MANOEUVRES_BY_ID)).toBe(0);
  });

  it('averages coefficients of tricks', () => {
    const r = run(placedTrick('sat'), placedTrick('stall'));
    const t = runTechnicity(r, MANOEUVRES_BY_ID);
    expect(t).toBeCloseTo((1.25 + 1.6) / 2, 5);
  });

  it('averages only the 3 highest coefficients', () => {
    const r = run(
      placedTrick('sat'),
      placedTrick('stall'),
      placedTrick('wingovers'),
      placedTrick('looping'),
    );
    const t = runTechnicity(r, MANOEUVRES_BY_ID);
    expect(t).toBeCloseTo((1.6 + 1.5 + 1.35) / 3, 5);
  });

  it('excludes high-coefficient extras beyond the 2-per-run cap', () => {
    const r = run(
      placedTrick('rhythmic_sat'),
      placedTrick('esfera'),
      placedTrick('mac_twist_to_tumbling'),
    );
    const t = runTechnicity(r, MANOEUVRES_BY_ID);
    expect(t).toBeCloseTo((1.95 + 1.95) / 2, 5);
  });
});
