import { describe, it, expect } from 'vitest';
import { validateTumblingInfRhythmic } from '../tumbling-inf-rhythmic';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateTumblingInfRhythmic', () => {
  it('allows 2 tumbling-related manoeuvres', () => {
    const p = program([run(placedTrick('tumbling'), placedTrick('infinity_tumbling'))]);
    expect(validateTumblingInfRhythmic(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags 3 tumbling-related manoeuvres', () => {
    const p = program([
      run(placedTrick('tumbling'), placedTrick('rhythmic_sat'), placedTrick('macfly')),
    ]);
    const v = validateTumblingInfRhythmic(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].affectedCells).toHaveLength(3);
  });
});
