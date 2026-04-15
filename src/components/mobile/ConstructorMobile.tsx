import { useMemo, useState } from 'react';
import { useProgramStore } from '../../store/program-store';
import PaletteStrip from './PaletteStrip';
import RunSwiper from './RunSwiper';
import RunMobile from './RunMobile';
import TrickSheet from './TrickSheet';
import ViolationsBar from './ViolationsBar';
import MobileMenu from './MobileMenu';

export default function ConstructorMobile() {
  const program = useProgramStore((s) => s.program);
  const violations = useProgramStore((s) => s.violations);
  const currentName = useProgramStore((s) => s.currentName);
  const addTrick = useProgramStore((s) => s.addTrick);
  const moveTrick = useProgramStore((s) => s.moveTrick);
  const copyTrick = useProgramStore((s) => s.copyTrick);
  const resetRun = useProgramStore((s) => s.resetRun);

  const [armedManoeuvreId, setArmedManoeuvreId] = useState<string | null>(null);
  const [armedMoveTrickId, setArmedMoveTrickId] = useState<string | null>(null);
  const [armedCopyTrickId, setArmedCopyTrickId] = useState<string | null>(null);
  const [activeRunIndex, setActiveRunIndex] = useState(0);
  const [sheetTrickId, setSheetTrickId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);

  function armPalette(id: string | null) {
    setArmedMoveTrickId(null);
    setArmedCopyTrickId(null);
    setArmedManoeuvreId(id);
  }
  function armMove(trickId: string) {
    setArmedManoeuvreId(null);
    setArmedCopyTrickId(null);
    setArmedMoveTrickId(trickId);
  }
  function armCopy(trickId: string) {
    setArmedManoeuvreId(null);
    setArmedMoveTrickId(null);
    setArmedCopyTrickId(trickId);
  }
  function clearArm() {
    setArmedManoeuvreId(null);
    setArmedMoveTrickId(null);
    setArmedCopyTrickId(null);
  }
  function handleInsertAt(runIndex: number, index: number) {
    if (armedManoeuvreId) {
      addTrick(runIndex, armedManoeuvreId, index);
      clearArm();
    } else if (armedMoveTrickId) {
      moveTrick(armedMoveTrickId, runIndex, index);
      clearArm();
    } else if (armedCopyTrickId) {
      copyTrick(armedCopyTrickId, runIndex, index);
      clearArm();
    }
  }

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

  const safeActive = Math.min(activeRunIndex, program.runs.length - 1);

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-900">
      <header className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {currentName ?? <span className="italic font-normal text-slate-400">Untitled</span>}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {program.awtMode ? 'AWT' : 'AWQ'} · {program.runs.length} run{program.runs.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center"
          aria-label="Open menu"
        >
          ≡
        </button>
      </header>

      <PaletteStrip armedManoeuvreId={armedManoeuvreId} onArm={armPalette} />

      {(armedMoveTrickId || armedCopyTrickId) && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-200">
          <span className="flex-1">
            {armedMoveTrickId
              ? 'Tap a slot to move the trick (any run).'
              : 'Tap a slot to copy the trick (any run).'}
          </span>
          <button
            type="button"
            onClick={clearArm}
            className="px-2 py-0.5 rounded border border-sky-400 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-white dark:hover:bg-slate-900"
          >
            Cancel
          </button>
        </div>
      )}

      <RunSwiper
        count={program.runs.length}
        activeIndex={safeActive}
        onActiveChange={setActiveRunIndex}
        renderPage={(i) => (
          <RunMobile
            run={program.runs[i]}
            runIndex={i}
            awtMode={program.awtMode}
            isArmed={!!armedManoeuvreId || !!armedMoveTrickId || !!armedCopyTrickId}
            movingTrickId={armedMoveTrickId}
            onInsertAt={handleInsertAt}
            onOpenTrick={setSheetTrickId}
            highlights={highlights}
            choreoPenalty={choreoPenaltyPerRun[i] ?? 0}
            statsExpanded={statsExpanded}
            onToggleStats={() => setStatsExpanded((v) => !v)}
          />
        )}
      />

      <div className="shrink-0 grid grid-cols-3 items-center px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 justify-self-start">
          Run {safeActive + 1}{' '}
          <span className="text-slate-400 text-xs font-normal">
            of {program.runs.length}
          </span>
        </div>
        <div
          className="flex items-center justify-center gap-1.5"
          role="tablist"
          aria-label="Run indicator"
        >
          {program.runs.length > 1 &&
            program.runs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveRunIndex(i)}
                role="tab"
                aria-selected={i === safeActive}
                aria-label={`Run ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === safeActive ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
        </div>
        <div className="justify-self-end">
          {program.runs[safeActive]?.tricks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Clear run ${safeActive + 1}?`)) resetRun(safeActive);
              }}
              className="text-xs text-slate-500 hover:text-red-500"
            >
              reset
            </button>
          )}
        </div>
      </div>

      <ViolationsBar onJumpTo={setActiveRunIndex} />

      <TrickSheet
        trickId={sheetTrickId}
        onClose={() => setSheetTrickId(null)}
        onMoveArm={(id) => {
          armMove(id);
          setSheetTrickId(null);
        }}
        onCopyArm={(id) => {
          armCopy(id);
          setSheetTrickId(null);
        }}
      />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
