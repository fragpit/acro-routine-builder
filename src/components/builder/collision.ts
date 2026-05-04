import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';

/**
 * Collision strategy that mirrors the mobile sortable behavior: identify the
 * run column the pointer is currently inside, then pick the insertion strip
 * (DropZone) in that run whose center is closest to the dragged item. The
 * chosen strip is the only one that goes isOver, so only one gap visibly
 * opens up at a time and the surrounding cells shift to make space - without
 * littering every gap with a dashed marker.
 *
 * RunDropArea is intentionally excluded from the active-run pool: its rect
 * center is the column midpoint, so cursor-at-column-middle would otherwise
 * tie with the geometrically-closest strip and silently route the drop to
 * "append at end" via RunDropArea's insertIndex = tricks.length.
 */
export const closestStripInPointerRun: CollisionDetection = (args) => {
  const pointerRunHits = pointerWithin(args).filter((c) =>
    String(c.id).startsWith('drop_run_'),
  );
  if (pointerRunHits.length > 0) {
    const match = String(pointerRunHits[0].id).match(/^drop_run_(\d+)$/);
    if (match) {
      const runPrefix = `drop_${match[1]}_`;
      const runStrips = args.droppableContainers.filter((c) =>
        String(c.id).startsWith(runPrefix),
      );
      if (runStrips.length > 0) {
        return closestCenter({ ...args, droppableContainers: runStrips });
      }
    }
  }
  return rectIntersection(args);
};
