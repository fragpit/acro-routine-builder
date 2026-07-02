interface Props {
  value: number | null;
  stacked?: boolean;
}

export default function TechnicalAverage({ value, stacked = false }: Props) {
  if (value === null) return null;

  const label = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);

  return (
    <span
      className={`inline-flex text-xs text-slate-500 dark:text-slate-400 ${
        stacked
          ? 'flex-col items-start gap-0.5 leading-none'
          : 'items-baseline gap-1'
      }`}
      title="Average technical mark across scoring-eligible tricks"
    >
      <span className="whitespace-nowrap uppercase tracking-wide">Avg T</span>
      <span className="whitespace-nowrap font-mono font-semibold text-slate-700 dark:text-slate-200">
        {label}%
      </span>
    </span>
  );
}
