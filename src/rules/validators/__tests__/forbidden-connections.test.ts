import { describe, it, expect } from 'vitest';
import { validateForbiddenConnections } from '../forbidden-connections';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateForbiddenConnections', () => {
  it('flags Helicopter → trick that starts with Helicopter', () => {
    const p = program([run(placedTrick('helicopter'), placedTrick('twister'))]);
    const v = validateForbiddenConnections(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].affectedCells).toEqual([
      { runIndex: 0, trickIndex: 0 },
      { runIndex: 0, trickIndex: 1 },
    ]);
  });

  it('does not flag Helicopter → combo that ends with Helicopter', () => {
    const p = program([run(placedTrick('helicopter'), placedTrick('cowboy'))]);
    expect(validateForbiddenConnections(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('still flags combo ending with Helicopter → Helicopter', () => {
    const p = program([run(placedTrick('cowboy'), placedTrick('helicopter'))]);
    expect(validateForbiddenConnections(p, MANOEUVRES_BY_ID)).toHaveLength(1);
  });

  it('flags Tumbling → Infinity Tumbling', () => {
    const p = program([run(placedTrick('tumbling'), placedTrick('infinity_tumbling'))]);
    const v = validateForbiddenConnections(p, MANOEUVRES_BY_ID);
    expect(v.length).toBeGreaterThanOrEqual(1);
  });

  it('does not flag valid connection', () => {
    const p = program([run(placedTrick('wingovers'), placedTrick('misty_flip'))]);
    expect(validateForbiddenConnections(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags Misty to SAT → SAT', () => {
    const p = program([run(placedTrick('misty_to_sat'), placedTrick('sat'))]);
    expect(validateForbiddenConnections(p, MANOEUVRES_BY_ID)).toHaveLength(1);
  });
});
