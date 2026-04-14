import { describe, it, expect } from 'vitest';
import { validateOnePerRun } from '../one-per-run';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateOnePerRun', () => {
  it('flags two stall-to-infinite family in same run', () => {
    const p = program([
      run(placedTrick('super_stall_to_infinity'), placedTrick('macfly')),
    ]);
    const v = validateOnePerRun(p, MANOEUVRES_BY_ID);
    expect(v.some((x) => x.ruleId === 'one-per-run-stall-inf')).toBe(true);
  });

  it('allows a single stall-to-infinite', () => {
    const p = program([run(placedTrick('super_stall_to_infinity'), placedTrick('sat'))]);
    const v = validateOnePerRun(p, MANOEUVRES_BY_ID);
    expect(v.filter((x) => x.ruleId === 'one-per-run-stall-inf')).toEqual([]);
  });

  it('flags duplicate no-side manoeuvre', () => {
    const p = program([run(placedTrick('macfly'), placedTrick('sat'), placedTrick('macfly'))]);
    const v = validateOnePerRun(p, MANOEUVRES_BY_ID);
    expect(v.some((x) => x.ruleId === 'no-side-once')).toBe(true);
  });
});
