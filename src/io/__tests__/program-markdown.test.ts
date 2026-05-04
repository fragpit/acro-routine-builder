import { describe, expect, it } from 'vitest';
import { exportProgramMarkdown } from '../program-markdown';
import type { Program } from '../../rules/types';

const baseProgram = (): Program => ({
  awtMode: false,
  runs: [
    {
      id: 'r1',
      tricks: [
        { id: 't1', manoeuvreId: 'sat', side: 'R', selectedBonuses: ['twisted'] },
        { id: 't2', manoeuvreId: 'looping', side: 'L', selectedBonuses: [] },
        { id: 't3', manoeuvreId: 'tumbling', side: null, selectedBonuses: [] },
      ],
    },
  ],
  repeatAfterRuns: 1,
  defaultBonuses: [],
});

describe('exportProgramMarkdown', () => {
  it('emits a numbered flat list, not a GFM table', () => {
    const out = exportProgramMarkdown(baseProgram(), 'fixture', []);
    expect(out).not.toMatch(/\|.*Manoeuvre.*\|/);
    expect(out).not.toMatch(/^\|---/m);
    expect(out).toMatch(/^1\. /m);
  });

  it('omits side when null and bonuses when empty', () => {
    const out = exportProgramMarkdown(baseProgram(), 'fixture', []);
    expect(out).toMatch(/^1\. SAT \(1\.\d{2}, R\) - Twisted$/m);
    expect(out).toMatch(/^2\. Looping \(Inversion\) \(1\.\d{2}, L\)$/m);
    expect(out).toMatch(/^3\. Tumbling \(1\.\d{2}\)$/m);
  });

  it('appends ignored reason at the end of a trick line when present', () => {
    const program: Program = {
      awtMode: false,
      runs: [
        {
          id: 'r1',
          tricks: Array.from({ length: 6 }, (_, i) => ({
            id: `t${i}`,
            manoeuvreId: 'sat',
            side: 'R',
            selectedBonuses: ['twisted'],
          })),
        },
      ],
      repeatAfterRuns: 1,
      defaultBonuses: [],
    };
    const out = exportProgramMarkdown(program, 'fixture', []);
    expect(out).toMatch(/ignored: more than 5 twisted manoeuvres/);
  });
});
