import { Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Constructor from './Constructor';
import ThemeToggle from './ThemeToggle';
import TricksDocs from './TricksDocs';
import RulesDocs from './RulesDocs';

export default function App() {
  return (
    <div className="h-full flex flex-col text-slate-900 dark:text-slate-100 relative z-10">
      <div aria-hidden className="paraglider-bg" />
      <div aria-hidden className="mountain-bg" />
      <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm relative z-10">
        <Link to="/" className="font-semibold hover:text-sky-600 dark:hover:text-sky-400">
          <span className="lg:hidden">APC (v{__APP_VERSION__})</span>
          <span className="hidden lg:inline">Acro Program Constructor (v{__APP_VERSION__})</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/docs/rules" className="hover:text-sky-600 dark:hover:text-sky-400">Rules</Link>
          <Link to="/docs/tricks" className="hover:text-sky-600 dark:hover:text-sky-400">Tricks</Link>
          <a
            href="https://github.com/fragpit/acro-program-constructor/issues"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub issues"
            title="GitHub issues"
            className="hover:text-sky-600 dark:hover:text-sky-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M12 .5C5.73.5.67 5.57.67 11.85c0 5.02 3.24 9.27 7.74 10.77.57.11.78-.25.78-.55 0-.27-.01-.99-.02-1.95-3.15.69-3.81-1.52-3.81-1.52-.52-1.31-1.26-1.66-1.26-1.66-1.03-.71.08-.69.08-.69 1.14.08 1.74 1.18 1.74 1.18 1.01 1.74 2.66 1.24 3.31.95.1-.74.4-1.24.72-1.53-2.51-.29-5.15-1.26-5.15-5.6 0-1.24.44-2.25 1.17-3.05-.12-.29-.51-1.44.11-3 0 0 .96-.31 3.14 1.16.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.47 3.14-1.16 3.14-1.16.62 1.56.23 2.71.11 3 .73.8 1.17 1.81 1.17 3.05 0 4.35-2.65 5.31-5.17 5.59.41.35.77 1.04.77 2.1 0 1.52-.01 2.75-.01 3.12 0 .3.21.67.79.55 4.49-1.5 7.73-5.75 7.73-10.77C23.33 5.57 18.27.5 12 .5z" />
            </svg>
          </a>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/constructor" element={<Constructor />} />
          <Route path="/docs/rules" element={<RulesDocs />} />
          <Route path="/docs/tricks" element={<TricksDocs />} />
        </Routes>
      </main>
    </div>
  );
}

