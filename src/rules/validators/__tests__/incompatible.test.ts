import { describe, it, expect } from 'vitest';
import { validateIncompatible } from '../incompatible';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateIncompatible', () => {
  it('flags x_chopper_to_tumbling with stall-to-infinite', () => {
    const p = program([
      run(placedTrick('super_stall_to_infinity'), placedTrick('sat'), placedTrick('x_chopper_to_tumbling')),
    ]);
    const v = validateIncompatible(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
  });

  it('flags misty_to_tumbling with stall-to-infinite', () => {
    const p = program([run(placedTrick('misty_to_tumbling'), placedTrick('macfly'))]);
    const v = validateIncompatible(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
  });

  it('allows stall-to-infinite alone', () => {
    const p = program([run(placedTrick('super_stall_to_infinity'), placedTrick('sat'))]);
    expect(validateIncompatible(p, MANOEUVRES_BY_ID)).toEqual([]);
  });
});
