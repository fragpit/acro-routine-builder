import { describe, it, expect } from 'vitest';
import { validateMustBeFirst } from '../must-be-first';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateMustBeFirst', () => {
  it('flags Flat Stall to Infinity not at first position', () => {
    const p = program([
      run(placedTrick('sat'), placedTrick('flat_stall_to_infinity'), placedTrick('misty_flip')),
    ]);
    const v = validateMustBeFirst(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].affectedCells[0].trickIndex).toBe(1);
  });

  it('allows Flat Stall to Infinity at first position', () => {
    const p = program([run(placedTrick('flat_stall_to_infinity'), placedTrick('sat'))]);
    expect(validateMustBeFirst(p, MANOEUVRES_BY_ID)).toEqual([]);
  });
});
