import { useMemo, useState } from 'react';
import { MANOEUVRES, MANOEUVRES_BY_ID } from '../data/manoeuvres';
import type { Manoeuvre } from '../rules/types';

type SortBy = 'section' | 'coeff' | 'name';

export default function TricksDocs() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('section');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? MANOEUVRES.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.sectionNumber.includes(q) ||
            m.description.some((d) => d.toLowerCase().includes(q)),
        )
      : [...MANOEUVRES];
    return filtered.sort((a, b) => {
      if (sortBy === 'coeff') return b.coefficient - a.coefficient;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return compareSections(a.sectionNumber, b.sectionNumber);
    });
  }, [query, sortBy]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-900">
        <h1 className="text-lg font-semibold">Tricks reference</h1>
        <div className="text-xs text-slate-500">{list.length} / {MANOEUVRES.length}</div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search name, section, description..."
          className="ml-auto w-72 px-2 py-1 text-sm rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none"
        />
        <label className="text-xs text-slate-500 flex items-center gap-1">
          sort:
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-sm px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
          >
            <option value="section">Section</option>
            <option value="coeff">Coefficient</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {list.map((m) => (
            <TrickEntry key={m.id} manoeuvre={m} />
          ))}
          {list.length === 0 && (
            <div className="text-center text-slate-500 py-10">Nothing matches.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrickEntry({ manoeuvre: m }: { manoeuvre: Manoeuvre }) {
  const flags: string[] = [];
  if (m.mustBeFirst) flags.push('must be first');
  if (m.cannotBeLastTwo) flags.push('cannot be in last two');
  if (m.repetitionAllowed) flags.push('repetition allowed');
  if (m.noSide) flags.push('no side');
  if (m.awtExcluded) flags.push('AWT excluded');
  if (m.groups.includes('stall_to_infinite')) flags.push('group: stall-to-infinite');
  if (m.groups.includes('tumbling_related')) flags.push('group: tumbling/infinity/rhythmic');

  return (
    <section
      id={`trick-${m.id}`}
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
    >
      <header className="flex items-baseline gap-3 mb-2">
        <span className="text-xs font-mono text-slate-500">{m.sectionNumber}</span>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{m.name}</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">coeff {m.coefficient.toFixed(2)}</span>
      </header>

      <ul className="list-disc pl-5 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
        {m.description.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      {flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {flags.map((f) => (
            <span
              key={f}
              className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {m.availableBonuses.length > 0 && (
        <div className="mt-3">
          <div className="text-xs uppercase text-slate-500 mb-1">Bonuses</div>
          <div className="flex flex-wrap gap-1.5">
            {m.availableBonuses.map((b) => (
              <span
                key={b.id}
                className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                title={b.countsAs ? `counts as ${b.countsAs}` : undefined}
              >
                {b.label} +{b.percent}%
              </span>
            ))}
          </div>
          {m.mutualExclusions.length > 0 && (
            <div className="mt-1 text-xs text-slate-500">
              mutually exclusive:{' '}
              {m.mutualExclusions
                .map((grp) =>
                  grp
                    .map((id) => m.availableBonuses.find((b) => b.id === id)?.label ?? id)
                    .join(' / '),
                )
                .join('; ')}
            </div>
          )}
        </div>
      )}

      {m.forbiddenConnectionTo.length > 0 && (
        <div className="mt-3">
          <div className="text-xs uppercase text-slate-500 mb-1">Forbidden connection to</div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {m.forbiddenConnectionTo.map((id) => {
              const target = MANOEUVRES_BY_ID[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`trick-${id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:underline"
                >
                  {target?.name ?? id}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function compareSections(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
