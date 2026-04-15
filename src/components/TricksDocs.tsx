import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MANOEUVRES, MANOEUVRES_BY_ID } from '../data/manoeuvres';
import type { Manoeuvre } from '../rules/types';
import { IconLink } from './icons';

type SortBy = 'section' | 'coeff' | 'name';
type SortDir = 'asc' | 'desc';

export default function TricksDocs() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('section');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [listOpen, setListOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTrickId = searchParams.get('trick');

  useEffect(() => {
    if (!activeTrickId) return;
    const el = document.getElementById(`trick-${activeTrickId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTrickId]);

  const goToTrick = (id: string) => {
    setSearchParams({ trick: id }, { replace: false });
    document
      .getElementById(`trick-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setListOpen(false);
  };

  const copyTrickLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/docs/tricks?trick=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard may be unavailable on insecure contexts
    }
  };

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
    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'coeff') return a.coefficient - b.coefficient;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return compareSections(a.sectionNumber, b.sectionNumber);
    });
    if (sortDir === 'desc') sorted.reverse();
    return sorted;
  }, [query, sortBy, sortDir]);

  return (
    <div className="h-full flex min-h-0 relative">
      {listOpen && (
        <button
          type="button"
          aria-label="Close trick list"
          onClick={() => setListOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-slate-900/60"
        />
      )}
      <aside
        className={`w-72 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col fixed lg:static inset-y-0 left-0 z-40 transition-transform lg:translate-x-0 ${
          listOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase text-slate-500">Tricks</div>
            <div className="text-xs text-slate-500">
              {list.length} / {MANOEUVRES.length}
            </div>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter tricks..."
            className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none"
          />
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="flex-1 text-sm px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            >
              <option value="section">Section</option>
              <option value="coeff">Coefficient</option>
              <option value="name">Name</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              title={sortDir === 'asc' ? 'ascending' : 'descending'}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-sky-500"
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 text-sm">
          {list.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => goToTrick(m.id)}
              className={`block w-full text-left py-0.5 px-2 rounded hover:bg-white dark:hover:bg-slate-800 ${
                activeTrickId === m.id
                  ? 'text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400'
              }`}
            >
              <span className="font-mono text-xs text-slate-500 mr-2">{m.sectionNumber}</span>
              {m.name}
            </button>
          ))}
          {list.length === 0 && (
            <div className="px-2 py-4 text-xs text-slate-500">No tricks match.</div>
          )}
        </nav>
      </aside>
      <div className="flex-1 overflow-auto">
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="lg:hidden sticky top-0 z-10 w-full px-4 py-2 text-sm flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <span>≡</span>
          <span>Tricks ({list.length})</span>
        </button>
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
          {list.map((m) => (
            <TrickEntry
              key={m.id}
              manoeuvre={m}
              onNavigate={goToTrick}
              onCopyLink={copyTrickLink}
            />
          ))}
          {list.length === 0 && (
            <div className="text-center text-slate-500 py-10">Nothing matches.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrickEntry({
  manoeuvre: m,
  onNavigate,
  onCopyLink,
}: {
  manoeuvre: Manoeuvre;
  onNavigate: (id: string) => void;
  onCopyLink: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
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
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 scroll-mt-4"
    >
      <header className="flex items-baseline gap-3 mb-2">
        <span className="text-xs font-mono text-slate-500">{m.sectionNumber}</span>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{m.name}</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          coeff {m.coefficient.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={() => {
            onCopyLink(m.id);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          title="Copy link to this trick"
          aria-label="Copy link to this trick"
          className="ml-auto inline-flex items-center text-xs text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
        >
          {copied ? <span>copied</span> : <IconLink className="w-4 h-4" />}
        </button>
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
                  onClick={() => onNavigate(id)}
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
