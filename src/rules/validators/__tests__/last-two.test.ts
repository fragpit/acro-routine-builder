import { describe, it, expect } from 'vitest';
import { validateLastTwo } from '../last-two';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateLastTwo', () => {
  it('flags Tumbling at last position', () => {
    const p = program([run(placedTrick('sat'), placedTrick('misty_flip'), placedTrick('tumbling'))]);
    const v = validateLastTwo(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].affectedCells[0].trickIndex).toBe(2);
  });

  it('flags Tumbling at second-to-last', () => {
    const p = program([run(placedTrick('sat'), placedTrick('tumbling'), placedTrick('misty_flip'))]);
    const v = validateLastTwo(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].affectedCells[0].trickIndex).toBe(1);
  });

  it('allows Tumbling earlier in the run', () => {
    const p = program([
      run(placedTrick('tumbling'), placedTrick('sat'), placedTrick('misty_flip'), placedTrick('wingovers')),
    ]);
    expect(validateLastTwo(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags flipped trick in last two', () => {
    const p = program([
      run(
        placedTrick('sat'),
        placedTrick('wingovers'),
        placedTrick('stall', { selectedBonuses: ['flip'] }),
      ),
    ]);
    const v = validateLastTwo(p, MANOEUVRES_BY_ID);
    expect(v.some((x) => x.description.includes('flipped'))).toBe(true);
  });
});
