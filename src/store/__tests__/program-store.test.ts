import { beforeEach, describe, expect, it } from 'vitest';
import type { Program } from '../../rules/types';
import { useProgramStore } from '../program-store';

function makeProgram(): Program {
  return {
    awtMode: false,
    repeatAfterRuns: 4,
    defaultBonuses: [],
    notes: '',
    runs: [
      {
        id: 'run_1',
        tricks: [
          {
            id: 'source_1',
            manoeuvreId: 'sat',
            side: 'L',
            selectedBonuses: ['twisted'],
          },
          {
            id: 'source_2',
            manoeuvreId: 'helicopter',
            side: 'R',
            selectedBonuses: [],
          },
        ],
      },
      {
        id: 'run_2',
        tricks: [
          {
            id: 'target_1',
            manoeuvreId: 'stall',
            side: null,
            selectedBonuses: [],
          },
        ],
      },
    ],
  };
}

describe('program store', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgramStore.setState({
      program: makeProgram(),
      violations: [],
      selectedTrickId: 'target_1',
      currentName: null,
      savedPrograms: {},
      past: [],
      future: [],
    });
  });

  it('duplicates one run into another with fresh trick ids', () => {
    useProgramStore.getState().duplicateRun(0, 1);

    const state = useProgramStore.getState();
    const source = state.program.runs[0];
    const target = state.program.runs[1];

    expect(target.id).toBe('run_2');
    expect(target.tricks).toHaveLength(2);
    expect(target.tricks.map((t) => t.manoeuvreId)).toEqual(['sat', 'helicopter']);
    expect(target.tricks.map((t) => t.side)).toEqual(['L', 'R']);
    expect(target.tricks.map((t) => t.selectedBonuses)).toEqual([['twisted'], []]);
    expect(target.tricks.map((t) => t.id)).not.toEqual(source.tricks.map((t) => t.id));
    expect(new Set(target.tricks.map((t) => t.id)).size).toBe(2);
    expect(state.selectedTrickId).toBeNull();
    expect(state.past).toHaveLength(1);
    expect(state.past[0].runs[1].tricks[0].id).toBe('target_1');
  });

  it('does nothing when source and target are the same run', () => {
    useProgramStore.getState().duplicateRun(0, 0);

    const state = useProgramStore.getState();
    expect(state.program).toEqual(makeProgram());
    expect(state.past).toHaveLength(0);
  });
});
