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
 * Sum bonus malus (percent) per run from violations that attribute a
 * penalty via `bonusMalusByRun`. Keys are run indices.
 */
export function useBonusMalusPerRun(
  violations: Violation[],
): Record<number, number> {
  return useMemo(() => {
    const totals: Record<number, number> = {};
    for (const v of violations) {
      if (!v.bonusMalusByRun) continue;
      for (const [runIndex, pct] of Object.entries(v.bonusMalusByRun)) {
        const i = Number(runIndex);
        totals[i] = (totals[i] ?? 0) + pct;
      }
    }
    return totals;
  }, [violations]);
}
