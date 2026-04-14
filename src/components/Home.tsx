import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center flex flex-col items-center -translate-y-[10vh]">
      <h1 className="text-3xl sm:text-4xl font-bold mb-3">Acro Program Constructor</h1>
      <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
        Build an AWT/AWQ program under FAI Sporting Code 2025 rules.
      </p>
      <Link
        to="/constructor"
        className="inline-block px-6 py-4 text-lg rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition text-sky-700 dark:text-sky-300 font-semibold"
      >
        Open
      </Link>
      <div className="mt-10 text-base text-slate-600 dark:text-slate-400">
        <h3 className="font-semibold text-slate-800 dark:text-slate-300 mb-2">Documentation</h3>
        <ul className="space-y-1">
          <li><Link to="/docs/rules" className="hover:text-sky-600 dark:hover:text-sky-400">Competition rules (FAI Sporting Code)</Link></li>
          <li><Link to="/docs/tricks" className="hover:text-sky-600 dark:hover:text-sky-400">Trick reference with restrictions</Link></li>
        </ul>
      </div>
      </div>
    </div>
  );
}
