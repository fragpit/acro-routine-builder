import { useState } from 'react';
import { useProgramStore } from '../store/program-store';

const EPSILON = 0.0005;

/**
 * Track the change in a numeric score across renders. Returns the most
 * recent delta between the current value and the previous value, or `null`
 * when there is nothing meaningful to show (first observation, no change,
 * or a bulk program transition such as import / reset).
 *
 * The delta persists across renders until the next change so the user sees
 * the effect of their last action even after React re-renders for unrelated
 * reasons. Bulk transitions are detected via `bulkResetVersion` on the
 * program store so wholesale program replacement does not surface as a
 * giant misleading delta.
 */
export function useScoreDelta(total: number | null): number | null {
  const bulkResetVersion = useProgramStore((s) => s.bulkResetVersion);
  const [snapshot, setSnapshot] = useState<{
    total: number | null;
    bulk: number;
    delta: number | null;
  }>({ total, bulk: bulkResetVersion, delta: null });

  if (snapshot.total !== total || snapshot.bulk !== bulkResetVersion) {
    let nextDelta: number | null = snapshot.delta;
    if (snapshot.bulk !== bulkResetVersion) {
      nextDelta = null;
    } else if (total === null || snapshot.total === null) {
      nextDelta = null;
    } else {
      const diff = total - snapshot.total;
      if (Math.abs(diff) >= EPSILON) {
        nextDelta = Math.round(diff * 1000) / 1000;
      }
    }
    setSnapshot({ total, bulk: bulkResetVersion, delta: nextDelta });
  }

  return snapshot.delta;
}
