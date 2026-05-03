import { useCallback, useEffect, useState } from 'react';

const EPSILON = 0.0005;
const IDLE_RESET_MS = 3000;

interface ScoreDeltaResult {
  delta: number | null;
  isPinned: boolean;
  togglePin: () => void;
}

/**
 * Track the change in a numeric score against a baseline. Two modes:
 *
 * - **Auto** (default). Baseline settles after `IDLE_RESET_MS` of no
 *   total changes. Returns `null` while current matches the baseline so
 *   the indicator hides.
 *
 * - **Pinned**. The user clicked the score; baseline froze at that
 *   moment. The idle timer is ignored. The delta is returned even when
 *   it is `0` so the indicator stays visible (showing `+0.000` right
 *   after pinning), making the pinned state self-evident.
 *
 * Imports / loads / resets / undo / redo are not treated specially: in
 * auto mode the idle timer naturally settles the baseline a few seconds
 * after the change; in pinned mode the comparison against the pinned
 * point is preserved as the user expects.
 */
export function useScoreDelta(total: number | null): ScoreDeltaResult {
  const [state, setState] = useState<{
    baseline: number | null;
    lastTotal: number | null;
    pinned: boolean;
  }>(() => ({
    baseline: total,
    lastTotal: total,
    pinned: false,
  }));

  const needsBaselineInit = state.baseline === null && total !== null;
  if (needsBaselineInit) {
    setState((s) => ({ ...s, baseline: total, lastTotal: total }));
  } else if (state.lastTotal !== total) {
    setState((s) => ({ ...s, lastTotal: total }));
  }

  useEffect(() => {
    if (total === null || state.pinned) return;
    const timer = window.setTimeout(() => {
      setState((s) =>
        s.lastTotal === total && !s.pinned ? { ...s, baseline: total } : s,
      );
    }, IDLE_RESET_MS);
    return () => window.clearTimeout(timer);
  }, [total, state.pinned]);

  const togglePin = useCallback(() => {
    setState((s) => ({
      ...s,
      pinned: !s.pinned,
      baseline: total,
    }));
  }, [total]);

  let delta: number | null = null;
  if (total !== null && state.baseline !== null) {
    const diff = total - state.baseline;
    if (state.pinned || Math.abs(diff) >= EPSILON) {
      delta = Math.round(diff * 1000) / 1000;
    }
  }

  return { delta, isPinned: state.pinned, togglePin };
}
