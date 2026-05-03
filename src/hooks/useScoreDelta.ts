import { useEffect, useState } from 'react';
import { useProgramStore } from '../store/program-store';

const EPSILON = 0.0005;
const IDLE_RESET_MS = 3000;

/**
 * Track the cumulative change in a numeric score against a baseline that
 * settles after a brief period of inactivity. Returns the difference
 * `current - baseline`, or `null` when there is nothing to show:
 *  - the score is `null` (no tricks)
 *  - current matches the baseline (idle, or just after a reset)
 *
 * The baseline updates in two cases:
 *  - `IDLE_RESET_MS` of no score changes (the user paused; the current
 *    state becomes the new "stable" point against which future edits
 *    will be measured).
 *  - A bulk wholesale program transition (`bulkResetVersion` bumped by
 *    import / load / new / reset). The previous baseline belonged to a
 *    different program and would produce a meaningless delta. Undo /
 *    redo do NOT bump this counter - they are within-session navigation
 *    and should let the delta shift naturally relative to the baseline.
 */
export function useScoreDelta(total: number | null): number | null {
  const bulkResetVersion = useProgramStore((s) => s.bulkResetVersion);

  const [state, setState] = useState<{
    baseline: number | null;
    lastTotal: number | null;
    lastBulk: number;
  }>(() => ({
    baseline: total,
    lastTotal: total,
    lastBulk: bulkResetVersion,
  }));

  const bulkChanged = state.lastBulk !== bulkResetVersion;
  const nullCrossed =
    (state.baseline === null && total !== null) ||
    (state.baseline !== null && total === null);

  if (bulkChanged || nullCrossed) {
    setState({
      baseline: total,
      lastTotal: total,
      lastBulk: bulkResetVersion,
    });
  } else if (state.lastTotal !== total) {
    setState((s) => ({ ...s, lastTotal: total }));
  }

  useEffect(() => {
    if (total === null) return;
    const timer = window.setTimeout(() => {
      setState((s) => (s.lastTotal === total ? { ...s, baseline: total } : s));
    }, IDLE_RESET_MS);
    return () => window.clearTimeout(timer);
  }, [total]);

  if (total === null || state.baseline === null) return null;
  const diff = total - state.baseline;
  if (Math.abs(diff) < EPSILON) return null;
  return Math.round(diff * 1000) / 1000;
}
