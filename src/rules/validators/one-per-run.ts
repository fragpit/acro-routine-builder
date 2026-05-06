import type { Program, Manoeuvre, Violation } from '../types';

/**
 * 3.2 / 6.5.1.2: Only one stall-to-infinite family manoeuvre per run -
 * extras (in order of execution) are not scored.
 * 3.6: MacFly/MistyFly/HeliFly/SatFly are no-side and can each appear
 * only once per run; same "extras unscored" treatment applies because
 * those manoeuvres are also in the stall-to-infinite family.
 *
 * Both rules emit warnings (not errors): scoring drops the extras via
 * `excludedFromScoring` so the run remains flyable, just lighter.
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
        severity: 'warning',
        description: `Run ${runIndex + 1}: more than one stall-to-infinite family manoeuvre - extras not scored`,
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
          severity: 'warning',
          description: `Run ${runIndex + 1}: ${m?.name ?? id} appears more than once - extras not scored`,
          affectedCells: indices.map((i) => ({ runIndex, trickIndex: i })),
        });
      }
    }
  });
  return violations;
}
