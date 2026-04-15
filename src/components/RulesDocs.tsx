import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rulesSource from '../../docs/sporting_code_aerobatics_2025.md?raw';
import { IconLink } from './icons';

interface TocEntry {
  level: 2 | 3;
  text: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function AnchorButton({
  slug,
  onCopy,
}: {
  slug: string;
  onCopy: (slug: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onCopy(slug);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      title="Copy link to this section"
      aria-label="Copy link to this section"
      className="inline-flex items-center text-sm font-normal text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
    >
      {copied ? <span className="text-xs">copied</span> : <IconLink className="w-4 h-4" />}
    </button>
  );
}

function collapseSoloManoeuvres(md: string): string {
  const startMarker = '### 1.1 Solo manoeuvres';
  const endMarker = '### 1.2 Landing manoeuvres';
  const start = md.indexOf(startMarker);
  const end = md.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return md;
  const replacement =
    `${startMarker}\n\n` +
    `See the [Solo tricks reference](#/docs/tricks) - each manoeuvre is ` +
    `documented there with its coefficient, criteria, bonuses and ` +
    `restrictions (one source of truth; this section would otherwise ` +
    `duplicate it).\n\n`;
  return md.slice(0, start) + replacement + md.slice(end);
}

function extractToc(md: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = md.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(##|###)\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length === 2 ? 2 : 3;
    const text = m[2];
    entries.push({ level, text, slug: slugify(text) });
  }
  return entries;
}

export default function RulesDocs() {
  const [query, setQuery] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const source = useMemo(() => collapseSoloManoeuvres(rulesSource), []);
  const toc = useMemo(() => extractToc(source), [source]);
  const filteredToc = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return toc;
    return toc.filter((t) => t.text.toLowerCase().includes(q));
  }, [toc, query]);

  const activeSlug = searchParams.get('s');

  useEffect(() => {
    if (!activeSlug) return;
    const el = document.getElementById(activeSlug);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSlug]);

  const goToSection = (slug: string) => {
    setSearchParams({ s: slug }, { replace: false });
    document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  const copySectionLink = async (slug: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/docs/rules?s=${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard may be unavailable on insecure contexts
    }
  };

  return (
    <div className="h-full flex min-h-0 relative">
      {tocOpen && (
        <button
          type="button"
          aria-label="Close contents"
          onClick={() => setTocOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-slate-900/60"
        />
      )}
      <aside
        className={`w-72 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col fixed lg:static inset-y-0 left-0 z-40 transition-transform lg:translate-x-0 ${
          tocOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="text-xs uppercase text-slate-500 mb-2">Contents</div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter sections..."
            className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none"
          />
        </div>
        <nav className="flex-1 overflow-y-auto p-2 text-sm">
          {filteredToc.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => goToSection(t.slug)}
              className={`block w-full text-left py-0.5 px-2 rounded text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 ${
                t.level === 3 ? 'pl-6 text-xs' : 'font-medium'
              }`}
            >
              {t.text}
            </button>
          ))}
          {filteredToc.length === 0 && (
            <div className="px-2 py-4 text-xs text-slate-500">No sections match.</div>
          )}
        </nav>
      </aside>
      <div className="flex-1 overflow-auto">
        <button
          type="button"
          onClick={() => setTocOpen(true)}
          className="lg:hidden sticky top-0 z-10 w-full px-4 py-2 text-sm flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <span>≡</span>
          <span>Contents</span>
        </button>
        <article className="max-w-3xl mx-auto px-4 lg:px-6 py-6 prose prose-slate dark:prose-invert prose-headings:scroll-mt-4 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-code:text-sky-700 dark:prose-code:text-sky-300">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children, ...props }) => {
                const text = String(children);
                const slug = slugify(text);
                return (
                  <h2 id={slug} {...props} className="flex items-center gap-2">
                    <span>{children}</span>
                    <AnchorButton slug={slug} onCopy={copySectionLink} />
                  </h2>
                );
              },
              h3: ({ children, ...props }) => {
                const text = String(children);
                const slug = slugify(text);
                return (
                  <h3 id={slug} {...props} className="flex items-center gap-2">
                    <span>{children}</span>
                    <AnchorButton slug={slug} onCopy={copySectionLink} />
                  </h3>
                );
              },
              h4: ({ children, ...props }) => {
                const text = String(children);
                const slug = slugify(text);
                return (
                  <h4 id={slug} {...props} className="flex items-center gap-2">
                    <span>{children}</span>
                    <AnchorButton slug={slug} onCopy={copySectionLink} />
                  </h4>
                );
              },
            }}
          >
            {source}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
