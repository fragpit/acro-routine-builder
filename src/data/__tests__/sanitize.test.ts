import { describe, it, expect } from 'vitest';
import { sanitizePlacedTrick, sanitizeProgram } from '../sanitize';
import type { PlacedTrick, Program } from '../../rules/types';

function trick(
  manoeuvreId: string,
  selectedBonuses: string[],
  id = 't1',
): PlacedTrick {
  return { id, manoeuvreId, side: 'L', selectedBonuses };
}

function makeProgram(tricks: PlacedTrick[]): Program {
  return {
    awtMode: false,
    runs: [{ id: 'r1', tricks }],
    repeatAfterRuns: 1,
    defaultBonuses: [],
  };
}

describe('sanitizePlacedTrick', () => {
  it('drops bonus ids not listed in availableBonuses', () => {
    const t = trick('twister', ['twisted']);
    const out = sanitizePlacedTrick(t);
    expect(out.selectedBonuses).toEqual([]);
    expect(out).not.toBe(t);
  });

  it('keeps recognised bonuses untouched', () => {
    const t = trick('sat', ['twisted']);
    const out = sanitizePlacedTrick(t);
    expect(out.selectedBonuses).toEqual(['twisted']);
    expect(out).toBe(t);
  });

  it('filters mix of valid and orphan bonuses', () => {
    const t = trick('sat', ['twisted', 'flip']);
    const out = sanitizePlacedTrick(t);
    expect(out.selectedBonuses).toEqual(['twisted']);
  });

  it('is a no-op for unknown manoeuvre ids', () => {
    const t = trick('does_not_exist', ['twisted']);
    expect(sanitizePlacedTrick(t)).toBe(t);
  });
});

describe('sanitizeProgram', () => {
  it('returns the same reference when nothing to strip', () => {
    const p = makeProgram([trick('sat', ['twisted'])]);
    expect(sanitizeProgram(p)).toBe(p);
  });

  it('strips orphan bonuses across all runs', () => {
    const p: Program = {
      awtMode: false,
      runs: [
        { id: 'r1', tricks: [trick('twister', ['twisted'], 'a')] },
        { id: 'r2', tricks: [trick('sat', ['twisted'], 'b')] },
      ],
      repeatAfterRuns: 2,
      defaultBonuses: [],
    };
    const out = sanitizeProgram(p);
    expect(out).not.toBe(p);
    expect(out.runs[0].tricks[0].selectedBonuses).toEqual([]);
    expect(out.runs[1].tricks[0].selectedBonuses).toEqual(['twisted']);
    expect(out.runs[1]).toBe(p.runs[1]);
  });
});
