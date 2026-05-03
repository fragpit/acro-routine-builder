import { useEffect, useState } from 'react';
import { useProgramStore } from '../store/program-store';

const EPSILON = 0.0005;
const HIDE_AFTER_MS = 2500;

/**
 * Track the change in a numeric score across renders. Returns the most
 * recent delta between the current value and the previous value, or `null`
 * when there is nothing to show. The delta auto-clears after a short
 * window so the indicator behaves like a transient flash next to the
 * total - it confirms the most recent edit and then disappears.
 *
 * Nothing is shown for bulk program transitions (import / load / new /
 * reset / undo / redo); those bump `bulkResetVersion` on the program
 * store so we can distinguish "fresh edit" from "history navigation".
 */
export function useScoreDelta(total: number | null): number | null {
  const bulkResetVersion = useProgramStore((s) => s.bulkResetVersion);
  const [snapshot, setSnapshot] = useState<{
    lastTotal: number | null;
    lastBulk: number;
    delta: number | null;
    nonce: number;
  }>(() => ({
    lastTotal: total,
    lastBulk: bulkResetVersion,
    delta: null,
    nonce: 0,
  }));

  if (snapshot.lastTotal !== total || snapshot.lastBulk !== bulkResetVersion) {
    let nextDelta: number | null = null;
    let nextNonce = snapshot.nonce;
    const isBulk = snapshot.lastBulk !== bulkResetVersion;
    if (!isBulk && total !== null && snapshot.lastTotal !== null) {
      const diff = total - snapshot.lastTotal;
      if (Math.abs(diff) >= EPSILON) {
        nextDelta = Math.round(diff * 1000) / 1000;
        nextNonce = snapshot.nonce + 1;
      }
    }
    setSnapshot({
      lastTotal: total,
      lastBulk: bulkResetVersion,
      delta: nextDelta,
      nonce: nextNonce,
    });
  }

  useEffect(() => {
    if (snapshot.delta === null) return;
    const nonceWhenScheduled = snapshot.nonce;
    const timer = window.setTimeout(() => {
      setSnapshot((s) =>
        s.nonce === nonceWhenScheduled ? { ...s, delta: null } : s,
      );
    }, HIDE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [snapshot.nonce, snapshot.delta]);

  return snapshot.delta;
}
