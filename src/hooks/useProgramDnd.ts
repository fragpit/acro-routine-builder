import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useProgramStore } from '../store/program-store';
import { isDragData, isDropData } from '../components/builder/drag-types';

export type ActiveDrag = { type: 'palette' | 'cell'; id: string };

/**
 * Owns the desktop builder's drag-and-drop wiring:
 * - sensors (mouse + touch with mobile-friendly delay)
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
  const [copyModeTrickId, setCopyModeTrickId] = useState<string | null>(null);

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
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current;
    if (!isDragData(data)) return;
    if (data.type === 'palette') {
      setActiveDrag({ type: 'palette', id: data.manoeuvreId });
    } else {
      if (copyModeTrickId !== data.trickId) setCopyModeTrickId(null);
      setActiveDrag({ type: 'cell', id: data.trickId });
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    const data = e.active.data.current;
    const copyModeActive = isDragData(data)
      && data.type === 'cell'
      && copyModeTrickId === data.trickId;
    if (copyModeActive) setCopyModeTrickId(null);

    const overData = e.over?.data.current;
    if (!isDropData(overData)) return;
    if (!isDragData(data)) return;

    if (data.type === 'palette') {
      addTrick(overData.runIndex, data.manoeuvreId, overData.insertIndex);
      opts.onPaletteAddCommit(data.manoeuvreId);
      return;
    }

    const activator = e.activatorEvent;
    const altFromEvent = activator instanceof KeyboardEvent || activator instanceof MouseEvent
      ? activator.altKey
      : false;
    if (copyModeActive || altHeldRef.current || altFromEvent) {
      copyTrick(data.trickId, overData.runIndex, overData.insertIndex);
    } else {
      moveTrick(data.trickId, overData.runIndex, overData.insertIndex);
    }
  }

  function onDragCancel() {
    if (activeDrag?.type === 'cell' && copyModeTrickId === activeDrag.id) {
      setCopyModeTrickId(null);
    }
    setActiveDrag(null);
  }

  const toggleCopyMode = useCallback((trickId: string) => {
    setCopyModeTrickId((current) => current === trickId ? null : trickId);
  }, []);

  const clearCopyMode = useCallback(() => {
    setCopyModeTrickId(null);
  }, []);

  const copying = altHeld
    || (activeDrag?.type === 'cell' && copyModeTrickId === activeDrag.id);

  return {
    sensors,
    activeDrag,
    copyModeTrickId,
    copying,
    toggleCopyMode,
    clearCopyMode,
    onDragStart,
    onDragEnd,
    onDragCancel,
  };
}
