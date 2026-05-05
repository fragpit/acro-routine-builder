import { describe, expect, it } from 'vitest';
import { exportProgramJson, importProgramJson } from '../program-json';
import type { Program } from '../../rules/types';
import { MAX_RUNS } from '../../data/competition-types';

function wrap(program: unknown, overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: 'acro-routine-builder',
    version: 1,
    name: null,
    exportedAt: '2025-01-01T00:00:00.000Z',
    program,
    ...overrides,
  });
}

const baseProgram: Program = {
  awtMode: false,
  runs: [
    {
      id: 'r1',
      tricks: [
        { id: 't1', manoeuvreId: 'sat', side: 'R', selectedBonuses: ['twisted'] },
      ],
    },
  ],
  repeatAfterRuns: 1,
  defaultBonuses: [],
  notes: '',
};

describe('importProgramJson', () => {
  it('strips orphan bonus ids not present in availableBonuses', () => {
    const program: Program = {
      awtMode: false,
      runs: [
        {
          id: 'r1',
          tricks: [
            { id: 't1', manoeuvreId: 'twister', side: 'L', selectedBonuses: ['twisted'] },
            { id: 't2', manoeuvreId: 'sat', side: 'R', selectedBonuses: ['twisted'] },
          ],
        },
      ],
      repeatAfterRuns: 1,
      defaultBonuses: [],
      notes: '',
    };
    const json = exportProgramJson(program, 'fixture');
    const { program: imported } = importProgramJson(json);
    expect(imported.runs[0].tricks[0].selectedBonuses).toEqual([]);
    expect(imported.runs[0].tricks[1].selectedBonuses).toEqual(['twisted']);
  });

  it('accepts fixtures that roundtrip without changes', () => {
    const { program: imported } = importProgramJson(exportProgramJson(baseProgram, null));
    expect(imported).toEqual(baseProgram);
  });

  it('drops unknown ids from defaultBonuses without throwing', () => {
    const json = wrap({ ...baseProgram, defaultBonuses: ['twisted', 'not-a-real-bonus'] });
    const { program: imported } = importProgramJson(json);
    expect(imported.defaultBonuses).toEqual(['twisted']);
  });

  it('round-trips program notes including newlines', () => {
    const program: Program = {
      ...baseProgram,
      notes: 'Run 1: malus on trick #4\nRun 2: ignored trick #6',
    };
    const { program: imported } = importProgramJson(exportProgramJson(program, null));
    expect(imported.notes).toBe('Run 1: malus on trick #4\nRun 2: ignored trick #6');
  });

  it('defaults notes to "" when the field is absent in legacy files', () => {
    const { notes: _omit, ...legacyProgram } = baseProgram;
    void _omit;
    const json = wrap(legacyProgram);
    const { program: imported } = importProgramJson(json);
    expect(imported.notes).toBe('');
  });

  describe('envelope errors', () => {
    it('rejects non-JSON input', () => {
      expect(() => importProgramJson('not json')).toThrow(/Not a valid JSON file/);
    });

    it('rejects null payload', () => {
      expect(() => importProgramJson('null')).toThrow(/Empty or invalid file/);
    });

    it('rejects array payload', () => {
      expect(() => importProgramJson('[]')).toThrow(/Unknown format/);
    });

    it('rejects unknown format marker', () => {
      const json = JSON.stringify({ format: 'something-else', version: 1, program: baseProgram });
      expect(() => importProgramJson(json)).toThrow(/Unknown format/);
    });

    it('rejects missing format marker', () => {
      const json = JSON.stringify({ version: 1, program: baseProgram });
      expect(() => importProgramJson(json)).toThrow(/Unknown format/);
    });

    it('rejects future version', () => {
      expect(() => importProgramJson(wrap(baseProgram, { version: 99 }))).toThrow(
        /Unsupported version/,
      );
    });

    it('rejects non-numeric version', () => {
      expect(() => importProgramJson(wrap(baseProgram, { version: 'one' }))).toThrow(
        /Unsupported version/,
      );
    });

    it('accepts the legacy acro-program-constructor format marker', () => {
      const json = wrap(baseProgram, { format: 'acro-program-constructor' });
      const { program: imported } = importProgramJson(json);
      expect(imported).toEqual(baseProgram);
    });
  });

  describe('program field errors', () => {
    it('rejects missing program', () => {
      const json = JSON.stringify({ format: 'acro-routine-builder', version: 1 });
      expect(() => importProgramJson(json)).toThrow(/Missing program/);
    });

    it('rejects non-boolean awtMode', () => {
      expect(() => importProgramJson(wrap({ ...baseProgram, awtMode: 'true' }))).toThrow(
        /awtMode must be boolean/,
      );
    });

    it('rejects repeatAfterRuns < 1', () => {
      expect(() => importProgramJson(wrap({ ...baseProgram, repeatAfterRuns: 0 }))).toThrow(
        /repeatAfterRuns must be >= 1/,
      );
    });

    it('rejects non-numeric repeatAfterRuns', () => {
      expect(() => importProgramJson(wrap({ ...baseProgram, repeatAfterRuns: '2' }))).toThrow(
        /repeatAfterRuns must be >= 1/,
      );
    });

    it(`rejects repeatAfterRuns > MAX_RUNS (${MAX_RUNS})`, () => {
      expect(() =>
        importProgramJson(wrap({ ...baseProgram, repeatAfterRuns: MAX_RUNS + 1 })),
      ).toThrow(new RegExp(`repeatAfterRuns must be <= ${MAX_RUNS}`));
    });

    it('rejects non-array runs', () => {
      expect(() => importProgramJson(wrap({ ...baseProgram, runs: 'oops' }))).toThrow(
        /runs must be an array/,
      );
    });

    it('rejects empty runs array', () => {
      expect(() => importProgramJson(wrap({ ...baseProgram, runs: [] }))).toThrow(
        /must have at least 1 run/,
      );
    });

    it(`rejects runs.length > MAX_RUNS (${MAX_RUNS})`, () => {
      const runs = Array.from({ length: MAX_RUNS + 1 }, (_, i) => ({
        id: `r${i}`,
        tricks: [],
      }));
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(
        new RegExp(`at most ${MAX_RUNS} runs`),
      );
    });
  });

  describe('run / trick errors', () => {
    it('rejects a run that is not an object', () => {
      expect(() => importProgramJson(wrap({ ...baseProgram, runs: ['bad'] }))).toThrow(
        /Run 0 is not an object/,
      );
    });

    it('rejects a run without an id', () => {
      const runs = [{ tricks: [] }];
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(/Run 0 missing id/);
    });

    it('rejects duplicate run ids', () => {
      const runs = [
        { id: 'dup', tricks: [] },
        { id: 'dup', tricks: [] },
      ];
      expect(() =>
        importProgramJson(wrap({ ...baseProgram, runs, repeatAfterRuns: 2 })),
      ).toThrow(/Duplicate run id "dup"/);
    });

    it('rejects non-array tricks on a run', () => {
      const runs = [{ id: 'r1', tricks: 'oops' }];
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(
        /Run 0 tricks must be an array/,
      );
    });

    it('rejects a trick that is not an object', () => {
      const runs = [{ id: 'r1', tricks: ['nope'] }];
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(
        /Trick 0:0 is not an object/,
      );
    });

    it('rejects a trick without an id', () => {
      const runs = [
        { id: 'r1', tricks: [{ manoeuvreId: 'sat', side: 'R', selectedBonuses: [] }] },
      ];
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(
        /Trick 0:0 missing id/,
      );
    });

    it('rejects duplicate trick ids across runs', () => {
      const runs = [
        {
          id: 'r1',
          tricks: [{ id: 'shared', manoeuvreId: 'sat', side: 'R', selectedBonuses: [] }],
        },
        {
          id: 'r2',
          tricks: [{ id: 'shared', manoeuvreId: 'sat', side: 'R', selectedBonuses: [] }],
        },
      ];
      expect(() =>
        importProgramJson(wrap({ ...baseProgram, runs, repeatAfterRuns: 2 })),
      ).toThrow(/Duplicate trick id "shared"/);
    });

    it('rejects a trick without manoeuvreId', () => {
      const runs = [{ id: 'r1', tricks: [{ id: 't1', side: 'R', selectedBonuses: [] }] }];
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(
        /Trick 0:0 missing manoeuvreId/,
      );
    });

    it('rejects an unknown manoeuvreId', () => {
      const runs = [
        {
          id: 'r1',
          tricks: [{ id: 't1', manoeuvreId: 'fictional-trick', side: 'R', selectedBonuses: [] }],
        },
      ];
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(
        /unknown manoeuvre "fictional-trick"/,
      );
    });

    it('rejects an invalid side', () => {
      const runs = [
        { id: 'r1', tricks: [{ id: 't1', manoeuvreId: 'sat', side: 'X', selectedBonuses: [] }] },
      ];
      expect(() => importProgramJson(wrap({ ...baseProgram, runs }))).toThrow(
        /Trick 0:0 has invalid side/,
      );
    });
  });
});
