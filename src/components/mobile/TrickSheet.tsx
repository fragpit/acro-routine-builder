import { useEffect } from 'react';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { useProgramStore } from '../../store/program-store';
import TrickInfoCard from '../TrickInfoCard';

interface Props {
  trickId: string | null;
  onClose: () => void;
  onMoveArm: (trickId: string) => void;
}

export default function TrickSheet({ trickId, onClose, onMoveArm }: Props) {
  const program = useProgramStore((s) => s.program);
  const removeTrick = useProgramStore((s) => s.removeTrick);
  const copyTrick = useProgramStore((s) => s.copyTrick);

  useEffect(() => {
    if (!trickId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trickId, onClose]);

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
        <div className="shrink-0 flex justify-center py-2">
          <span className="block w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
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
            onClick={() => {
              copyTrick(placed.id, location!.runIndex, location!.trickIndex + 1);
              onClose();
            }}
            className="py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => {
              removeTrick(placed.id);
              onClose();
            }}
            className="py-2 text-sm rounded bg-red-600 text-white hover:bg-red-500"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
