import type { PlacedTrick, Program, Run } from '../../types';

let idCounter = 0;
export function resetIds() {
  idCounter = 0;
}
export function placedTrick(manoeuvreId: string, overrides: Partial<PlacedTrick> = {}): PlacedTrick {
  return { id: `t${++idCounter}`, manoeuvreId, side: 'L', selectedBonuses: [], ...overrides };
}

export function run(...tricks: PlacedTrick[]): Run {
  return { id: `r${++idCounter}`, tricks };
}

export function program(runs: Run[], awtMode = false): Program {
  return { awtMode, runs, repeatAfterRuns: 0 };
}
