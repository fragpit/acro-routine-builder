import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { BONUS_LIMITS, runBonusUsage } from '../../scoring/bonus-usage';
import { runBonus } from '../../scoring/bonus';
import { runTechnicity } from '../../scoring/technicity';
import { exclusionsByTrick } from '../../scoring/eligibility';
import { unrewardedBonusesByTrick } from '../../rules/repeated-bonus';
import { runSymmetry } from '../../rules/validators/symmetry';
import type { Run } from '../../rules/types';
import { useProgramStore } from '../../store/program-store';
import TrickCellMobile from './TrickCellMobile';

interface Props {
  run: Run;
  runIndex: number;
  totalRuns: number;
  awtMode: boolean;
  isArmed: boolean;
  movingTrickId: string | null;
  onInsertAt: (runIndex: number, index: number) => void;
  onOpenTrick: (trickId: string) => void;
  highlights: Map<string, 'error' | 'warning'>;
  choreoPenalty: number;
}

export default function RunMobile({
  run,
  runIndex,
  totalRuns,
  awtMode,
  isArmed,
  movingTrickId,
  onInsertAt,
  onOpenTrick,
  highlights,
  choreoPenalty,
}: Props) {
  const resetRun = useProgramStore((s) => s.resetRun);

  const technicity = runTechnicity(run, MANOEUVRES_BY_ID);
  const bonus = runBonus(run, MANOEUVRES_BY_ID);
  const bonusUsage = runBonusUsage(run, MANOEUVRES_BY_ID);
  const ignored = exclusionsByTrick(run, MANOEUVRES_BY_ID);
  const unrewarded = unrewardedBonusesByTrick(run, MANOEUVRES_BY_ID);
  const symmetry = runSymmetry(run.tricks, MANOEUVRES_BY_ID);

  function insertAt(index: number) {
    if (!isArmed) return;
    onInsertAt(runIndex, index);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 flex items-center justify-between text-sm border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="font-semibold text-slate-800 dark:text-slate-200">
          Run {runIndex + 1} <span className="text-slate-400 text-xs font-normal">of {totalRuns}</span>
        </div>
        {run.tricks.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Clear run ${runIndex + 1}?`)) resetRun(runIndex);
            }}
            className="text-xs text-slate-500 hover:text-red-500"
          >
            reset
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {run.tricks.length === 0 ? (
          <button
            type="button"
            onClick={() => insertAt(0)}
            disabled={!isArmed}
            className={`w-full min-h-[160px] rounded border-2 border-dashed flex items-center justify-center text-sm transition-colors ${
              isArmed
                ? 'border-sky-400 bg-sky-500/10 text-sky-700 dark:text-sky-300 active:bg-sky-500/20'
                : 'border-slate-300 dark:border-slate-700 text-slate-400'
            }`}
          >
            {isArmed ? 'Tap to insert here' : 'No tricks. Pick a trick from the palette above.'}
          </button>
        ) : (
          <>
            <InsertSlot armed={isArmed} onTap={() => insertAt(0)} />
            {run.tricks.map((t, i) => (
              <div key={t.id} className="space-y-2">
                <TrickCellMobile
                  trick={t}
                  highlight={highlights.get(`${runIndex}:${i}`) ?? 'none'}
                  ignoredReasons={ignored.get(t.id)}
                  unrewardedBonuses={unrewarded.get(t.id)}
                  dimmed={movingTrickId === t.id}
                  onTap={() => onOpenTrick(t.id)}
                />
                <InsertSlot armed={isArmed} onTap={() => insertAt(i + 1)} />
              </div>
            ))}
          </>
        )}
      </div>

      {run.tricks.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="TC" value={technicity.toFixed(3)} />
            <Stat label={awtMode ? 'Bonus ≤' : 'Bonus'} value={`+${bonus.toFixed(1)}%`} />
            <Stat
              label="Sym"
              value={symmetry.balanced ? '+1' : '+0'}
              tone={symmetry.balanced ? 'ok' : 'warn'}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SlotStat label="Twisted" used={bonusUsage.twisted} max={BONUS_LIMITS.twisted} />
            <SlotStat label="Reversed" used={bonusUsage.reversed} max={BONUS_LIMITS.reversed} />
            <SlotStat label="Flipped" used={bonusUsage.flipped} max={BONUS_LIMITS.flipped} />
          </div>
          {choreoPenalty > 0 && (
            <div className="grid grid-cols-1">
              <Stat label="Choreo" value={`-${choreoPenalty}%`} tone="warn" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InsertSlot({ armed, onTap }: { armed: boolean; onTap: () => void }) {
  if (!armed) return null;
  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full h-8 rounded border border-dashed border-sky-400 bg-sky-500/10 text-[11px] text-sky-700 dark:text-sky-300 active:bg-sky-500/25"
    >
      + insert here
    </button>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'ok' | 'warn' }) {
  const valueCls =
    tone === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-800 dark:text-slate-100';
  return (
    <div className="flex flex-col items-center gap-0.5 rounded bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono text-sm ${valueCls}`}>{value}</span>
    </div>
  );
}

function SlotStat({ label, used, max }: { label: string; used: number; max: number }) {
  const over = used > max;
  const valueCls = over ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100';
  return (
    <div className="flex flex-col items-center gap-0.5 rounded bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono text-sm ${valueCls}`}>
        {used}<span className="text-slate-400 dark:text-slate-500">/{max}</span>
      </span>
    </div>
  );
}
