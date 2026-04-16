import { describe, it, expect } from 'vitest';
import { validateRepetition } from '../repetition';
import { MANOEUVRES_BY_ID } from '../../../data/manoeuvres';
import { placedTrick, run, program } from './helpers';

function prog(runs: ReturnType<typeof run>[], repeatAfterRuns = 5) {
  return program(runs, false, repeatAfterRuns);
}

describe('validateRepetition', () => {
  it('flags same manoeuvre + same side in different runs with default gap', () => {
    const p = prog([
      run(placedTrick('sat', { side: 'L' })),
      run(placedTrick('sat', { side: 'L' })),
    ]);
    const v = validateRepetition(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].affectedCells).toHaveLength(2);
    expect(v[0].severity).toBe('warning');
    expect(v[0].choreoPenaltyByRun).toEqual({ 1: 13 });
  });

  it('attributes 13% to each run containing a repeated (non-first) occurrence', () => {
    const p = prog([
      run(placedTrick('sat', { side: 'L' })),
      run(placedTrick('sat', { side: 'L' })),
      run(placedTrick('sat', { side: 'L' })),
    ]);
    const v = validateRepetition(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].choreoPenaltyByRun).toEqual({ 1: 13, 2: 13 });
  });

  it('treats opposite sides as different manoeuvres', () => {
    const p = prog([
      run(placedTrick('sat', { side: 'L' })),
      run(placedTrick('sat', { side: 'R' })),
    ]);
    expect(validateRepetition(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('treats reverse as different manoeuvre', () => {
    const p = prog([
      run(placedTrick('cowboy', { side: 'L' })),
      run(placedTrick('cowboy', { side: 'L', selectedBonuses: ['reverse'] })),
    ]);
    expect(validateRepetition(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('treats twisted as same manoeuvre (still flags)', () => {
    const p = prog([
      run(placedTrick('sat', { side: 'L' })),
      run(placedTrick('sat', { side: 'L', selectedBonuses: ['twisted'] })),
    ]);
    const v = validateRepetition(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
  });

  it('allows exception manoeuvres (Tail Slide) to repeat', () => {
    const p = prog([
      run(placedTrick('tail_slide')),
      run(placedTrick('tail_slide')),
    ]);
    expect(validateRepetition(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags only within the same reset block (gap=2 => [0,1][2,3][4])', () => {
    const p = prog(
      [
        run(placedTrick('sat', { side: 'L' })),
        run(placedTrick('sat', { side: 'L' })),
        run(placedTrick('sat', { side: 'L' })),
        run(placedTrick('sat', { side: 'L' })),
        run(placedTrick('sat', { side: 'L' })),
      ],
      2,
    );
    const v = validateRepetition(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
    expect(v[0].choreoPenaltyByRun).toEqual({ 1: 13, 3: 13 });
  });

  it('respects repeatAfterRuns gap', () => {
    const p = prog(
      [
        run(placedTrick('sat', { side: 'L' })),
        run(),
        run(placedTrick('sat', { side: 'L' })),
      ],
      2,
    );
    expect(validateRepetition(p, MANOEUVRES_BY_ID)).toEqual([]);
  });

  it('flags no-side trick repeated regardless of side field', () => {
    const p = prog([
      run(placedTrick('macfly', { side: null })),
      run(placedTrick('macfly', { side: null })),
    ]);
    const v = validateRepetition(p, MANOEUVRES_BY_ID);
    expect(v).toHaveLength(1);
  });
});
