import { useDraggable } from '@dnd-kit/core';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import type { PlacedTrick, Side } from '../rules/types';
import { useProgramStore } from '../store/program-store';

interface Props {
  trick: PlacedTrick;
  runIndex: number;
  trickIndex: number;
  highlight: 'none' | 'error' | 'warning';
  selected: boolean;
  ignoredReasons?: string[];
  onSelect: () => void;
}

export default function TrickCell({ trick, highlight, selected, ignoredReasons, onSelect }: Props) {
  const ignored = (ignoredReasons?.length ?? 0) > 0;
  const manoeuvre = MANOEUVRES_BY_ID[trick.manoeuvreId];
  const removeTrick = useProgramStore((s) => s.removeTrick);
  const setTrickSide = useProgramStore((s) => s.setTrickSide);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `cell_${trick.id}`,
    data: { type: 'cell', trickId: trick.id },
  });

  if (!manoeuvre) return null;

  const sides: Side[] = ['L', 'R'];

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`
        rounded border px-2 py-1.5 text-sm select-none cursor-pointer
        ${isDragging ? 'opacity-40' : ''}
        ${highlight === 'error' ? 'border-red-500 bg-red-100 dark:bg-red-950/40' : highlight === 'warning' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}
        ${selected ? 'ring-2 ring-sky-500' : ''}
        ${ignored ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="truncate flex items-center gap-2">
            <span className={ignored ? 'line-through' : ''}>{manoeuvre.name}</span>
            {ignored && (
              <span
                className="text-[10px] uppercase tracking-wide text-slate-500 shrink-0"
                title={`Ignored: ${ignoredReasons!.join('; ')}`}
              >
                ignored ({ignoredReasons!.join('; ')})
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{manoeuvre.coefficient.toFixed(2)}</div>
        </div>
        <div className="flex items-center gap-1">
          {!manoeuvre.noSide &&
            sides.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTrickSide(trick.id, s);
                }}
                className={`w-5 h-5 text-[10px] rounded border ${trick.side === s ? 'bg-sky-600 border-sky-400 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}
              >
                {s}
              </button>
            ))}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing"
            aria-label="drag"
          >
            ⋮⋮
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTrick(trick.id);
            }}
            className="w-5 h-5 text-slate-500 hover:text-red-400"
            aria-label="remove"
          >
            ✕
          </button>
        </div>
      </div>
      {trick.selectedBonuses.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {trick.selectedBonuses.map((b) => {
            const def = manoeuvre.availableBonuses.find((ab) => ab.id === b);
            return (
              <span key={b} className="text-[10px] px-1 py-0.5 rounded bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                {def?.label ?? b}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
