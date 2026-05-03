import { useState } from 'react';
import type { RunScoreBreakdown } from '../scoring/final-score';

interface Props {
  breakdown: RunScoreBreakdown;
  /**
   * Direction the breakdown appears relative to the header when expanded.
   * On desktop the panel is at the top of its container and the breakdown
   * flows downward, so the chevron should invite a "down" motion when
   * collapsed. On mobile the panel is near the bottom of the viewport and
   * visually expands upward. Default: `up` (mobile convention).
   */
  expandsDown?: boolean;
}

export default function FinalScorePanel({
  breakdown,
  expandsDown = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const chevronFlipped = expandsDown ? !expanded : expanded;

  const scoreLabel = breakdown.total.toFixed(3);

  return (
    <div className="border-t border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-3 py-1.5 flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Click to see score breakdown"
      >
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          Score
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-sky-700 dark:text-sky-300">
            {scoreLabel}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-3 h-3 text-slate-400 transition-transform ${chevronFlipped ? 'rotate-180' : ''}`}
            aria-hidden
          >
            <polyline points="6 15 12 9 18 15" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-2 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <FormulaRow
            label="Technical"
            formula={`T(${breakdown.tMark}) × TC(${breakdown.tc.toFixed(3)}) × ${breakdown.distribution.technical}%`}
            value={breakdown.techFinal.toFixed(3)}
          />
          <FormulaRow
            label="Choreo"
            formula={`C(${breakdown.cMark.toFixed(1)}) × ${breakdown.distribution.choreo}%`}
            value={breakdown.choreoFinal.toFixed(3)}
          />
          {breakdown.distribution.landing > 0 && (
            <FormulaRow
              label="Landing"
              formula={`L(${breakdown.lMark}) × ${breakdown.distribution.landing}%`}
              value={breakdown.landingFinal.toFixed(3)}
            />
          )}
          <FormulaRow
            label="Bonus"
            formula={`(Tech + Choreo) × (${breakdown.bonusPercent.toFixed(1)}% - ${breakdown.choreoPenalty}%)/100 × ${breakdown.quality.technical}%(Tq)`}
            value={breakdown.bonusFinal.toFixed(3)}
          />
          <div className="border-t border-slate-200 dark:border-slate-700 pt-1">
            <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200">
              <span>Total</span>
              <span className="font-mono">
                {scoreLabel}
              </span>
            </div>
          </div>
          <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-500 space-y-0.5">
            <p>
              T = 10 × {breakdown.quality.technical}%(Tq)
              {' '}= {breakdown.tMark}
            </p>
            <p>
              C = 9 × {breakdown.quality.choreo}%(Cq)
              {' '}+ {breakdown.symmetryBalanced ? '1' : '0'}(sym)
              {' '}= {breakdown.cMark}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FormulaRow({
  label,
  formula,
  value,
}: {
  label: string;
  formula: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">
        {label}
      </span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate flex-1 text-center font-mono">
        {formula}
      </span>
      <span className="font-mono text-slate-700 dark:text-slate-200 shrink-0">
        {value}
      </span>
    </div>
  );
}
