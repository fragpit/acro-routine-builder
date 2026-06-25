import { useLayoutEffect, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import type {
  PlacedTrick,
  Side,
  TechnicalMarksByManoeuvreId,
} from '../rules/types';
import { useProgramStore } from '../store/program-store';
import type { DragData } from './builder/drag-types';
import {
  MIN_INLINE_NAME_CHARACTERS,
  shouldUseDedicatedNameRow,
} from './builder/trick-name-layout';

interface Props {
  trick: PlacedTrick;
  highlight: 'none' | 'error' | 'warning';
  selected: boolean;
  ignoredReasons?: string[];
  unrewardedBonuses?: Set<string>;
  technicalMarksByManoeuvreId: TechnicalMarksByManoeuvreId;
  showCopyMode: boolean;
  copyModeActive: boolean;
  onToggleCopyMode: () => void;
  onSelect: () => void;
}

export default function TrickCell({
  trick,
  highlight,
  selected,
  ignoredReasons,
  unrewardedBonuses,
  technicalMarksByManoeuvreId,
  showCopyMode,
  copyModeActive,
  onToggleCopyMode,
  onSelect,
}: Props) {
  const ignored = (ignoredReasons?.length ?? 0) > 0;
  const manoeuvre = MANOEUVRES_BY_ID[trick.manoeuvreId];
  const removeTrick = useProgramStore((s) => s.removeTrick);
  const setTrickSide = useProgramStore((s) => s.setTrickSide);
  const data: DragData = { type: 'cell', trickId: trick.id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `cell_${trick.id}`,
    data,
  });
  const sides: Side[] = ['L', 'R'];
  const manoeuvreName = manoeuvre?.name ?? '';
  const customTechnicalMark = manoeuvre
    ? technicalMarksByManoeuvreId[manoeuvre.id]
    : undefined;
  const headerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const coefficientRef = useRef<HTMLSpanElement>(null);
  const technicalMarkRef = useRef<HTMLSpanElement>(null);
  const [dedicatedNameRow, setDedicatedNameRow] = useState(false);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const actions = actionsRef.current;
    const coefficient = coefficientRef.current;
    if (!header || !actions || !coefficient) return;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    const measure = () => {
      const style = window.getComputedStyle(header);
      context.font = style.font;
      const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
      const measureText = (text: string) =>
        context.measureText(text).width + Math.max(0, text.length - 1) * letterSpacing;
      const minimumInlineText = manoeuvreName.length > MIN_INLINE_NAME_CHARACTERS
        ? `${manoeuvreName.slice(0, MIN_INLINE_NAME_CHARACTERS)}…`
        : manoeuvreName;
      const technicalMarkWidth = technicalMarkRef.current?.offsetWidth ?? 0;
      const innerItemCount = customTechnicalMark === undefined ? 2 : 3;
      const gapWidth = Number.parseFloat(style.columnGap) || 8;
      const availableWidth = header.clientWidth
        - actions.offsetWidth
        - coefficient.offsetWidth
        - technicalMarkWidth
        - gapWidth * innerItemCount;

      setDedicatedNameRow(shouldUseDedicatedNameRow(
        measureText(manoeuvreName),
        measureText(minimumInlineText),
        availableWidth,
      ));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(actions);
    return () => observer.disconnect();
  }, [customTechnicalMark, manoeuvreName]);

  if (!manoeuvre) return null;

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`
        rounded border px-2 py-1.5 text-sm select-none cursor-pointer
        ${isDragging ? 'opacity-40' : ''}
        ${highlight === 'error' ? 'border-red-500 bg-red-100 dark:bg-red-950/40' : highlight === 'warning' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}
        ${selected ? 'ring-2 ring-sky-500' : ''}
        ${copyModeActive ? 'ring-2 ring-emerald-500' : ''}
        ${ignored ? 'opacity-50' : ''}
      `}
    >
      <div ref={headerRef} className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!dedicatedNameRow && (
            <span className={`min-w-0 flex-1 truncate ${ignored ? 'line-through' : ''}`}>
              {manoeuvre.name}
            </span>
          )}
          <span
            ref={coefficientRef}
            className="shrink-0 text-xs text-slate-500 dark:text-slate-400"
          >
            {manoeuvre.coefficient.toFixed(2)}
          </span>
          {customTechnicalMark !== undefined && (
            <span
              ref={technicalMarkRef}
              className="shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
              title="Custom technical mark"
            >
              T {customTechnicalMark.toFixed(1)}
            </span>
          )}
        </div>
        <div ref={actionsRef} className="flex shrink-0 items-center gap-1">
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
          {showCopyMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCopyMode();
              }}
              className={`h-5 touch-manipulation rounded px-1 text-[10px] font-medium ${
                copyModeActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
              }`}
              aria-label={copyModeActive ? 'Disable copy mode' : 'Enable copy mode'}
              aria-pressed={copyModeActive}
              title="Copy mode for next drag"
            >
              copy
            </button>
          )}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 touch-none text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing"
            aria-label="drag"
          >
            ⋮⋮
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (copyModeActive) onToggleCopyMode();
              removeTrick(trick.id);
            }}
            className="w-5 h-5 text-slate-500 hover:text-red-400"
            aria-label="remove"
          >
            ✕
          </button>
        </div>
      </div>
      {dedicatedNameRow && (
        <div className={`mt-1 whitespace-normal break-words leading-snug ${ignored ? 'line-through' : ''}`}>
          {manoeuvre.name}
        </div>
      )}
      {ignored && (
        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
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
                title={notCounted ? 'Bonus not counted: §4.3 - twisted/flipped awarded only once per run for repetition-allowed tricks' : undefined}
                className={`text-[10px] px-1 py-0.5 rounded ${notCounted ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'}`}
              >
                <span className={notCounted ? 'line-through' : ''}>{def?.label ?? b}</span>
                {notCounted && <span className="ml-1">(not counted)</span>}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
