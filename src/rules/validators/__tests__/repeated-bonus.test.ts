import { describe, it, expect } from 'vitest';
import { validateRepeatedBonus } from '../repeated-bonus';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateRepeatedBonus', () => {
  it('passes when twisted appears once on a repetition-allowed manoeuvre', () => {
    const p = program([
      run(
        placedTrick('stall', { selectedBonuses: ['twisted'] }),
        placedTrick('stall', { selectedBonuses: [] }),
      ),
    ]);
    expect(validateRepeatedBonus(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags second twisted on the same repetition-allowed manoeuvre in a run', () => {
    const p = program([
      run(
        placedTrick('stall', { selectedBonuses: ['twisted'] }),
        placedTrick('stall', { selectedBonuses: ['twisted'] }),
      ),
    ]);
    const v = validateRepeatedBonus(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('repeated-bonus');
    expect(v[0].affectedCells).toEqual([{ runIndex: 0, trickIndex: 1 }]);
  });

  it('treats twisted and flipped independently', () => {
    const p = program([
      run(
        placedTrick('stall', { selectedBonuses: ['twisted'] }),
        placedTrick('stall', { selectedBonuses: ['flip'] }),
      ),
    ]);
    expect(validateRepeatedBonus(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('does not flag manoeuvres without repetitionAllowed', () => {
    const p = program([
      run(
        placedTrick('sat', { selectedBonuses: ['twisted'] }),
        placedTrick('sat', { selectedBonuses: ['twisted'] }),
      ),
    ]);
    expect(validateRepeatedBonus(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('resets between runs', () => {
    const p = program([
      run(placedTrick('stall', { selectedBonuses: ['twisted'] })),
      run(placedTrick('stall', { selectedBonuses: ['twisted'] })),
    ]);
    expect(validateRepeatedBonus(p, MANOEUVRES_BY_ID)).toEqual([]);
  });
});
