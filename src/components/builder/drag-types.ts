/**
 * Strongly-typed payloads passed through `useDraggable.data` and
 * `useDroppable.data`. dnd-kit treats these as `Record<string, any>`, so
 * without a discriminated union the read sites need `as`-casts and lose
 * the link between `type` and the per-variant fields.
 */

export type DragData =
  | { type: 'palette'; manoeuvreId: string }
  | { type: 'cell'; trickId: string };

export type DropData = { runIndex: number; insertIndex: number };

export function isDragData(x: unknown): x is DragData {
  if (!x || typeof x !== 'object') return false;
  const o = x as { type?: unknown; manoeuvreId?: unknown; trickId?: unknown };
  if (o.type === 'palette') return typeof o.manoeuvreId === 'string';
  if (o.type === 'cell') return typeof o.trickId === 'string';
  return false;
}

export function isDropData(x: unknown): x is DropData {
  if (!x || typeof x !== 'object') return false;
  const o = x as { runIndex?: unknown; insertIndex?: unknown };
  return typeof o.runIndex === 'number' && typeof o.insertIndex === 'number';
}
