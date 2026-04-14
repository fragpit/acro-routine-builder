import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rulesSource from '../../docs/sporting_code_aerobatics_2025.md?raw';

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
  const toc = useMemo(() => extractToc(rulesSource), []);
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
                return (
                  <h2 id={slugify(text)} {...props}>
                    {children}
                  </h2>
                );
              },
              h3: ({ children, ...props }) => {
                const text = String(children);
                return (
                  <h3 id={slugify(text)} {...props}>
                    {children}
                  </h3>
                );
              },
            }}
          >
            {rulesSource}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
