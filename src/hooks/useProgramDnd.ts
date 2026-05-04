import { useEffect, useRef, useState } from 'react';
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useProgramStore } from '../store/program-store';

type DragData = { type: 'palette' | 'cell'; manoeuvreId?: string; trickId?: string };
type DropData = { runIndex: number; insertIndex: number };

export type ActiveDrag = { type: 'palette' | 'cell'; id: string };

/**
 * Owns the desktop builder's drag-and-drop wiring:
 * - sensors (pointer + touch with mobile-friendly delay)
 * - Alt-key tracking so a hold during drop turns move into copy
 * - DragStart / DragEnd handlers that dispatch into the program store
 *
 * `onPaletteAddCommit` fires after a successful palette drop so the caller
 * can update the recent-tricks list without coupling that state to DnD.
 */
export function useProgramDnd(opts: { onPaletteAddCommit: (manoeuvreId: string) => void }) {
  const addTrick = useProgramStore((s) => s.addTrick);
  const moveTrick = useProgramStore((s) => s.moveTrick);
  const copyTrick = useProgramStore((s) => s.copyTrick);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  const altHeldRef = useRef(false);
  const [altHeld, setAltHeld] = useState(false);
  useEffect(() => {
    function sync(e: KeyboardEvent) {
      altHeldRef.current = e.altKey;
      setAltHeld(e.altKey);
    }
    function clear() {
      altHeldRef.current = false;
      setAltHeld(false);
    }
    window.addEventListener('keydown', sync);
    window.addEventListener('keyup', sync);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', sync);
      window.removeEventListener('keyup', sync);
      window.removeEventListener('blur', clear);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DragData | undefined;
    if (!data) return;
    setActiveDrag({
      type: data.type,
      id: data.type === 'palette' ? data.manoeuvreId! : data.trickId!,
    });
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    const over = e.over;
    if (!over) return;
    const overData = over.data.current as DropData | undefined;
    if (!overData) return;
    const data = e.active.data.current as DragData;
    if (data.type === 'palette' && data.manoeuvreId) {
      addTrick(overData.runIndex, data.manoeuvreId, overData.insertIndex);
      opts.onPaletteAddCommit(data.manoeuvreId);
    } else if (data.type === 'cell' && data.trickId) {
      const activator = e.activatorEvent as { altKey?: boolean } | null;
      if (altHeldRef.current || activator?.altKey) {
        copyTrick(data.trickId, overData.runIndex, overData.insertIndex);
      } else {
        moveTrick(data.trickId, overData.runIndex, overData.insertIndex);
      }
    }
  }

  return { sensors, activeDrag, altHeld, onDragStart, onDragEnd };
}
