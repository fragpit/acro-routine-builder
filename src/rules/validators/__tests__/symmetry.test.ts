import { describe, it, expect } from 'vitest';
import { runSymmetry, validateSymmetry } from '../symmetry';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run } from './helpers';
import type { Program } from '../../types';

function prog(runs: ReturnType<typeof run>[]): Program {
  return { awtMode: false, runs, repeatAfterRuns: runs.length, defaultBonuses: [] };
}

describe('runSymmetry', () => {
  it('counts sided tricks and ignores noSide ones', () => {
    const r = run(
      placedTrick('sat', { side: 'L' }),
      placedTrick('sat', { side: 'R' }),
      placedTrick('tail_slide', { side: null }),
    );
    const s = runSymmetry(r.tricks, MANOEUVRES_BY_ID);
    expect(s.left).toBe(1);
    expect(s.right).toBe(1);
    expect(s.balanced).toBe(true);
  });

  it('treats difference of 1 as balanced', () => {
    const r = run(
      placedTrick('sat', { side: 'L' }),
      placedTrick('sat', { side: 'L' }),
      placedTrick('sat', { side: 'R' }),
    );
    expect(runSymmetry(r.tricks, MANOEUVRES_BY_ID).balanced).toBe(true);
  });

  it('treats a single sided trick as balanced', () => {
    const r = run(placedTrick('sat', { side: 'L' }));
    expect(runSymmetry(r.tricks, MANOEUVRES_BY_ID).balanced).toBe(true);
  });

  it('flags difference of 2 as unbalanced', () => {
    const r = run(
      placedTrick('sat', { side: 'L' }),
      placedTrick('sat', { side: 'L' }),
      placedTrick('sat', { side: 'L' }),
      placedTrick('sat', { side: 'R' }),
    );
    expect(runSymmetry(r.tricks, MANOEUVRES_BY_ID).balanced).toBe(false);
  });
});

describe('validateSymmetry', () => {
  it('returns no violation for balanced run', () => {
    const p = prog([run(placedTrick('sat', { side: 'L' }), placedTrick('sat', { side: 'R' }))]);
    expect(validateSymmetry(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('warns per-run when unbalanced', () => {
    const p = prog([
      run(
        placedTrick('sat', { side: 'L' }),
        placedTrick('sat', { side: 'L' }),
        placedTrick('sat', { side: 'L' }),
      ),
      run(placedTrick('sat', { side: 'L' }), placedTrick('sat', { side: 'R' })),
    ]);
    const v = validateSymmetry(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('warning');
    expect(v[0].affectedCells.every((c) => c.runIndex === 0)).toBe(true);
  });

  it('ignores empty runs', () => {
    const p = prog([run()]);
    expect(validateSymmetry(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('does not warn for noSide-only runs with tricks', () => {
    const p = prog([run(placedTrick('tail_slide', { side: null }))]);
    expect(validateSymmetry(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('does not warn for a single sided trick', () => {
    const p = prog([run(placedTrick('sat', { side: 'L' }))]);
    expect(validateSymmetry(p, MANOEUVRES_BY_ID)).toEqual([]);
  });
});
