import type { Program, Manoeuvre, Violation } from '../types';

/**
 * 3.2: Only one stall-to-infinite family manoeuvre per run.
 * 3.6: MacFly/MistyFly/HeliFly/SatFly - each only once per run (and no side).
 */
export function validateOnePerRun(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const violations: Violation[] = [];
  program.runs.forEach((run, runIndex) => {
    const stallToInfCells = run.tricks
      .map((t, i) => ({ m: manoeuvres[t.manoeuvreId], i }))
      .filter(({ m }) => m && m.groups.includes('stall_to_infinite'));
    if (stallToInfCells.length > 1) {
      violations.push({
        ruleId: 'one-per-run-stall-inf',
        severity: 'error',
        description: `Run ${runIndex + 1}: only one stall-to-infinite family manoeuvre allowed per run`,
        affectedCells: stallToInfCells.map(({ i }) => ({ runIndex, trickIndex: i })),
      });
    }

    const countsById = new Map<string, number[]>();
    run.tricks.forEach((t, i) => {
      const m = manoeuvres[t.manoeuvreId];
      if (m?.noSide && !m.repetitionAllowed) {
        const arr = countsById.get(m.id) ?? [];
        arr.push(i);
        countsById.set(m.id, arr);
      }
    });
    for (const [id, indices] of countsById) {
      if (indices.length > 1) {
        const m = manoeuvres[id];
        violations.push({
          ruleId: 'no-side-once',
          severity: 'error',
          description: `Run ${runIndex + 1}: ${m?.name ?? id} can be performed only once per run`,
          affectedCells: indices.map((i) => ({ runIndex, trickIndex: i })),
        });
      }
    }
  });
  return violations;
}
