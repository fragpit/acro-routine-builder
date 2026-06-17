interface Props {
  value: number | null;
}

export default function TechnicalAverage({ value }: Props) {
  if (value === null) return null;

  const label = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);

  return (
    <span
      className="inline-flex items-baseline gap-1 text-xs text-slate-500 dark:text-slate-400"
      title="Average technical mark across scoring-eligible tricks"
    >
      <span className="uppercase tracking-wide">Avg T</span>
      <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
        {label}%
      </span>
    </span>
  );
}
