import { useRef, useState } from 'react';
import { useProgramStore } from '../../store/program-store';
import { exportProgramJson, importProgramJson } from '../../io/program-json';
import { exportProgramMarkdown } from '../../io/program-markdown';

type PanelMode = 'save' | 'load' | null;

export default function MobileFileControls() {
  const program = useProgramStore((s) => s.program);
  const violations = useProgramStore((s) => s.violations);
  const currentName = useProgramStore((s) => s.currentName);
  const savedPrograms = useProgramStore((s) => s.savedPrograms);
  const saveProgramAs = useProgramStore((s) => s.saveProgramAs);
  const loadSavedProgram = useProgramStore((s) => s.loadSavedProgram);
  const deleteSavedProgram = useProgramStore((s) => s.deleteSavedProgram);
  const newProgram = useProgramStore((s) => s.newProgram);
  const importProgram = useProgramStore((s) => s.importProgram);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<PanelMode>(null);
  const [saveName, setSaveName] = useState('');

  const savedNames = Object.keys(savedPrograms).sort((a, b) => a.localeCompare(b));

  function safeFileName(base: string, ext: string): string {
    const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
    return `${cleaned || 'program'}.${ext}`;
  }

  function download(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function onExportJson() {
    const base = currentName ?? 'program';
    download(safeFileName(base, 'apc.json'), exportProgramJson(program, currentName), 'application/json');
  }

  function onExportMarkdown() {
    const base = currentName ?? 'program';
    download(safeFileName(base, 'md'), exportProgramMarkdown(program, currentName, violations), 'text/markdown');
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text();
      const { program: imported, name } = importProgramJson(text);
      if (program.runs.some((r) => r.tricks.length > 0)) {
        if (!confirm('Replace the current program with the imported one?')) return;
      }
      importProgram(imported, name);
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function openSave() {
    setSaveName(currentName ?? '');
    setPanel(panel === 'save' ? null : 'save');
  }

  function confirmSave() {
    const name = saveName.trim();
    if (!name) return;
    if (savedPrograms[name] && name !== currentName) {
      if (!confirm(`Overwrite existing program "${name}"?`)) return;
    }
    saveProgramAs(name);
    setPanel(null);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <ActionButton icon={<IconSave />} label="Save" onClick={openSave} active={panel === 'save'} />
        <ActionButton
          icon={<IconFolder />}
          label={`Load${savedNames.length ? ` (${savedNames.length})` : ''}`}
          onClick={() => setPanel(panel === 'load' ? null : 'load')}
          active={panel === 'load'}
          disabled={savedNames.length === 0}
        />
        <ActionButton
          icon={<IconDocPlus />}
          label="New"
          onClick={() => {
            if (confirm('Start a new empty program? Current work will be replaced.')) newProgram();
          }}
          tone="muted"
        />
        <ActionButton
          icon={<IconUpload />}
          label="Import"
          onClick={() => fileInputRef.current?.click()}
        />
        <ActionButton
          icon={<IconDownload />}
          label="Export JSON"
          onClick={onExportJson}
        />
        <ActionButton
          icon={<IconDocText />}
          label="Export MD"
          onClick={onExportMarkdown}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onImportFile(file);
          e.target.value = '';
        }}
      />

      {panel === 'save' && (
        <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 space-y-2">
          <input
            type="text"
            autoFocus
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmSave();
              if (e.key === 'Escape') setPanel(null);
            }}
            placeholder="Program name..."
            className="w-full px-2 py-1.5 text-base rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:border-sky-500 outline-none"
          />
          {savedNames.length > 0 && (
            <>
              <div className="text-[10px] uppercase text-slate-500">Overwrite existing</div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {savedNames.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSaveName(n)}
                    className={`w-full text-left text-xs px-2 py-1 rounded truncate hover:bg-white dark:hover:bg-slate-700 ${
                      n === saveName ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="px-3 py-1 text-xs rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSave}
              disabled={!saveName.trim()}
              className="px-3 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {panel === 'load' && savedNames.length > 0 && (
        <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 max-h-60 overflow-y-auto">
          {savedNames.map((n) => (
            <div
              key={n}
              className={`flex items-center gap-1 rounded ${
                n === currentName ? 'bg-sky-100 dark:bg-sky-900/40' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  loadSavedProgram(n);
                  setPanel(null);
                }}
                className="flex-1 text-left text-sm px-2 py-1.5 rounded truncate text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
              >
                {n}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete saved program "${n}"?`)) deleteSavedProgram(n);
                }}
                className="px-2 py-1 text-slate-400 hover:text-red-500"
                aria-label={`Delete ${n}`}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: 'default' | 'muted';
}) {
  const base =
    'w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const palette = active
    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
    : tone === 'muted'
      ? 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400';
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${palette}`}>
      <span className="shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

const SVG_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'w-4 h-4',
};

function IconSave() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function IconDocPlus() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconDocText() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}
