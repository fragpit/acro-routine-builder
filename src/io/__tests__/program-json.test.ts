import { describe, expect, it } from 'vitest';
import { exportProgramJson, importProgramJson } from '../program-json';
import type { Program } from '../../rules/types';

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
    };
    const json = exportProgramJson(program, 'fixture');
    const { program: imported } = importProgramJson(json);
    expect(imported.runs[0].tricks[0].selectedBonuses).toEqual([]);
    expect(imported.runs[0].tricks[1].selectedBonuses).toEqual(['twisted']);
  });

  it('accepts fixtures that roundtrip without changes', () => {
    const program: Program = {
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
    };
    const { program: imported } = importProgramJson(exportProgramJson(program, null));
    expect(imported).toEqual(program);
  });
});
