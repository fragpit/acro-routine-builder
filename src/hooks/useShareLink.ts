import { useEffect } from 'react';
import { useProgramStore } from '../store/program-store';
import { fetchSharedProgram, getShareId } from '../io/program-share';

/**
 * On mount, looks for a `?s=<id>` short-link parameter. If present, fetches
 * the program from the share worker, asks for confirmation when the current
 * program has tricks, imports it, and strips the query so a refresh does not
 * re-fetch. Errors are surfaced via alert(), matching the existing file
 * import UX.
 */
export function useShareLink(): void {
  const importProgram = useProgramStore((s) => s.importProgram);

  useEffect(() => {
    const id = getShareId(window.location.search);
    if (!id) return;
    let cancelled = false;
    const clearQuery = () => {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    };
    (async () => {
      try {
        const { program, name } = await fetchSharedProgram(id);
        if (cancelled) return;
        const current = useProgramStore.getState().program;
        const hasContent = current.runs.some((r) => r.tricks.length > 0);
        if (hasContent) {
          const label = name ? `"${name}"` : 'this shared program';
          if (!confirm(`Replace the current program with ${label}?`)) {
            clearQuery();
            return;
          }
        }
        importProgram(program, name);
      } catch (err) {
        if (cancelled) return;
        alert(`Could not load shared program: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        if (!cancelled) clearQuery();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [importProgram]);
}
