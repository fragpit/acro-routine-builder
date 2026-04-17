import { useState } from 'react';
import { BONUS_CATALOG } from '../data/manoeuvres';
import { MAX_RUNS } from '../data/competition-types';
import { useProgramStore } from '../store/program-store';
import { useScoreSettings } from '../store/score-settings';
import MobileFileControls from './mobile/MobileFileControls';
import { isDistributionDefault } from '../scoring/final-score';
import DistributionEditor from './DistributionEditor';
import QualityCorrectionEditor from './QualityCorrectionEditor';
import NumberStepper from './NumberStepper';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DesktopMenu({ open, onClose }: Props) {
  const program = useProgramStore((s) => s.program);
  const setRunCount = useProgramStore((s) => s.setRunCount);
  const setRepeatAfterRuns = useProgramStore((s) => s.setRepeatAfterRuns);
  const setDefaultBonuses = useProgramStore((s) => s.setDefaultBonuses);
  const setAwtMode = useProgramStore((s) => s.setAwtMode);
  const distribution = useScoreSettings((s) => s.distribution);
  const setDistribution = useScoreSettings((s) => s.setDistribution);
  const quality = useScoreSettings((s) => s.quality);
  const setQuality = useScoreSettings((s) => s.setQuality);
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
      <div className="relative w-96 max-w-[90vw] h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col">
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
            <MobileFileControls onImported={onClose} />
          </section>

          <section className="space-y-3">
            <h3 className="text-[11px] uppercase text-slate-500">Program settings</h3>
            <label className="flex items-center justify-between gap-3">
              <span className="text-slate-700 dark:text-slate-200">Runs</span>
              <NumberStepper
                value={program.runs.length}
                min={1}
                max={MAX_RUNS}
                onChange={setRunCount}
                ariaLabel="Runs"
              />
            </label>
            <label
              className="flex items-center justify-between gap-3"
              title="Repetition tracker resets every N runs. MAX = no repeats across the whole program."
            >
              <span className="text-slate-700 dark:text-slate-200">Reset gap</span>
              <NumberStepper
                value={program.repeatAfterRuns}
                min={1}
                max={MAX_RUNS}
                onChange={setRepeatAfterRuns}
                ariaLabel="Reset gap"
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

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] uppercase text-slate-500">Score distribution</h3>
              {!isDistributionDefault(distribution) && (
                <button
                  type="button"
                  onClick={() => setDistribution({ technical: 50, choreo: 50, landing: 0 })}
                  className="text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  reset
                </button>
              )}
            </div>
            <DistributionEditor distribution={distribution} onChange={setDistribution} />
          </section>

          <section className="space-y-2">
            <h3 className="text-[11px] uppercase text-slate-500">Quality correction</h3>
            <QualityCorrectionEditor quality={quality} onChange={setQuality} />
          </section>
        </div>
      </div>
    </div>
  );
}
