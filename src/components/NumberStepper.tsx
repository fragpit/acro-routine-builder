interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Numeric stepper with +/- buttons only. Typing is intentionally disabled so
 * users cannot set arbitrary out-of-range values or paste text.
 */
export default function NumberStepper({
  value,
  min,
  max,
  onChange,
  ariaLabel,
  className = '',
}: Props) {
  const clamped = Math.max(min, Math.min(max, value));
  const canDec = clamped > min;
  const canInc = clamped < max;

  const btn =
    'w-6 h-6 inline-flex items-center justify-center text-slate-700 dark:text-slate-200 ' +
    'hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent ' +
    'disabled:cursor-not-allowed select-none';

  return (
    <div
      className={
        'inline-flex items-center rounded border border-slate-300 dark:border-slate-700 ' +
        'bg-white dark:bg-slate-800 overflow-hidden ' +
        className
      }
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => canDec && onChange(clamped - 1)}
        disabled={!canDec}
        aria-label="Decrement"
        className={btn}
      >
        -
      </button>
      <span
        className="min-w-[2rem] px-1 text-center text-sm tabular-nums select-none"
        aria-live="polite"
      >
        {clamped}
      </span>
      <button
        type="button"
        onClick={() => canInc && onChange(clamped + 1)}
        disabled={!canInc}
        aria-label="Increment"
        className={btn}
      >
        +
      </button>
    </div>
  );
}
