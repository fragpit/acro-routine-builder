import { describe, it, expect } from 'vitest';
import { excludedFromScoring } from '../eligibility';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { placedTrick, run } from '../../rules/validators/__tests__/helpers';

describe('excludedFromScoring', () => {
  it('returns empty for run within limits', () => {
    const r = run(placedTrick('sat'), placedTrick('stall'));
    expect(excludedFromScoring(r, MANOEUVRES_BY_ID).size).toBe(0);
  });

  it('excludes extras beyond 2 high-coefficient manoeuvres (>= 1.95)', () => {
    const a = placedTrick('rhythmic_sat');
    const b = placedTrick('esfera');
    const c = placedTrick('mac_twist_to_tumbling');
    const r = run(a, b, c);
    const ex = excludedFromScoring(r, MANOEUVRES_BY_ID);
    expect(ex.has(c.id)).toBe(true);
    expect(ex.has(a.id)).toBe(false);
    expect(ex.has(b.id)).toBe(false);
  });

  it('excludes extras beyond 2 tumbling/infinity/rhythmic related manoeuvres', () => {
    const a = placedTrick('tumbling');
    const b = placedTrick('rhythmic_sat');
    const c = placedTrick('macfly');
    const r = run(a, b, c);
    const ex = excludedFromScoring(r, MANOEUVRES_BY_ID);
    expect(ex.has(c.id)).toBe(true);
    expect(ex.has(a.id)).toBe(false);
    expect(ex.has(b.id)).toBe(false);
  });

  it('excludes extras beyond one stall-to-infinite family manoeuvre', () => {
    const a = placedTrick('super_stall_to_infinity');
    const b = placedTrick('macfly');
    const c = placedTrick('satfly');
    const r = run(a, b, c);
    const ex = excludedFromScoring(r, MANOEUVRES_BY_ID);
    expect(ex.has(a.id)).toBe(false);
    expect(ex.has(b.id)).toBe(true);
    expect(ex.has(c.id)).toBe(true);
  });

  it('excludes a duplicated SatFly (no-side once-per-run via stall-to-infinite cap)', () => {
    const a = placedTrick('satfly');
    const b = placedTrick('satfly');
    const r = run(a, b);
    const ex = excludedFromScoring(r, MANOEUVRES_BY_ID);
    expect(ex.has(a.id)).toBe(false);
    expect(ex.has(b.id)).toBe(true);
  });

  it('excludes manoeuvre whose flipped bonus exceeds per-run limit of 2', () => {
    const tricks = [
      placedTrick('stall', { side: null, selectedBonuses: ['flip'] }),
      placedTrick('misty_to_helicopter', { selectedBonuses: ['flip'] }),
      placedTrick('tumbling', { selectedBonuses: ['flip'] }),
    ];
    const r = run(...tricks);
    const ex = excludedFromScoring(r, MANOEUVRES_BY_ID);
    expect(ex.has(tricks[2].id)).toBe(true);
    expect(ex.has(tricks[0].id)).toBe(false);
    expect(ex.has(tricks[1].id)).toBe(false);
  });
});
