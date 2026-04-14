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
          Acro Program Constructor
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/docs/rules" className="hover:text-sky-600 dark:hover:text-sky-400">Rules</Link>
          <Link to="/docs/tricks" className="hover:text-sky-600 dark:hover:text-sky-400">Tricks</Link>
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

