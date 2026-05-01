import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import type { PlacedTrick, Side } from '../../rules/types';
import { useProgramStore } from '../../store/program-store';
import { IconGrip } from '../icons';

interface Props {
  trick: PlacedTrick;
  highlight: 'none' | 'error' | 'warning';
  ignoredReasons?: string[];
  unrewardedBonuses?: Set<string>;
  dimmed?: boolean;
  sortDisabled?: boolean;
  onTap: () => void;
}

const SIDES: Side[] = ['L', 'R'];

export default function TrickCellMobile({ trick, highlight, ignoredReasons, unrewardedBonuses, dimmed, sortDisabled, onTap }: Props) {
  const manoeuvre = MANOEUVRES_BY_ID[trick.manoeuvreId];
  const setTrickSide = useProgramStore((s) => s.setTrickSide);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: trick.id,
    disabled: sortDisabled || dimmed,
  });
  if (!manoeuvre) return null;

  const ignored = (ignoredReasons?.length ?? 0) > 0;
  const handleDisabled = sortDisabled || dimmed;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
      className={`w-full text-left rounded border px-3 py-2 select-none transition-colors cursor-pointer ${
        highlight === 'error'
          ? 'border-red-500 bg-red-100 dark:bg-red-950/40'
          : highlight === 'warning'
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      } ${ignored ? 'opacity-60' : ''} ${dimmed ? 'opacity-40 ring-2 ring-sky-500' : ''} ${isDragging ? 'opacity-60 ring-2 ring-sky-500 shadow-lg z-10 relative' : ''} active:bg-slate-100 dark:active:bg-slate-700`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${ignored ? 'line-through' : ''}`}>
              {manoeuvre.name}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              {manoeuvre.coefficient.toFixed(2)}
            </span>
          </div>
          {ignored && (
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
              ignored: {ignoredReasons!.join('; ')}
            </div>
          )}
          {trick.selectedBonuses.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {trick.selectedBonuses.map((b) => {
                const def = manoeuvre.availableBonuses.find((ab) => ab.id === b);
                const notCounted = unrewardedBonuses?.has(b);
                return (
                  <span
                    key={b}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      notCounted
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className={notCounted ? 'line-through' : ''}>{def?.label ?? b}</span>
                    {notCounted && <span className="ml-1">(nc)</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!manoeuvre.noSide &&
            SIDES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTrickSide(trick.id, s);
                }}
                className={`w-8 h-8 text-xs rounded border font-semibold ${
                  trick.side === s
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                }`}
                aria-label={`Set side ${s}`}
              >
                {s}
              </button>
            ))}
          <button
            ref={setActivatorNodeRef}
            type="button"
            disabled={handleDisabled}
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'none' }}
            className="w-8 h-8 ml-1 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-grab active:cursor-grabbing disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Drag to reorder"
          >
            <IconGrip className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
