import { describe, it, expect } from 'vitest';
import { validateAwtMistyToMisty } from '../awt-misty-to-misty';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateAwtMistyToMisty', () => {
  it('flags misty_to_misty when AWT mode is on', () => {
    const p = program([run(placedTrick('misty_to_misty'))], true);
    expect(validateAwtMistyToMisty(p, MANOEUVRES_BY_ID)).toHaveLength(1);
  });

  it('allows misty_to_misty when AWT mode is off', () => {
    const p = program([run(placedTrick('misty_to_misty'))], false);
    expect(validateAwtMistyToMisty(p, MANOEUVRES_BY_ID)).toEqual([]);
  });
});
