import { useEffect, useRef, useState } from 'react';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { useProgramStore } from '../../store/program-store';
import TrickInfoCard from '../TrickInfoCard';

interface Props {
  trickId: string | null;
  onClose: () => void;
  onMoveArm: (trickId: string) => void;
  onCopyArm: (trickId: string) => void;
}

export default function TrickSheet({ trickId, onClose, onMoveArm, onCopyArm }: Props) {
  const program = useProgramStore((s) => s.program);
  const removeTrick = useProgramStore((s) => s.removeTrick);
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const menuOpen = menuForId !== null && menuForId === trickId;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trickId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (menuOpen) setMenuForId(null);
      else onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trickId, onClose, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuForId(null);
      }
    }
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  if (!trickId) return null;

  let location: { runIndex: number; trickIndex: number } | null = null;
  for (let r = 0; r < program.runs.length; r++) {
    const idx = program.runs[r].tricks.findIndex((t) => t.id === trickId);
    if (idx >= 0) {
      location = { runIndex: r, trickIndex: idx };
      break;
    }
  }
  if (!location) return null;
  const placed = program.runs[location.runIndex].tricks[location.trickIndex];
  const manoeuvre = MANOEUVRES_BY_ID[placed.manoeuvreId];
  if (!manoeuvre) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col animate-[slideUp_0.18s_ease-out] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="shrink-0 relative flex justify-center py-2">
          <span className="block w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div ref={menuRef} className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              type="button"
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuForId(menuOpen ? null : placed.id)}
              className="p-2 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuForId(null);
                    removeTrick(placed.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Remove trick
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TrickInfoCard manoeuvre={manoeuvre} placedTrick={placed} onClose={onClose} />
        </div>
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onMoveArm(placed.id)}
            className="py-2 text-sm rounded border border-sky-500 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40"
          >
            Move
          </button>
          <button
            type="button"
            onClick={() => onCopyArm(placed.id)}
            className="py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-500"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
