import { useState } from 'react';
import { useProgramStore } from '../store/program-store';

const EPSILON = 0.0005;

/**
 * Track the change in a numeric score across renders. Returns the most
 * recent delta between the current value and the previous value, or `null`
 * when there is nothing meaningful to show:
 *  - first observation
 *  - no change
 *  - a bulk program transition (import / reset / undo / redo)
 *  - a round-trip: the new total matches the value from before the previous
 *    action (e.g. user toggled a bonus on and then back off; or any other
 *    edit that lands on the prior total). In that case showing the inverse
 *    delta would just retell the story the user just saw.
 *
 * The delta persists across renders until the next change so the user sees
 * the effect of their last action even after React re-renders for unrelated
 * reasons.
 */
export function useScoreDelta(total: number | null): number | null {
  const bulkResetVersion = useProgramStore((s) => s.bulkResetVersion);
  const [snapshot, setSnapshot] = useState<{
    total: number | null;
    prevTotal: number | null;
    bulk: number;
    delta: number | null;
  }>({ total, prevTotal: null, bulk: bulkResetVersion, delta: null });

  if (snapshot.total !== total || snapshot.bulk !== bulkResetVersion) {
    let nextDelta: number | null = snapshot.delta;
    if (snapshot.bulk !== bulkResetVersion) {
      nextDelta = null;
    } else if (total === null || snapshot.total === null) {
      nextDelta = null;
    } else if (
      snapshot.prevTotal !== null &&
      Math.abs(total - snapshot.prevTotal) < EPSILON
    ) {
      nextDelta = null;
    } else {
      const diff = total - snapshot.total;
      if (Math.abs(diff) >= EPSILON) {
        nextDelta = Math.round(diff * 1000) / 1000;
      }
    }
    setSnapshot({
      total,
      prevTotal: snapshot.total,
      bulk: bulkResetVersion,
      delta: nextDelta,
    });
  }

  return snapshot.delta;
}
