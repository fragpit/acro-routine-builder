import { useDraggable } from '@dnd-kit/core';
import type { Manoeuvre } from '../../rules/types';
import type { DragData } from './drag-types';

/**
 * Visual-only palette card used inside DragOverlay (no DnD listeners).
 */
export function PaletteCardPresentation({ manoeuvre }: { manoeuvre: Manoeuvre }) {
  return (
    <div className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm cursor-grab active:cursor-grabbing select-none flex justify-between shadow-md">
      <span>{manoeuvre.name}</span>
      <span className="text-slate-500 dark:text-slate-400">{manoeuvre.coefficient.toFixed(2)}</span>
    </div>
  );
}

/**
 * Draggable palette card. `recent` only changes the draggable id so the
 * recent-tricks strip and the main list don't collide on the same dnd-kit id.
 */
export function PaletteCard({
  manoeuvre,
  recent = false,
}: {
  manoeuvre: Manoeuvre;
  recent?: boolean;
}) {
  const data: DragData = { type: 'palette', manoeuvreId: manoeuvre.id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: recent ? `palette_recent_${manoeuvre.id}` : `palette_${manoeuvre.id}`,
    data,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm cursor-grab active:cursor-grabbing select-none flex justify-between ${isDragging ? 'opacity-40' : ''} hover:border-sky-500`}
    >
      <span className="truncate">{manoeuvre.name}</span>
      <span className="text-slate-500 dark:text-slate-400 ml-2 shrink-0">
        {manoeuvre.coefficient.toFixed(2)}
      </span>
    </div>
  );
}
