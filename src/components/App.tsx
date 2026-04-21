import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import Builder from './Builder';
import ThemeToggle from './ThemeToggle';
import TricksDocs from './TricksDocs';
import RulesDocs from './RulesDocs';
import HelpDocs from './HelpDocs';
import FeedbackMenu from './FeedbackMenu';

export default function App() {
  const location = useLocation();
  const hideHeaderOnMobile = location.pathname === '/builder';
  return (
    <div className="flex flex-col text-slate-900 dark:text-slate-100 relative z-10 h-[100lvh] lg:h-full">
      <div aria-hidden className="paraglider-bg" />
      <div aria-hidden className="mountain-bg" />
      <header className={`${hideHeaderOnMobile ? 'hidden lg:flex' : 'flex'} px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:pt-3 border-b border-slate-200 dark:border-slate-700 items-center gap-4 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm relative z-10`}>
        <Link to="/" className="font-semibold whitespace-nowrap hover:text-sky-600 dark:hover:text-sky-400">
          <span className="lg:hidden">ARB</span>
          <span className="hidden lg:inline">Acro Routine Builder</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <Link to="/builder" className="hover:text-sky-600 dark:hover:text-sky-400">Builder</Link>
          <Link to="/docs/help" className="hover:text-sky-600 dark:hover:text-sky-400">Help</Link>
          <Link to="/docs/rules" className="hover:text-sky-600 dark:hover:text-sky-400">Rules</Link>
          <Link to="/docs/tricks" className="hover:text-sky-600 dark:hover:text-sky-400">Tricks</Link>
          <FeedbackMenu
            triggerClassName="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
            iconSize="md"
            align="right"
          />
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/docs/help" element={<HelpDocs />} />
          <Route path="/docs/rules" element={<RulesDocs />} />
          <Route path="/docs/tricks" element={<TricksDocs />} />
        </Routes>
      </main>
    </div>
  );
}

