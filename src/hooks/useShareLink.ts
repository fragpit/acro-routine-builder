import { useEffect } from 'react';
import { useProgramStore } from '../store/program-store';
import { decodeShareLink, isShareHash } from '../io/program-share';

/**
 * On mount, looks for a `#p=...` share payload in the URL. If found, decodes
 * it, imports the embedded program (asking for confirmation when the current
 * program has any tricks), and clears the hash so a refresh does not
 * re-import. Errors are surfaced via alert(), matching the existing file
 * import UX.
 */
export function useShareLink(): void {
  const importProgram = useProgramStore((s) => s.importProgram);

  useEffect(() => {
    const hash = window.location.hash;
    if (!isShareHash(hash)) return;
    const clearHash = () => {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    };
    try {
      const { program, name } = decodeShareLink(hash);
      const current = useProgramStore.getState().program;
      const hasContent = current.runs.some((r) => r.tricks.length > 0);
      if (hasContent) {
        const label = name ? `"${name}"` : 'this shared program';
        if (!confirm(`Replace the current program with ${label}?`)) {
          clearHash();
          return;
        }
      }
      importProgram(program, name);
    } catch (err) {
      alert(`Could not load shared program: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearHash();
    }
  }, [importProgram]);
}
