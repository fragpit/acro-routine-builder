import { describe, it, expect } from 'vitest';
import { validateOnePerRun } from '../one-per-run';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateOnePerRun', () => {
  it('warns on two stall-to-infinite family in same run', () => {
    const p = program([
      run(placedTrick('super_stall_to_infinity'), placedTrick('macfly')),
    ]);
    const v = validateOnePerRun(p, MANOEUVRES_BY_ID);
    const stallInf = v.find((x) => x.ruleId === 'one-per-run-stall-inf');
    expect(stallInf).toBeDefined();
    expect(stallInf?.severity).toBe('warning');
  });

  it('allows a single stall-to-infinite', () => {
    const p = program([run(placedTrick('super_stall_to_infinity'), placedTrick('sat'))]);
    const v = validateOnePerRun(p, MANOEUVRES_BY_ID);
    expect(v.filter((x) => x.ruleId === 'one-per-run-stall-inf')).toEqual([]);
  });

  it('warns on duplicate no-side manoeuvre', () => {
    const p = program([run(placedTrick('macfly'), placedTrick('sat'), placedTrick('macfly'))]);
    const v = validateOnePerRun(p, MANOEUVRES_BY_ID);
    const noSide = v.find((x) => x.ruleId === 'no-side-once');
    expect(noSide).toBeDefined();
    expect(noSide?.severity).toBe('warning');
  });
});
