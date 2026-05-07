import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { BONUS_LIMITS, runBonusUsage } from '../../scoring/bonus-usage';
import { runScoreBreakdown, type ScoreDistribution, type QualityCorrection } from '../../scoring/final-score';
import { runSymmetry } from '../../rules/validators/symmetry';
import type { PlacedTrick, Run } from '../../rules/types';
import TrickCell from '../TrickCell';
import FinalScorePanel from '../FinalScorePanel';
import { DropZone, EmptyDropZone, RunDropArea } from './DropZones';

function BonusSlot({ label, used, limit }: { label: string; used: number; limit: number }) {
  const over = used > limit;
  const full = used === limit;
  const cls = over
    ? 'text-amber-600 dark:text-amber-400'
    : full
      ? 'text-emerald-600 dark:text-emerald-400'
      : '';
  return (
    <span className={cls}>
      {label} {used}/{limit}
    </span>
  );
}

export type RunColumnProps = {
  run: Run;
  runIndex: number;
  tricks: PlacedTrick[];
  technicity: number;
  bonus: number;
  bonusUsage: ReturnType<typeof runBonusUsage>;
  bonusMalus: number;
  symmetry: ReturnType<typeof runSymmetry>;
  distribution: ScoreDistribution;
  quality: QualityCorrection;
  highlights: Map<string, 'error' | 'warning'>;
  ignored: Map<string, string[]>;
  unrewardedBonuses: Map<string, Set<string>>;
  onSelectTrick: (id: string | null) => void;
  selectedTrickId: string | null;
  onReset: () => void;
};

export function RunColumn({
  run,
  runIndex,
  tricks,
  technicity,
  bonus,
  bonusUsage,
  bonusMalus,
  symmetry,
  distribution,
  quality,
  highlights,
  ignored,
  unrewardedBonuses,
  onSelectTrick,
  selectedTrickId,
  onReset,
}: RunColumnProps) {
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
          <div
            className="flex justify-between"
            title="Bonus per run: X(Y×Tq(N%))%. Y is the raw sum of selected bonus percents. Tq scales the bonus (per FAI 6.6.1 AWT per-trick technical-mark weighting); X is the effective bonus actually plugged into the score formula. The malus is NOT scaled by Tq."
          >
            <span>Bonus</span>
            <span className="font-mono">
              {(bonus * quality.technical / 100).toFixed(1)}({bonus.toFixed(1)}×Tq({quality.technical}%))%
            </span>
          </div>
          {bonusMalus > 0 && (
            <div
              className="flex justify-between text-red-600 dark:text-red-400"
              title="Malus deducted from the bonus percent for repetitions in this run (FAI 3.3.3)"
            >
              <span>Malus</span>
              <span className="font-mono">-{bonusMalus}%</span>
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
      {tricks.length > 0 && (
        <FinalScorePanel
          breakdown={runScoreBreakdown(run, MANOEUVRES_BY_ID, symmetry, bonusMalus, distribution, quality)}
          expandsDown
        />
      )}
    </div>
  );
}
