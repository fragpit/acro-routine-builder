import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { MANOEUVRES_BY_ID } from '../data/manoeuvres';
import { runTechnicity } from '../scoring/technicity';
import { runBonus, runScaledBonus } from '../scoring/bonus';
import { runBonusUsage } from '../scoring/bonus-usage';
import { exclusionsByTrick } from '../scoring/eligibility';
import { runScoreBreakdown } from '../scoring/final-score';
import { programTechnicalQuality } from '../scoring/technical-marks';
import { unrewardedBonusesByTrick } from '../rules/repeated-bonus';
import { runSymmetry } from '../rules/validators/symmetry';
import { useProgramStore } from '../store/program-store';
import { useScoreSettings } from '../store/score-settings';
import { STORAGE_KEYS } from '../store/storage-keys';
import TrickInfoCard from './TrickInfoCard';
import NotesEditor from './NotesEditor';
import ViolationsPanel from './ViolationsPanel';
import DesktopMenu from './DesktopMenu';
import BuilderMobile from './mobile/BuilderMobile';
import { useIsMobile } from '../hooks/useIsMobile';
import { useBonusMalusPerRun, useViolationHighlights } from '../hooks/useScoringDerived';
import { useScoreDelta } from '../hooks/useScoreDelta';
import { useProgramDnd } from '../hooks/useProgramDnd';
import { useTrickPalette } from '../hooks/useTrickPalette';
import { useHasTouchInput } from '../hooks/useHasTouchInput';
import { useFullscreen } from '../hooks/useFullscreen';
import ScoreDelta from './ScoreDelta';
import TechnicalAverage from './TechnicalAverage';
import {
  IconUndo,
  IconRedo,
  IconMenu,
  IconNote,
  IconPanelLeft,
  IconMaximize,
  IconMinimize,
} from './icons';
import { PaletteCard, PaletteCardPresentation } from './builder/PaletteCard';
import { RunColumn } from './builder/RunColumn';
import { closestStripInPointerRun } from './builder/collision';

export default function Builder() {
  const isMobile = useIsMobile();
  if (isMobile) return <BuilderMobile />;
  return <BuilderDesktop />;
}

function BuilderDesktop() {
  const hasTouchInput = useHasTouchInput();
  const { isFullscreen, isStandalone, toggleFullscreen } = useFullscreen();
  const [fullscreenHelpOpen, setFullscreenHelpOpen] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEYS.paletteCollapsed) === 'true';
  });
  const program = useProgramStore((s) => s.program);
  const violations = useProgramStore((s) => s.violations);
  const currentName = useProgramStore((s) => s.currentName);
  const resetRun = useProgramStore((s) => s.resetRun);
  const duplicateRun = useProgramStore((s) => s.duplicateRun);
  const resetProgram = useProgramStore((s) => s.resetProgram);
  const undo = useProgramStore((s) => s.undo);
  const redo = useProgramStore((s) => s.redo);
  const canUndo = useProgramStore((s) => s.past.length > 0);
  const canRedo = useProgramStore((s) => s.future.length > 0);
  const selectedTrickId = useProgramStore((s) => s.selectedTrickId);
  const selectTrick = useProgramStore((s) => s.selectTrick);
  const distribution = useScoreSettings((s) => s.distribution);
  const quality = useScoreSettings((s) => s.quality);

  const {
    paletteFilter,
    setPaletteFilter,
    sortDir,
    toggleSort,
    sortedAvailable,
    recentAvailable,
    pushRecent,
  } = useTrickPalette();

  const {
    sensors,
    activeDrag,
    copyModeTrickId,
    copying,
    toggleCopyMode,
    clearCopyMode,
    onDragStart,
    onDragEnd,
    onDragCancel,
  } = useProgramDnd({ onPaletteAddCommit: pushRecent });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        clearCopyMode();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        clearCopyMode();
        redo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, clearCopyMode]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [duplicateSourceRunIndex, setDuplicateSourceRunIndex] = useState<number | null>(null);
  const hasNotes = program.notes.trim().length > 0;
  const technicalMarksByManoeuvreId = useMemo(
    () => program.technicalMarksByManoeuvreId ?? {},
    [program.technicalMarksByManoeuvreId],
  );

  function openNotes() {
    selectTrick(null);
    setNotesOpen(true);
  }

  function togglePalette() {
    setPaletteCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem(STORAGE_KEYS.paletteCollapsed, String(next));
      return next;
    });
  }

  async function handleFullscreen() {
    if (!await toggleFullscreen()) setFullscreenHelpOpen(true);
  }

  function handleSelectTrick(id: string | null) {
    selectTrick(id);
    if (id) setNotesOpen(false);
  }

  function handleDuplicateRun(targetRunIndex: number) {
    if (duplicateSourceRunIndex === null || duplicateSourceRunIndex === targetRunIndex) return;
    const target = program.runs[targetRunIndex];
    if (target.tricks.length > 0 && !confirm(`Overwrite run ${targetRunIndex + 1}?`)) return;
    clearCopyMode();
    duplicateRun(duplicateSourceRunIndex, targetRunIndex);
    setDuplicateSourceRunIndex(null);
  }

  const selectedTrick = useMemo(() => {
    if (!selectedTrickId) return null;
    for (const r of program.runs) {
      const t = r.tricks.find((x) => x.id === selectedTrickId);
      if (t) return t;
    }
    return null;
  }, [selectedTrickId, program.runs]);

  const highlights = useViolationHighlights(violations);
  const bonusMalusPerRun = useBonusMalusPerRun(violations);

  const programTotal = useMemo(() => {
    const hasTricks = program.runs.some((r) => r.tricks.length > 0);
    if (!hasTricks) return null;
    let total = 0;
    for (let i = 0; i < program.runs.length; i++) {
      const run = program.runs[i];
      if (run.tricks.length === 0) continue;
      const sym = runSymmetry(run.tricks, MANOEUVRES_BY_ID);
      const malus = bonusMalusPerRun[i] ?? 0;
      const bd = runScoreBreakdown(
        run,
        MANOEUVRES_BY_ID,
        sym,
        malus,
        distribution,
        quality,
        technicalMarksByManoeuvreId,
      );
      total += bd.total;
    }
    return { total: Math.ceil(total * 1000) / 1000 };
  }, [program, distribution, quality, technicalMarksByManoeuvreId, bonusMalusPerRun]);

  const technicalAverage = useMemo(
    () => programTechnicalQuality(
      program,
      MANOEUVRES_BY_ID,
      technicalMarksByManoeuvreId,
      quality,
    ),
    [program, technicalMarksByManoeuvreId, quality],
  );

  const { delta: scoreDelta, isPinned: scorePinned, togglePin: toggleScorePin } =
    useScoreDelta(programTotal?.total ?? null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestStripInPointerRun}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex h-full min-h-0">
        {!paletteCollapsed && (
          <aside className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase text-slate-500">Palette</div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
                    title="Toggle sort direction"
                  >
                    coeff {sortDir === 'asc' ? '↑' : '↓'}
                  </button>
                  <button
                    type="button"
                    onClick={togglePalette}
                    title="Collapse palette"
                    aria-label="Collapse palette"
                    className="w-7 h-7 touch-manipulation inline-flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <IconPanelLeft />
                  </button>
                </div>
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
              {recentAvailable.length > 0 && (
                <>
                  <div className="px-1 pt-0.5 pb-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Recent
                  </div>
                  {recentAvailable.map((m) => (
                    <PaletteCard key={`recent_${m.id}`} manoeuvre={m} recent />
                  ))}
                  <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                </>
              )}
              {sortedAvailable.map((m) => (
                <PaletteCard key={m.id} manoeuvre={m} />
              ))}
            </div>
          </aside>
        )}

        <section className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-4 text-sm">
            {paletteCollapsed && (
              <button
                type="button"
                onClick={togglePalette}
                title="Show palette"
                aria-label="Show palette"
                className="w-7 h-7 shrink-0 touch-manipulation inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
              >
                <IconPanelLeft />
              </button>
            )}
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span
                className="text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-0 truncate"
                title={currentName ?? 'Unsaved program'}
              >
                {currentName ?? <span className="italic font-normal text-slate-400">Untitled</span>}
              </span>
              <button
                type="button"
                onClick={openNotes}
                aria-label="Open program notes"
                title={hasNotes ? 'Edit program notes' : 'Add program notes'}
                className={`shrink-0 inline-flex items-center justify-center ${
                  hasNotes
                    ? 'text-sky-600 dark:text-sky-400 hover:text-sky-500'
                    : 'text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400'
                }`}
              >
                <IconNote className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {programTotal && (
                <button
                  type="button"
                  onClick={toggleScorePin}
                  className="flex items-center gap-1.5 text-sm cursor-pointer rounded px-1 -mx-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title={
                    scorePinned
                      ? 'Pinned baseline. Click to unpin.'
                      : 'Click to pin a comparison baseline.'
                  }
                >
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">Score</span>
                  <span className="font-mono font-semibold text-sky-700 dark:text-sky-300">
                    {programTotal.total.toFixed(3)}
                  </span>
                  <ScoreDelta delta={scoreDelta} />
                </button>
              )}
              <TechnicalAverage value={technicalAverage} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCopyMode();
                    undo();
                  }}
                  disabled={!canUndo}
                  title="Undo (Cmd/Ctrl+Z)"
                  aria-label="Undo"
                  className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600 disabled:hover:text-slate-600 dark:disabled:hover:text-slate-300"
                >
                  <IconUndo />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearCopyMode();
                    redo();
                  }}
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
                    if (confirm('Clear all tricks from every run?')) {
                      clearCopyMode();
                      resetProgram();
                    }
                  }}
                  className="px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400"
                >
                  Reset all
                </button>
                {!isStandalone && (
                  <button
                    type="button"
                    onClick={handleFullscreen}
                    title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                    aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                    className="w-7 h-7 touch-manipulation inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
                  >
                    {isFullscreen ? <IconMinimize /> : <IconMaximize />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearCopyMode();
                    setMenuOpen(true);
                  }}
                  title="Open menu"
                  aria-label="Open menu"
                  className="w-7 h-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  <IconMenu />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {duplicateSourceRunIndex !== null && (
              <div className="mx-4 mt-3 flex items-center gap-3 rounded border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 px-3 py-2 text-xs text-sky-800 dark:text-sky-200">
                <span className="flex-1">
                  Duplicating run {duplicateSourceRunIndex + 1}. Choose another run to insert it.
                </span>
                <button
                  type="button"
                  onClick={() => setDuplicateSourceRunIndex(null)}
                  className="px-2 py-0.5 rounded border border-sky-400 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-white dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}
            <div
              className="grid gap-3 p-4"
              style={{ gridTemplateColumns: `repeat(${program.runs.length}, minmax(220px, 1fr))` }}
            >
              {program.runs.map((run, runIndex) => (
                <RunColumn
                  key={run.id}
                  run={run}
                  runIndex={runIndex}
                  tricks={run.tricks}
                  technicity={runTechnicity(run, MANOEUVRES_BY_ID)}
                  bonus={runBonus(run, MANOEUVRES_BY_ID)}
                  scaledBonus={runScaledBonus(
                    run,
                    MANOEUVRES_BY_ID,
                    technicalMarksByManoeuvreId,
                    quality,
                  )}
                  bonusUsage={runBonusUsage(run, MANOEUVRES_BY_ID)}
                  bonusMalus={bonusMalusPerRun[runIndex] ?? 0}
                  symmetry={runSymmetry(run.tricks, MANOEUVRES_BY_ID)}
                  distribution={distribution}
                  quality={quality}
                  technicalMarksByManoeuvreId={technicalMarksByManoeuvreId}
                  highlights={highlights}
                  ignored={exclusionsByTrick(run, MANOEUVRES_BY_ID)}
                  unrewardedBonuses={unrewardedBonusesByTrick(run, MANOEUVRES_BY_ID)}
                  onSelectTrick={handleSelectTrick}
                  selectedTrickId={selectedTrickId}
                  showCopyMode={hasTouchInput}
                  copyModeTrickId={copyModeTrickId}
                  onToggleCopyMode={toggleCopyMode}
                  onReset={() => {
                    clearCopyMode();
                    resetRun(runIndex);
                  }}
                  onDuplicate={() => setDuplicateSourceRunIndex(runIndex)}
                  duplicateMode={duplicateSourceRunIndex !== null}
                  isDuplicateSource={duplicateSourceRunIndex === runIndex}
                  onInsertDuplicate={() => handleDuplicateRun(runIndex)}
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
        {!selectedTrick && notesOpen && (
          <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex">
            <NotesEditor onDone={() => setNotesOpen(false)} />
          </aside>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag?.type === 'palette' && MANOEUVRES_BY_ID[activeDrag.id] && (
          <PaletteCardPresentation manoeuvre={MANOEUVRES_BY_ID[activeDrag.id]} />
        )}
        {activeDrag?.type === 'cell' && (
          <div
            className={`px-2 py-1 rounded text-sm text-white ${copying ? 'bg-emerald-700' : 'bg-sky-700'}`}
          >
            {copying ? 'Copying...' : 'Moving...'}
          </div>
        )}
      </DragOverlay>

      <DesktopMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {fullscreenHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setFullscreenHelpOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fullscreen-help-title"
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="fullscreen-help-title" className="text-base font-semibold">
              Full screen on iPad
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              This browser does not allow the page to hide its tabs and address bar directly.
              Install ARB as a web app instead:
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>Tap Chrome's Share button.</li>
              <li>Choose Add to Home Screen.</li>
              <li>Open Acro Routine Builder from the Home Screen.</li>
            </ol>
            <button
              type="button"
              onClick={() => setFullscreenHelpOpen(false)}
              className="mt-5 w-full rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </DndContext>
  );
}
