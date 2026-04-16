import { useEffect, useMemo, useState } from 'react';
import {
  clearApiCache,
  fetchCompetition,
  fetchCompetitions,
  type AwtCompetitionSummary,
  type AwtCompetitionWithResults,
} from '../io/awt-api';
import {
  extractPilots,
  mapCompetitionToProgram,
  type PilotSummary,
  type UnmappedTrick,
} from '../io/awt-mapping';
import { useProgramStore } from '../store/program-store';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type Step = 'competition' | 'pilot' | 'preview';

export default function AwtImportDialog({ open, onClose, onImported }: Props) {
  const program = useProgramStore((s) => s.program);
  const importProgram = useProgramStore((s) => s.importProgram);

  const [step, setStep] = useState<Step>('competition');
  const [competitions, setCompetitions] = useState<AwtCompetitionSummary[] | null>(null);
  const [competition, setCompetition] = useState<AwtCompetitionWithResults | null>(null);
  const [pilots, setPilots] = useState<PilotSummary[]>([]);
  const [selectedCivlid, setSelectedCivlid] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setStep('competition');
      setCompetition(null);
      setPilots([]);
      setSelectedCivlid(null);
      setSearch('');
      setError(null);
      return;
    }
    if (competitions) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCompetitions()
      .then((list) => {
        if (cancelled) return;
        const filtered = list
          .filter((c) => c.type === 'solo' && c.published !== false)
          .sort((a, b) => b.end_date.localeCompare(a.end_date));
        setCompetitions(filtered);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        // Always clear loading, even if the effect was superseded. The
        // setCompetitions call above triggers a rerun of this effect,
        // whose cleanup sets cancelled=true BEFORE .finally runs - so
        // gating on !cancelled would leave the spinner stuck.
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, competitions]);

  const filteredCompetitions = useMemo(() => {
    if (!competitions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return competitions;
    return competitions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.seasons.some((s) => s.toLowerCase().includes(q)),
    );
  }, [competitions, search]);

  const filteredPilots = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pilots;
    return pilots.filter((p) => p.name.toLowerCase().includes(q));
  }, [pilots, search]);

  const mapped = useMemo(() => {
    if (!competition || selectedCivlid == null) return null;
    return mapCompetitionToProgram(competition, selectedCivlid);
  }, [competition, selectedCivlid]);

  async function pickCompetition(comp: AwtCompetitionSummary) {
    setLoading(true);
    setError(null);
    setSearch('');
    try {
      const full = await fetchCompetition(comp._id);
      setCompetition(full);
      const allPilots = extractPilots(full);
      setPilots(allPilots);
      setStep('pilot');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function pickPilot(civlid: number) {
    setSelectedCivlid(civlid);
    setSearch('');
    setStep('preview');
  }

  function confirmImport() {
    if (!mapped) return;
    if (program.runs.some((r) => r.tricks.length > 0)) {
      if (!confirm('Replace the current program with the imported one?')) return;
    }
    const name = competition ? `${mapped.pilotName} - ${competition.name}` : mapped.pilotName;
    importProgram(mapped.program, name);
    onImported?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import program from acroworldtour.com"
        className="relative bg-white dark:bg-slate-900 rounded-t-2xl lg:rounded-2xl shadow-xl w-full lg:max-w-2xl max-h-[90vh] flex flex-col animate-[slideUp_0.18s_ease-out] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <BreadcrumbButton
              active={step === 'competition'}
              onClick={() => {
                if (step !== 'competition') {
                  setStep('competition');
                  setSelectedCivlid(null);
                  setSearch('');
                }
              }}
            >
              Competition
            </BreadcrumbButton>
            <Separator />
            <BreadcrumbButton
              active={step === 'pilot'}
              disabled={!competition}
              onClick={() => {
                if (competition) {
                  setStep('pilot');
                  setSelectedCivlid(null);
                  setSearch('');
                }
              }}
            >
              Pilot
            </BreadcrumbButton>
            <Separator />
            <BreadcrumbButton active={step === 'preview'} disabled={!mapped}>
              Preview
            </BreadcrumbButton>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                clearApiCache();
                setCompetitions(null);
                setCompetition(null);
                setPilots([]);
                setSelectedCivlid(null);
                setStep('competition');
                setSearch('');
                setError(null);
              }}
              className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 px-2 text-xs"
              aria-label="Refresh from API"
              title="Clear cache and reload from API"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-3 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          )}

          {!loading && step === 'competition' && (
            <CompetitionPicker
              competitions={filteredCompetitions}
              search={search}
              onSearch={setSearch}
              onPick={pickCompetition}
            />
          )}

          {!loading && step === 'pilot' && competition && (
            <PilotPicker
              competition={competition}
              pilots={filteredPilots}
              search={search}
              onSearch={setSearch}
              onPick={pickPilot}
              onBack={() => setStep('competition')}
            />
          )}

          {!loading && step === 'preview' && mapped && competition && (
            <ImportPreview
              pilotName={mapped.pilotName}
              competitionName={competition.name}
              runCount={mapped.program.runs.length}
              totalTricks={mapped.program.runs.reduce(
                (sum, r) => sum + r.tricks.length,
                0,
              )}
              unmapped={mapped.unmapped}
            />
          )}
        </div>

        {step === 'preview' && mapped && !loading && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStep('pilot')}
              className="py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500"
            >
              Back
            </button>
            <button
              type="button"
              onClick={confirmImport}
              className="py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-500"
            >
              Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BreadcrumbButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base = 'px-2 py-1 text-xs rounded truncate';
  const style = active
    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 font-semibold'
    : disabled
      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
      : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400';
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${style}`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span className="text-slate-300 dark:text-slate-600 text-xs">›</span>;
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-sky-500 outline-none"
    />
  );
}

function CompetitionPicker({
  competitions,
  search,
  onSearch,
  onPick,
}: {
  competitions: AwtCompetitionSummary[];
  search: string;
  onSearch: (s: string) => void;
  onPick: (c: AwtCompetitionSummary) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <SearchInput
        value={search}
        onChange={onSearch}
        placeholder="Search by name, code, location, season..."
      />
      {competitions.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          No competitions match.
        </div>
      ) : (
        <ul className="space-y-1">
          {competitions.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                onClick={() => onPick(c)}
                className="w-full text-left px-3 py-2 rounded border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
              >
                <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {c.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 flex-wrap">
                  <span>{c.end_date}</span>
                  {c.location && <span>- {c.location}</span>}
                  {c.seasons.length > 0 && (
                    <span className="uppercase tracking-wide">
                      {c.seasons.join(', ')}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PilotPicker({
  competition,
  pilots,
  search,
  onSearch,
  onPick,
  onBack,
}: {
  competition: AwtCompetitionWithResults;
  pilots: PilotSummary[];
  search: string;
  onSearch: (s: string) => void;
  onPick: (civlid: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {competition.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {pilots.length} pilots available
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
        >
          Change
        </button>
      </div>
      <SearchInput value={search} onChange={onSearch} placeholder="Search pilot..." />
      {pilots.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          No pilots flew in this competition.
        </div>
      ) : (
        <ul className="space-y-1">
          {pilots.map((p) => (
            <li key={p.civlid}>
              <button
                type="button"
                onClick={() => onPick(p.civlid)}
                className="w-full text-left px-3 py-2 rounded border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {p.name}
                </span>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {p.runCount} {p.runCount === 1 ? 'run' : 'runs'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ImportPreview({
  pilotName,
  competitionName,
  runCount,
  totalTricks,
  unmapped,
}: {
  pilotName: string;
  competitionName: string;
  runCount: number;
  totalTricks: number;
  unmapped: UnmappedTrick[];
}) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {pilotName}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{competitionName}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded border border-slate-200 dark:border-slate-700 p-2">
          <dt className="text-xs uppercase text-slate-500">Runs</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-200">{runCount}</dd>
        </div>
        <div className="rounded border border-slate-200 dark:border-slate-700 p-2">
          <dt className="text-xs uppercase text-slate-500">Tricks</dt>
          <dd className="font-semibold text-slate-800 dark:text-slate-200">{totalTricks}</dd>
        </div>
      </dl>
      {unmapped.length > 0 && (
        <div className="rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3">
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
            {unmapped.length} warning{unmapped.length === 1 ? '' : 's'}
          </div>
          <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 max-h-40 overflow-y-auto">
            {unmapped.map((u, i) => (
              <li key={i}>
                Run {u.runIndex + 1}, trick #{u.trickIndex + 1}:{' '}
                <span className="italic">{u.awtName}</span>
                {u.details ? ` - ${u.details}` : ''}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2">
            These tricks / bonuses don't exist in the current ARB catalog and will be
            skipped. The rest of the program imports normally.
          </p>
        </div>
      )}
    </div>
  );
}
