import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MANOEUVRES_BY_ID } from '../../data/manoeuvres';
import { BONUS_LIMITS, runBonusUsage } from '../../scoring/bonus-usage';
import { runBonus } from '../../scoring/bonus';
import { runTechnicity } from '../../scoring/technicity';
import { exclusionsByTrick } from '../../scoring/eligibility';
import { runScoreBreakdown, type ScoreDistribution, type QualityCorrection } from '../../scoring/final-score';
import { unrewardedBonusesByTrick } from '../../rules/repeated-bonus';
import { runSymmetry } from '../../rules/validators/symmetry';
import { useProgramStore } from '../../store/program-store';
import type { Run } from '../../rules/types';
import TrickCellMobile from './TrickCellMobile';
import FinalScorePanel from '../FinalScorePanel';

interface Props {
  run: Run;
  runIndex: number;
  isArmed: boolean;
  movingTrickId: string | null;
  onInsertAt: (runIndex: number, index: number) => void;
  onOpenTrick: (trickId: string) => void;
  onResetRun: (runIndex: number) => void;
  highlights: Map<string, 'error' | 'warning'>;
  bonusMalus: number;
  distribution: ScoreDistribution;
  quality: QualityCorrection;
  statsExpanded: boolean;
  onToggleStats: () => void;
}

export default function RunMobile({
  run,
  runIndex,
  isArmed,
  movingTrickId,
  onInsertAt,
  onOpenTrick,
  onResetRun,
  highlights,
  bonusMalus,
  distribution,
  quality,
  statsExpanded,
  onToggleStats,
}: Props) {
  const moveTrick = useProgramStore((s) => s.moveTrick);
  const technicity = runTechnicity(run, MANOEUVRES_BY_ID);
  const bonus = runBonus(run, MANOEUVRES_BY_ID);
  const bonusUsage = runBonusUsage(run, MANOEUVRES_BY_ID);
  const ignored = exclusionsByTrick(run, MANOEUVRES_BY_ID);
  const unrewarded = unrewardedBonusesByTrick(run, MANOEUVRES_BY_ID);
  const symmetry = runSymmetry(run.tricks, MANOEUVRES_BY_ID);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 4 } }),
  );

  function insertAt(index: number) {
    if (!isArmed) return;
    onInsertAt(runIndex, index);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = run.tricks.findIndex((t) => t.id === active.id);
    const newIndex = run.tricks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const toIndex = oldIndex < newIndex ? newIndex + 1 : newIndex;
    moveTrick(String(active.id), runIndex, toIndex);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
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
            <DndContext sensors={sensors} onDragEnd={onDragEnd} autoScroll={false}>
              <SortableContext
                items={run.tricks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <InsertSlot armed={isArmed} onTap={() => insertAt(0)} />
                {run.tricks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <TrickCellMobile
                        trick={t}
                        highlight={highlights.get(`${runIndex}:${i}`) ?? 'none'}
                        ignoredReasons={ignored.get(t.id)}
                        unrewardedBonuses={unrewarded.get(t.id)}
                        dimmed={movingTrickId === t.id}
                        sortDisabled={isArmed}
                        onTap={() => onOpenTrick(t.id)}
                      />
                    </div>
                    <InsertAfterButton
                      armed={isArmed}
                      onTap={() => insertAt(i + 1)}
                      position={i + 2}
                    />
                  </div>
                ))}
              </SortableContext>
            </DndContext>
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Clear run ${runIndex + 1}?`)) onResetRun(runIndex);
                }}
                className="text-xs text-slate-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40"
              >
                reset run
              </button>
            </div>
          </>
        )}
      </div>

      {run.tricks.length > 0 && (
        statsExpanded ? (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={onToggleStats}
              aria-label="Collapse stats"
              aria-expanded
              className="w-full flex flex-col gap-1.5 text-left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="self-center w-4 h-4 text-slate-400 dark:text-slate-500"
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span className="grid grid-cols-4 gap-2">
              <Stat label="TC" value={technicity.toFixed(3)} />
              <Stat
                label="Bonus"
                value={`${(bonus * quality.technical / 100).toFixed(1)}%`}
              />
              <Stat
                label="Sym"
                value={symmetry.balanced ? '+1' : '+0'}
                tone={symmetry.balanced ? 'ok' : 'warn'}
              />
              <SlotStat label="Twisted" used={bonusUsage.twisted} max={BONUS_LIMITS.twisted} />
              <SlotStat label="Reversed" used={bonusUsage.reversed} max={BONUS_LIMITS.reversed} />
              <SlotStat label="Flipped" used={bonusUsage.flipped} max={BONUS_LIMITS.flipped} />
              {bonusMalus > 0 && (
                <Stat label="Malus" value={`-${bonusMalus}%`} tone="error" />
              )}
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleStats}
            aria-label="Expand stats"
            aria-expanded={false}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200"
          >
            <span className="font-mono shrink-0">
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mr-1.5">
                TC
              </span>
              {technicity.toFixed(3)}
            </span>
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono truncate">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mr-1.5">
                  Bonus
                </span>
                {(bonus * quality.technical / 100).toFixed(1)}({bonus.toFixed(1)}×Tq({quality.technical}%))%
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0"
                aria-hidden
              >
                <polyline points="6 15 12 9 18 15" />
              </svg>
            </span>
          </button>
        )
      )}
      {run.tricks.length > 0 && (
        <div className="bg-white dark:bg-slate-900">
          <FinalScorePanel
            breakdown={runScoreBreakdown(run, MANOEUVRES_BY_ID, symmetry, bonusMalus, distribution, quality)}
          />
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
      + Insert here
    </button>
  );
}

function InsertAfterButton({
  armed,
  onTap,
  position,
}: {
  armed: boolean;
  onTap: () => void;
  position: number;
}) {
  if (!armed) return null;
  return (
    <button
      type="button"
      onClick={onTap}
      className="h-10 w-10 shrink-0 rounded border border-dashed border-sky-400 bg-sky-500/10 text-lg leading-none font-semibold text-sky-700 dark:text-sky-300 active:bg-sky-500/25"
      aria-label={`Insert at position ${position}`}
    >
      +
    </button>
  );
}

function Stat({ label, value, tone = 'neutral', className }: { label: string; value: string; tone?: 'neutral' | 'ok' | 'warn' | 'error'; className?: string }) {
  const valueCls =
    tone === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : tone === 'error'
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-800 dark:text-slate-100';
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 ${className ?? ''}`}>
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono text-sm ${valueCls}`}>{value}</span>
    </div>
  );
}

function SlotStat({ label, used, max }: { label: string; used: number; max: number }) {
  const over = used > max;
  const full = used === max;
  const valueCls = over
    ? 'text-amber-600 dark:text-amber-400'
    : full
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-slate-800 dark:text-slate-100';
  return (
    <div className="flex flex-col items-center gap-0.5 rounded bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono text-sm ${valueCls}`}>
        {used}<span className="text-slate-400 dark:text-slate-500">/{max}</span>
      </span>
    </div>
  );
}
