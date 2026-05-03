import { useCallback, useEffect, useState } from 'react';
import { useProgramStore } from '../store/program-store';

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
 *   total changes, and on wholesale program transitions
 *   (`bulkResetVersion`). Returns `null` while current matches the
 *   baseline so the indicator hides.
 *
 * - **Pinned**. The user clicked the score; baseline froze at that
 *   moment. The idle timer is ignored. The delta is returned even when
 *   it is `0` so the indicator stays visible (showing `+0.000` right
 *   after pinning), making the pinned state self-evident.
 *
 * Bulk transitions (import / load / new / reset) auto-unpin: the
 * pinned baseline belongs to the previous program. Undo / redo do not
 * affect pin or baseline; they shift the delta naturally.
 */
export function useScoreDelta(total: number | null): ScoreDeltaResult {
  const bulkResetVersion = useProgramStore((s) => s.bulkResetVersion);

  const [state, setState] = useState<{
    baseline: number | null;
    lastTotal: number | null;
    lastBulk: number;
    pinned: boolean;
  }>(() => ({
    baseline: total,
    lastTotal: total,
    lastBulk: bulkResetVersion,
    pinned: false,
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
      pinned: false,
    });
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
