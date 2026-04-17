import type { Manoeuvre, PlacedTrick, Program, Violation } from '../types';

function isReverse(t: PlacedTrick, m: Manoeuvre): boolean {
  return t.selectedBonuses.some(
    (b) => m.availableBonuses.find((ab) => ab.id === b)?.countsAs === 'reversed',
  );
}

function identityKey(t: PlacedTrick, m: Manoeuvre): string {
  const side = m.noSide ? '-' : (t.side ?? '-');
  return `${m.id}:${side}`;
}

/**
 * 4.1-4.3: Per-competition repetition. A manoeuvre in the same direction is
 * considered a repetition. Twisted/flipped doesn't change identity. Per
 * rule 3.3.1, a reverse manoeuvre is considered a different manoeuvre
 * altogether - reversed instances are treated as unique and excluded from
 * repetition tracking entirely (so two reversed Jokers do not collide,
 * and a reversed Joker does not collide with a non-reversed one).
 * Section 4.3 exceptions (repetitionAllowed) also skip the check.
 *
 * `repeatAfterRuns` defines how often the repetition tracker resets. Runs
 * are partitioned into fixed blocks of N consecutive runs ([0..N-1],
 * [N..2N-1], ...); a repetition counts only if both occurrences fall within
 * the same block. N must be >= 1; N >= MAX_RUNS means no repeats anywhere
 * in the program.
 */
export function validateRepetition(
  program: Program,
  manoeuvres: Record<string, Manoeuvre>,
): Violation[] {
  const groups = new Map<string, { runIndex: number; trickIndex: number; name: string }[]>();
  program.runs.forEach((run, runIndex) => {
    run.tricks.forEach((t, trickIndex) => {
      const m = manoeuvres[t.manoeuvreId];
      if (!m || m.repetitionAllowed) return;
      if (isReverse(t, m)) return;
      const key = identityKey(t, m);
      const list = groups.get(key) ?? [];
      list.push({ runIndex, trickIndex, name: m.name });
      groups.set(key, list);
    });
  });

  const violations: Violation[] = [];
  const gap = program.repeatAfterRuns;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const byBlock = new Map<number, number[]>();
    list.forEach((item, i) => {
      const block = Math.floor(item.runIndex / gap);
      const arr = byBlock.get(block) ?? [];
      arr.push(i);
      byBlock.set(block, arr);
    });
    const flagged = new Set<number>();
    const choreoPenaltyByRun: Record<number, number> = {};
    for (const arr of byBlock.values()) {
      if (arr.length < 2) continue;
      const sorted = [...arr].sort((a, b) => a - b);
      for (const idx of sorted) flagged.add(idx);
      for (let k = 1; k < sorted.length; k++) {
        const runIndex = list[sorted[k]].runIndex;
        choreoPenaltyByRun[runIndex] = (choreoPenaltyByRun[runIndex] ?? 0) + 13;
      }
    }
    if (flagged.size === 0) continue;
    const cells = [...flagged]
      .sort((a, b) => a - b)
      .map((i) => ({ runIndex: list[i].runIndex, trickIndex: list[i].trickIndex }));
    violations.push({
      ruleId: 'repetition',
      severity: 'warning',
      description: `${list[0].name} repeated (${flagged.size}x)`,
      affectedCells: cells,
      choreoPenaltyByRun,
    });
  }
  return violations;
}
