import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';
import { BONUS_CATALOG, MANOEUVRES, MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { MAX_RUNS } from '../data/competition-types';
import { runTechnicity } from '../scoring/technicity';
import { runBonus } from '../scoring/bonus';
import { runBonusUsage, BONUS_LIMITS } from '../scoring/bonus-usage';
import { exclusionsByTrick } from '../scoring/eligibility';
import { unrewardedBonusesByTrick } from '../rules/repeated-bonus';
import { runSymmetry } from '../rules/validators/symmetry';
import { useProgramStore } from '../store/program-store';
import type { Manoeuvre, PlacedTrick } from '../rules/types';
import TrickInfoCard from './TrickInfoCard';
import ViolationsPanel from './ViolationsPanel';
import TrickCell from './TrickCell';
import ProgramControls from './ProgramControls';
import ConstructorMobile from './mobile/ConstructorMobile';
import { useIsMobile } from '../hooks/useIsMobile';
import { IconUndo, IconRedo } from './icons';

export default function Constructor() {
  const isMobile = useIsMobile();
  if (isMobile) return <ConstructorMobile />;
  return <ConstructorDesktop />;
}

function ConstructorDesktop() {
  const program = useProgramStore((s) => s.program);
  const violations = useProgramStore((s) => s.violations);
  const addTrick = useProgramStore((s) => s.addTrick);
  const moveTrick = useProgramStore((s) => s.moveTrick);
  const copyTrick = useProgramStore((s) => s.copyTrick);
  const setRunCount = useProgramStore((s) => s.setRunCount);
  const setAwtMode = useProgramStore((s) => s.setAwtMode);
  const setRepeatAfterRuns = useProgramStore((s) => s.setRepeatAfterRuns);
  const setDefaultBonuses = useProgramStore((s) => s.setDefaultBonuses);
  const resetRun = useProgramStore((s) => s.resetRun);
  const resetProgram = useProgramStore((s) => s.resetProgram);
  const undo = useProgramStore((s) => s.undo);
  const redo = useProgramStore((s) => s.redo);
  const canUndo = useProgramStore((s) => s.past.length > 0);
  const canRedo = useProgramStore((s) => s.future.length > 0);
  const selectedTrickId = useProgramStore((s) => s.selectedTrickId);
  const selectTrick = useProgramStore((s) => s.selectTrick);

  const [activeDrag, setActiveDrag] = useState<{ type: 'palette' | 'cell'; id: string } | null>(null);
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

  const [defaultBonusesOpen, setDefaultBonusesOpen] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const sortedAvailable = useMemo(
    () =>
      [...MANOEUVRES]
        .filter((m) => m.name.toLowerCase().includes(paletteFilter.toLowerCase()))
        .sort((a, b) => (sortDir === 'asc' ? a.coefficient - b.coefficient : b.coefficient - a.coefficient)),
    [paletteFilter, sortDir],
  );

  const selectedTrick = useMemo(() => {
    if (!selectedTrickId) return null;
    for (const r of program.runs) {
      const t = r.tricks.find((x) => x.id === selectedTrickId);
      if (t) return t;
    }
    return null;
  }, [selectedTrickId, program.runs]);

  const highlights = useMemo(() => {
    const map = new Map<string, 'error' | 'warning'>();
    for (const v of violations) {
      for (const c of v.affectedCells) {
        const key = `${c.runIndex}:${c.trickIndex}`;
        if (v.severity === 'error' || !map.has(key)) map.set(key, v.severity);
      }
    }
    return map;
  }, [violations]);

  const choreoPenaltyPerRun = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const v of violations) {
      if (!v.choreoPenaltyByRun) continue;
      for (const [runIndex, pct] of Object.entries(v.choreoPenaltyByRun)) {
        const i = Number(runIndex);
        totals[i] = (totals[i] ?? 0) + pct;
      }
    }
    return totals;
  }, [violations]);

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as { type: 'palette' | 'cell'; manoeuvreId?: string; trickId?: string } | undefined;
    if (!data) return;
    setActiveDrag({ type: data.type, id: data.type === 'palette' ? data.manoeuvreId! : data.trickId! });
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    const over = e.over;
    if (!over) return;
    const overData = over.data.current as { runIndex: number; insertIndex: number } | undefined;
    if (!overData) return;
    const data = e.active.data.current as { type: 'palette' | 'cell'; manoeuvreId?: string; trickId?: string };
    if (data.type === 'palette' && data.manoeuvreId) {
      addTrick(overData.runIndex, data.manoeuvreId, overData.insertIndex);
    } else if (data.type === 'cell' && data.trickId) {
      const activator = e.activatorEvent as { altKey?: boolean } | null;
      if (altHeldRef.current || activator?.altKey) {
        copyTrick(data.trickId, overData.runIndex, overData.insertIndex);
      } else {
        moveTrick(data.trickId, overData.runIndex, overData.insertIndex);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={prioritizeSmallestDroppable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full min-h-0">
        <aside className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase text-slate-500">Palette</div>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
                title="Toggle sort direction"
              >
                coeff {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <input
              type="text"
              value={paletteFilter}
              onChange={(e) => setPaletteFilter(e.target.value)}
              placeholder="search..."
              className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedAvailable.map((m) => (
              <PaletteCard key={m.id} manoeuvre={m} />
            ))}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-4 text-sm">
            <ProgramControls />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              Runs:
              <input
                type="number"
                min={1}
                max={MAX_RUNS}
                value={program.runs.length}
                onChange={(e) => setRunCount(Math.max(1, Math.min(MAX_RUNS, Number(e.target.value))))}
                className="w-14 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </label>
            <label
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
              title="Repetition tracker resets every N runs. 0 = never resets. 2 = blocks [1,2], [3,4], [5]..."
            >
              Reset gap:
              <input
                type="number"
                min={0}
                max={99}
                value={program.repeatAfterRuns}
                onChange={(e) => setRepeatAfterRuns(Math.max(0, Math.min(99, Number(e.target.value))))}
                className="w-16 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </label>
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300" title="Enable AWT-specific rules (Misty to Misty forbidden)">
              <input
                type="checkbox"
                checked={program.awtMode}
                onChange={(e) => setAwtMode(e.target.checked)}
              />
              AWT mode
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDefaultBonusesOpen((v) => !v)}
                className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                title="Bonuses auto-applied to every newly added trick (when compatible)"
              >
                Default bonuses
                {program.defaultBonuses.length > 0 && (
                  <span className="ml-1 text-xs text-sky-600 dark:text-sky-400">
                    ({program.defaultBonuses.length})
                  </span>
                )}
              </button>
              {defaultBonusesOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDefaultBonusesOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-2 space-y-1 max-h-72 overflow-y-auto">
                    {BONUS_CATALOG.map((b) => {
                      const checked = program.defaultBonuses.includes(b.id);
                      return (
                        <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? program.defaultBonuses.filter((x) => x !== b.id)
                                : [...program.defaultBonuses, b.id];
                              setDefaultBonuses(next);
                            }}
                          />
                          {b.label}
                        </label>
                      );
                    })}
                    {program.defaultBonuses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDefaultBonuses([])}
                        className="w-full mt-1 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-red-500 hover:text-red-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Cmd/Ctrl+Z)"
                aria-label="Undo"
                className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600 disabled:hover:text-slate-600 dark:disabled:hover:text-slate-300"
              >
                <IconUndo />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Cmd/Ctrl+Shift+Z)"
                aria-label="Redo"
                className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600 disabled:hover:text-slate-600 dark:disabled:hover:text-slate-300"
              >
                <IconRedo />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all tricks from every run?')) resetProgram();
                }}
                className="px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400"
              >
                Reset all
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div
              className="grid gap-3 p-4"
              style={{ gridTemplateColumns: `repeat(${program.runs.length}, minmax(220px, 1fr))` }}
            >
              {program.runs.map((run, runIndex) => (
                <RunColumn
                  key={run.id}
                  runIndex={runIndex}
                  tricks={run.tricks}
                  technicity={runTechnicity(run, MANOEUVRES_BY_ID)}
                  bonus={runBonus(run, MANOEUVRES_BY_ID)}
                  bonusUsage={runBonusUsage(run, MANOEUVRES_BY_ID)}
                  awtMode={program.awtMode}
                  choreoPenalty={choreoPenaltyPerRun[runIndex] ?? 0}
                  symmetry={runSymmetry(run.tricks, MANOEUVRES_BY_ID)}
                  highlights={highlights}
                  ignored={exclusionsByTrick(run, MANOEUVRES_BY_ID)}
                  unrewardedBonuses={unrewardedBonusesByTrick(run, MANOEUVRES_BY_ID)}
                  onSelectTrick={selectTrick}
                  selectedTrickId={selectedTrickId}
                  onReset={() => resetRun(runIndex)}
                />
              ))}
            </div>
          </div>
          <ViolationsPanel />
        </section>

        {selectedTrick && (
          <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
            <TrickInfoCard
              manoeuvre={MANOEUVRES_BY_ID[selectedTrick.manoeuvreId]}
              placedTrick={selectedTrick}
              onClose={() => selectTrick(null)}
            />
          </aside>
        )}
      </div>

      <DragOverlay>
        {activeDrag?.type === 'palette' && MANOEUVRES_BY_ID[activeDrag.id] && (
          <PaletteCardPresentation manoeuvre={MANOEUVRES_BY_ID[activeDrag.id]} />
        )}
        {activeDrag?.type === 'cell' && (
          <div
            className={`px-2 py-1 rounded text-sm text-white ${altHeld ? 'bg-emerald-700' : 'bg-sky-700'}`}
          >
            {altHeld ? 'Copying...' : 'Moving...'}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function PaletteCardPresentation({ manoeuvre }: { manoeuvre: Manoeuvre }) {
  return (
    <div className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm cursor-grab active:cursor-grabbing select-none flex justify-between shadow-md">
      <span>{manoeuvre.name}</span>
      <span className="text-slate-500 dark:text-slate-400">{manoeuvre.coefficient.toFixed(2)}</span>
    </div>
  );
}

function PaletteCard({ manoeuvre }: { manoeuvre: Manoeuvre }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette_${manoeuvre.id}`,
    data: { type: 'palette', manoeuvreId: manoeuvre.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm cursor-grab active:cursor-grabbing select-none flex justify-between ${isDragging ? 'opacity-40' : ''} hover:border-sky-500`}
    >
      <span className="truncate">{manoeuvre.name}</span>
      <span className="text-slate-500 dark:text-slate-400 ml-2 shrink-0">{manoeuvre.coefficient.toFixed(2)}</span>
    </div>
  );
}

function RunColumn({
  runIndex,
  tricks,
  technicity,
  bonus,
  bonusUsage,
  awtMode,
  choreoPenalty,
  symmetry,
  highlights,
  ignored,
  unrewardedBonuses,
  onSelectTrick,
  selectedTrickId,
  onReset,
}: {
  runIndex: number;
  tricks: PlacedTrick[];
  technicity: number;
  bonus: number;
  bonusUsage: ReturnType<typeof runBonusUsage>;
  awtMode: boolean;
  choreoPenalty: number;
  symmetry: ReturnType<typeof runSymmetry>;
  highlights: Map<string, 'error' | 'warning'>;
  ignored: Map<string, string[]>;
  unrewardedBonuses: Map<string, Set<string>>;
  onSelectTrick: (id: string | null) => void;
  selectedTrickId: string | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[200px]">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
        <span>Run {runIndex + 1}</span>
        {tricks.length > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-normal text-slate-500 hover:text-red-600 dark:hover:text-red-400"
            title="Clear this run"
          >
            reset
          </button>
        )}
      </div>
      <RunDropArea runIndex={runIndex} insertIndex={tricks.length}>
        {tricks.length === 0 ? (
          <EmptyDropZone runIndex={runIndex} />
        ) : (
          <>
            <DropZone runIndex={runIndex} insertIndex={0} />
            {tricks.map((t, i) => (
              <div key={t.id}>
                <TrickCell
                  trick={t}
                  runIndex={runIndex}
                  trickIndex={i}
                  highlight={highlights.get(`${runIndex}:${i}`) ?? 'none'}
                  selected={selectedTrickId === t.id}
                  ignoredReasons={ignored.get(t.id)}
                  unrewardedBonuses={unrewardedBonuses.get(t.id)}
                  onSelect={() => onSelectTrick(t.id)}
                />
                <DropZone runIndex={runIndex} insertIndex={i + 1} />
              </div>
            ))}
          </>
        )}
      </RunDropArea>
      {tricks.length > 0 && (
        <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
          <div className="flex justify-between" title="Technicity: average of the 3 highest coefficients (max 2 above 1.95)">
            <span>TC</span>
            <span className="font-mono">{technicity.toFixed(3)}</span>
          </div>
          <div
            className="flex justify-between"
            title={
              awtMode
                ? 'Upper bound: AWT scales each bonus by the trick technical mark (bonus * T / 10). Shown value assumes T=10 for every trick.'
                : 'AWQ: sum of selected bonus percents (no technical-mark scaling).'
            }
          >
            <span>Bonus{awtMode ? ' ≤' : ''}</span>
            <span className="font-mono">+{bonus.toFixed(1)}%</span>
          </div>
          <div
            className="flex justify-between text-slate-500 dark:text-slate-400"
            title="Bonus category slots used per run (FAI 3.5: max 5 twisted / 3 reversed / 2 flipped). Extras are unscored."
          >
            <span>Slots</span>
            <span className="font-mono flex gap-2">
              <BonusSlot label="T" used={bonusUsage.twisted} limit={BONUS_LIMITS.twisted} />
              <BonusSlot label="R" used={bonusUsage.reversed} limit={BONUS_LIMITS.reversed} />
              <BonusSlot label="F" used={bonusUsage.flipped} limit={BONUS_LIMITS.flipped} />
            </span>
          </div>
          {choreoPenalty > 0 && (
            <div
              className="flex justify-between text-amber-600 dark:text-amber-400"
              title="Choreography mark deduction from repetitions in this run (FAI 3.3.3)"
            >
              <span>Choreo</span>
              <span className="font-mono">-{choreoPenalty}%</span>
            </div>
          )}
          <div
            className={`flex justify-between ${
              symmetry.balanced
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
            title="Trick directions balance (1/8) - same number of tricks in both directions. Odd number: difference of 1 is OK"
          >
            <span>Choreo(sym)</span>
            <span className="font-mono">{symmetry.balanced ? '+1' : '+0'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BonusSlot({ label, used, limit }: { label: string; used: number; limit: number }) {
  const over = used > limit;
  const full = used === limit;
  const cls = over
    ? 'text-red-600 dark:text-red-400'
    : full
      ? 'text-amber-600 dark:text-amber-400'
      : '';
  return (
    <span className={cls}>
      {label} {used}/{limit}
    </span>
  );
}

/**
 * When multiple droppables overlap (inner between-trick zones sit on top of the
 * whole run column), prefer the one with the smallest rect. This lets a pilot
 * drop onto any empty space in a run to append, while still hitting the
 * precise between-trick slots when aimed carefully.
 */
const prioritizeSmallestDroppable: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) {
    return [...pointer].sort((a, b) => {
      const ra = args.droppableRects.get(a.id);
      const rb = args.droppableRects.get(b.id);
      const areaA = ra ? ra.width * ra.height : Infinity;
      const areaB = rb ? rb.width * rb.height : Infinity;
      return areaA - areaB;
    });
  }
  return rectIntersection(args);
};

function RunDropArea({
  runIndex,
  insertIndex,
  children,
}: {
  runIndex: number;
  insertIndex: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop_run_${runIndex}`,
    data: { runIndex, insertIndex },
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

function EmptyDropZone({ runIndex }: { runIndex: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop_${runIndex}_0`,
    data: { runIndex, insertIndex: 0 },
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

function DropZone({ runIndex, insertIndex }: { runIndex: number; insertIndex: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop_${runIndex}_${insertIndex}`,
    data: { runIndex, insertIndex },
  });
  return (
    <div
      ref={setNodeRef}
      className={`h-1.5 rounded transition-all ${isOver ? 'h-8 bg-sky-500/20 border border-dashed border-sky-400' : ''}`}
    />
  );
}

// ensure MANOEUVRES referenced so bundler keeps it for tree-shake debug (no-op)
void MANOEUVRES;
