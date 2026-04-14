import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Acro Program Constructor</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        Build an AWT/AWQ program under FAI Sporting Code 2025 rules.
      </p>
      <Link
        to="/builder"
        className="inline-block px-5 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition text-sky-700 dark:text-sky-300 font-semibold"
      >
        Open builder
      </Link>
      <div className="mt-8 text-sm text-slate-600 dark:text-slate-400">
        <h3 className="font-semibold text-slate-800 dark:text-slate-300 mb-2">Documentation</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><Link to="/docs/rules" className="hover:text-sky-600 dark:hover:text-sky-400">Competition rules (FAI Sporting Code)</Link></li>
          <li><Link to="/docs/tricks" className="hover:text-sky-600 dark:hover:text-sky-400">Trick reference with restrictions</Link></li>
        </ul>
      </div>
    </div>
  );
}
