import { useMemo } from 'react';
import type { Violation } from '../rules/types';

/**
 * Build a `runIndex:trickIndex` -> 'error' | 'warning' map from a list of
 * violations. Errors outrank warnings on the same cell.
 */
export function useViolationHighlights(
  violations: Violation[],
): Map<string, 'error' | 'warning'> {
  return useMemo(() => {
    const map = new Map<string, 'error' | 'warning'>();
    for (const v of violations) {
      for (const c of v.affectedCells) {
        const key = `${c.runIndex}:${c.trickIndex}`;
        if (v.severity === 'error' || !map.has(key)) map.set(key, v.severity);
      }
    }
    return map;
  }, [violations]);
}

/**
 * Sum choreography-mark penalties (percent) per run from violations that
 * attribute a penalty via `choreoPenaltyByRun`. Keys are run indices.
 */
export function useChoreoPenaltyPerRun(
  violations: Violation[],
): Record<number, number> {
  return useMemo(() => {
    const totals: Record<number, number> = {};
    for (const v of violations) {
      if (!v.choreoPenaltyByRun) continue;
      for (const [runIndex, pct] of Object.entries(v.choreoPenaltyByRun)) {
        const i = Number(runIndex);
        totals[i] = (totals[i] ?? 0) + pct;
      }
    }
    return totals;
  }, [violations]);
}
