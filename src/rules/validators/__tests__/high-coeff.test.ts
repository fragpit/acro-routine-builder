import { describe, it, expect } from 'vitest';
import { validateHighCoeff } from '../high-coeff';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateHighCoeff', () => {
  it('does not flag <= 2 high-coeff tricks', () => {
    const p = program([run(placedTrick('esfera'), placedTrick('rhythmic_sat'))]);
    expect(validateHighCoeff(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags > 2 high-coeff tricks', () => {
    const p = program([
      run(placedTrick('esfera'), placedTrick('rhythmic_sat'), placedTrick('mac_twist_to_tumbling')),
    ]);
    const v = validateHighCoeff(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('high-coeff');
    expect(v[0].affectedCells).toHaveLength(3);
  });

  it('ignores low-coeff tricks', () => {
    const p = program([run(placedTrick('sat'), placedTrick('wingovers'), placedTrick('tail_slide'))]);
    expect(validateHighCoeff(p, MANOEUVRES_BY_ID)).toEqual([]);
  });
});
