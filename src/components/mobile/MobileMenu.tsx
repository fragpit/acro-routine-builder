import { useState } from 'react';
import { BONUS_CATALOG } from '../../data/manoeuvres';
import { MAX_RUNS } from '../../data/competition-types';
import { useProgramStore } from '../../store/program-store';
import MobileFileControls from './MobileFileControls';
import { IconUndo, IconRedo } from '../icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: Props) {
  const program = useProgramStore((s) => s.program);
  const setRunCount = useProgramStore((s) => s.setRunCount);
  const setRepeatAfterRuns = useProgramStore((s) => s.setRepeatAfterRuns);
  const setDefaultBonuses = useProgramStore((s) => s.setDefaultBonuses);
  const setAwtMode = useProgramStore((s) => s.setAwtMode);
  const resetProgram = useProgramStore((s) => s.resetProgram);
  const undo = useProgramStore((s) => s.undo);
  const redo = useProgramStore((s) => s.redo);
  const canUndo = useProgramStore((s) => s.past.length > 0);
  const canRedo = useProgramStore((s) => s.future.length > 0);
  const [defaultBonusesOpen, setDefaultBonusesOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60"
      />
      <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Program</div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-lg leading-none"
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          <section>
            <h3 className="text-[11px] uppercase text-slate-500 mb-2">File</h3>
            <MobileFileControls />
          </section>

          <section>
            <h3 className="text-[11px] uppercase text-slate-500 mb-2">History</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <IconUndo className="w-4 h-4" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <span>Redo</span>
                <IconRedo className="w-4 h-4" />
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[11px] uppercase text-slate-500">Program settings</h3>
            <label className="flex items-center justify-between gap-3">
              <span className="text-slate-700 dark:text-slate-200">Runs</span>
              <input
                type="number"
                min={1}
                max={MAX_RUNS}
                value={program.runs.length}
                onChange={(e) => setRunCount(Math.max(1, Math.min(MAX_RUNS, Number(e.target.value))))}
                className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </label>
            <label className="flex items-center justify-between gap-3" title="Repetition tracker resets every N runs. 0 = never.">
              <span className="text-slate-700 dark:text-slate-200">Reset gap</span>
              <input
                type="number"
                min={0}
                max={99}
                value={program.repeatAfterRuns}
                onChange={(e) => setRepeatAfterRuns(Math.max(0, Math.min(99, Number(e.target.value))))}
                className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-slate-700 dark:text-slate-200">AWT mode</span>
              <input
                type="checkbox"
                checked={program.awtMode}
                onChange={(e) => setAwtMode(e.target.checked)}
                className="w-5 h-5"
              />
            </label>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] uppercase text-slate-500">Default bonuses</h3>
              <button
                type="button"
                onClick={() => setDefaultBonusesOpen((v) => !v)}
                className="text-xs text-sky-600 dark:text-sky-400"
              >
                {defaultBonusesOpen ? 'collapse' : `edit${program.defaultBonuses.length > 0 ? ` (${program.defaultBonuses.length})` : ''}`}
              </button>
            </div>
            {defaultBonusesOpen && (
              <div className="rounded border border-slate-200 dark:border-slate-700 p-2 space-y-1 max-h-60 overflow-y-auto">
                {BONUS_CATALOG.map((b) => {
                  const checked = program.defaultBonuses.includes(b.id);
                  return (
                    <label key={b.id} className="flex items-center gap-2 py-1 cursor-pointer">
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
                      <span className="flex-1">{b.label}</span>
                    </label>
                  );
                })}
                {program.defaultBonuses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDefaultBonuses([])}
                    className="w-full mt-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-red-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-[11px] uppercase text-slate-500 mb-2">Danger zone</h3>
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all tricks from every run?')) {
                  resetProgram();
                  onClose();
                }
              }}
              className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-red-500 hover:text-red-500"
            >
              Reset all runs
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
