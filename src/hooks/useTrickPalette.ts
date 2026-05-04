import { useCallback, useMemo, useState } from 'react';
import { MANOEUVRES, MANOEUVRES_BY_ID } from '../data/manoeuvres';
import type { Manoeuvre } from '../rules/types';
import { loadRecentTricks, pushRecentTrick } from '../store/recent-tricks';

/**
 * Shared state for the desktop palette: filter text, sort direction and the
 * recent-tricks list with derived filtered/sorted views. `pushRecent` is
 * exposed so DnD code can mark a trick as recently used after a successful
 * palette drop.
 */
export function useTrickPalette() {
  const [paletteFilter, setPaletteFilter] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [recent, setRecent] = useState<string[]>(() => loadRecentTricks());

  const sortedAvailable = useMemo(() => {
    const q = paletteFilter.toLowerCase();
    return [...MANOEUVRES]
      .filter((m) => m.name.toLowerCase().includes(q))
      .sort((a, b) =>
        sortDir === 'asc' ? a.coefficient - b.coefficient : b.coefficient - a.coefficient,
      );
  }, [paletteFilter, sortDir]);

  const recentAvailable = useMemo<Manoeuvre[]>(() => {
    const q = paletteFilter.toLowerCase();
    return recent
      .map((id) => MANOEUVRES_BY_ID[id])
      .filter((m): m is Manoeuvre => !!m && m.name.toLowerCase().includes(q));
  }, [recent, paletteFilter]);

  const toggleSort = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  const pushRecent = useCallback((id: string) => {
    setRecent((prev) => pushRecentTrick(prev, id));
  }, []);

  return {
    paletteFilter,
    setPaletteFilter,
    sortDir,
    toggleSort,
    sortedAvailable,
    recentAvailable,
    pushRecent,
  };
}
