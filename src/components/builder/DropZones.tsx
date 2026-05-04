import { useDroppable } from '@dnd-kit/core';
import type { DropData } from './drag-types';

export function RunDropArea({
  runIndex,
  insertIndex,
  children,
}: {
  runIndex: number;
  insertIndex: number;
  children: React.ReactNode;
}) {
  const data: DropData = { runIndex, insertIndex };
  const { setNodeRef, isOver } = useDroppable({
    id: `drop_run_${runIndex}`,
    data,
  });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-2 space-y-1 flex flex-col rounded transition-colors ${
        isOver ? 'bg-sky-500/5 ring-1 ring-sky-400/40 ring-inset' : ''
      }`}
    >
      {children}
    </div>
  );
}

export function EmptyDropZone({ runIndex }: { runIndex: number }) {
  const data: DropData = { runIndex, insertIndex: 0 };
  const { setNodeRef, isOver } = useDroppable({
    id: `drop_${runIndex}_0`,
    data,
  });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[160px] rounded border-2 border-dashed flex items-center justify-center text-sm text-slate-500 transition-colors ${
        isOver
          ? 'border-sky-400 bg-sky-500/10 text-sky-600 dark:text-sky-400'
          : 'border-slate-300 dark:border-slate-700'
      }`}
    >
      Drop tricks here
    </div>
  );
}

export function DropZone({ runIndex, insertIndex }: { runIndex: number; insertIndex: number }) {
  const data: DropData = { runIndex, insertIndex };
  const { setNodeRef, isOver } = useDroppable({
    id: `drop_${runIndex}_${insertIndex}`,
    data,
  });
  return (
    <div
      ref={setNodeRef}
      className={`h-1.5 rounded transition-all ${isOver ? 'h-8 bg-sky-500/20 border border-dashed border-sky-400' : ''}`}
    />
  );
}
