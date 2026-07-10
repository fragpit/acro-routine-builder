import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import Builder from './Builder';
import ThemeToggle from './ThemeToggle';
import TricksDocs from './TricksDocs';
import RulesDocs from './RulesDocs';
import HelpDocs from './HelpDocs';
import NewsDocs from './NewsDocs';
import FeedbackMenu from './FeedbackMenu';
import HelpMenu from './HelpMenu';
import AppUpdateIndicator from './AppUpdateIndicator';
import MobileNavLinks from './mobile/MobileNavLinks';
import { useCloudflareAnalytics } from '../hooks/useCloudflareAnalytics';
import { useShareLink } from '../hooks/useShareLink';
import { AppUpdateProvider } from '../hooks/AppUpdateProvider';

export default function App() {
  const location = useLocation();
  const hideHeaderOnMobile = location.pathname === '/builder';
  useCloudflareAnalytics();
  useShareLink();
  return (
    <div className="flex flex-col text-slate-900 dark:text-slate-100 relative z-10 h-[100lvh] lg:h-full">
      <div aria-hidden className="paraglider-bg" />
      <div aria-hidden className="mountain-bg" />
      <AppUpdateProvider>
        <AppUpdateIndicator />
        <header className={`${hideHeaderOnMobile ? 'hidden lg:flex' : 'flex'} px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:pt-3 border-b border-slate-200 dark:border-slate-700 items-center gap-4 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm relative z-30`}>
          <Link to="/" className="font-semibold whitespace-nowrap hover:text-sky-600 dark:hover:text-sky-400">
            <span className="lg:hidden">ARB</span>
            <span className="hidden lg:inline">Acro Routine Builder</span>
          </Link>
          <nav className="lg:hidden ml-auto flex-1 min-w-0">
            <MobileNavLinks primary="builder" textStyle="plain" />
          </nav>
          <nav className="ml-auto hidden lg:flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <div className="flex items-center gap-5">
              <Link to="/builder" className="hover:text-sky-600 dark:hover:text-sky-400">Builder</Link>
              <Link to="/docs/rules" className="hover:text-sky-600 dark:hover:text-sky-400">Rules</Link>
              <Link to="/docs/tricks" className="hover:text-sky-600 dark:hover:text-sky-400">Tricks</Link>
            </div>
            <div className="flex items-center gap-2">
              <HelpMenu
                triggerClassName="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
                iconSize="sm"
                align="right"
              />
              <FeedbackMenu
                triggerClassName="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
                iconSize="sm"
                align="right"
              />
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/docs/help" element={<HelpDocs />} />
            <Route path="/docs/rules" element={<RulesDocs />} />
            <Route path="/docs/tricks" element={<TricksDocs />} />
            <Route path="/docs/news" element={<NewsDocs />} />
          </Routes>
        </main>
      </AppUpdateProvider>
    </div>
  );
}
