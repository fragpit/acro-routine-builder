import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BONUS_CATALOG } from '../../data/manoeuvres';
import { MAX_RUNS } from '../../data/competition-types';
import { useProgramStore } from '../../store/program-store';
import { useScoreSettings } from '../../store/score-settings';
import MobileFileControls from './MobileFileControls';
import {
  isDistributionDefault,
  isQualityDefault,
  DEFAULT_QUALITY,
} from '../../scoring/final-score';
import DistributionEditor from '../DistributionEditor';
import QualityCorrectionEditor from '../QualityCorrectionEditor';
import ThemeToggle from '../ThemeToggle';
import NumberStepper from '../NumberStepper';
import FeedbackMenu from '../FeedbackMenu';

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
      <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col pr-[env(safe-area-inset-right)]">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] border-b border-slate-200 dark:border-slate-700">
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
        <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-5 text-sm">
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
            <label className="flex items-center justify-between gap-3" title="Repetition tracker resets every N runs. MAX = no repeats across the whole program.">
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
              <h3 className="text-[11px] uppercase text-slate-500">
                Score distribution
              </h3>
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
            <DistributionEditor
              distribution={distribution}
              onChange={setDistribution}
            />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] uppercase text-slate-500">
                Quality correction
              </h3>
              {!isQualityDefault(quality) && (
                <button
                  type="button"
                  onClick={() => setQuality({ ...DEFAULT_QUALITY })}
                  className="text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  reset
                </button>
              )}
            </div>
            <QualityCorrectionEditor
              quality={quality}
              onChange={setQuality}
            />
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

          <section>
            <h3 className="text-[11px] uppercase text-slate-500 mb-2">ARB (v{__APP_VERSION__})</h3>
            <div className="flex items-center gap-1.5">
              <Link
                to="/"
                onClick={onClose}
                title="Home"
                aria-label="Home"
                className="flex-1 h-9 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <path d="M3 11l9-8 9 8" />
                  <path d="M5 10v10h14V10" />
                </svg>
              </Link>
              <Link
                to="/docs/rules"
                onClick={onClose}
                title="Rules"
                className="flex-1 h-9 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
              >
                Rules
              </Link>
              <Link
                to="/docs/tricks"
                onClick={onClose}
                title="Tricks"
                className="flex-1 h-9 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
              >
                Tricks
              </Link>
              <div className="flex-1">
                <FeedbackMenu
                  triggerClassName="w-full h-9 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
                  iconSize="sm"
                  align="right"
                  direction="up"
                />
              </div>
              <ThemeToggle />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
