import { describe, it, expect } from 'vitest';
import { validateBonusLimits } from '../bonus-limits';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

describe('validateBonusLimits', () => {
  it('allows up to 5 twisted per run', () => {
    const tricks = Array.from({ length: 5 }, (_, i) =>
      placedTrick('stall', { id: `s${i}`, selectedBonuses: ['twisted'] }),
    );
    const p = program([run(...tricks)]);
    expect(validateBonusLimits(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags 6th twisted manoeuvre', () => {
    const tricks = Array.from({ length: 6 }, (_, i) =>
      placedTrick('stall', { id: `s${i}`, selectedBonuses: ['twisted'] }),
    );
    const p = program([run(...tricks)]);
    const v = validateBonusLimits(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('bonus-limits-twisted');
    expect(v[0].affectedCells).toHaveLength(6);
  });

  it('flags >3 reversed', () => {
    const tricks = Array.from({ length: 4 }, (_, i) =>
      placedTrick('cowboy', { id: `c${i}`, selectedBonuses: ['reverse'] }),
    );
    const p = program([run(...tricks)]);
    const v = validateBonusLimits(p, MANOEUVRES_BY_ID);
    expect(v.some((x) => x.ruleId === 'bonus-limits-reversed')).toBe(true);
  });

  it('flags >2 flipped', () => {
    const tricks = Array.from({ length: 3 }, (_, i) =>
      placedTrick('misty_to_helicopter', { id: `m${i}`, selectedBonuses: ['flip'] }),
    );
    const p = program([run(...tricks)]);
    const v = validateBonusLimits(p, MANOEUVRES_BY_ID);
    expect(v.some((x) => x.ruleId === 'bonus-limits-flipped')).toBe(true);
  });

  it('counts each category once per trick even with multiple twisted bonuses', () => {
    const tricks = Array.from({ length: 5 }, (_, i) =>
      placedTrick('stall', { id: `s${i}`, selectedBonuses: ['twisted', 'twisted_exit'] }),
    );
    const p = program([run(...tricks)]);
    expect(validateBonusLimits(p, MANOEUVRES_BY_ID)).toEqual([]);
  });
});
