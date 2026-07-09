import { Link } from 'react-router-dom';
import { useAppUpdateController } from '../hooks/useAppUpdateController';

export default function Home() {
  const {
    status,
    latestVersion,
    applyUpdate,
    dismissUpdate,
  } = useAppUpdateController();
  const updateAvailable = status === 'update-available';

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl w-full text-center flex flex-col items-center -translate-y-[10vh]">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Acro Routine Builder</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
          Build an AWT/AWQ program under FAI Sporting Code 2025 rules.
        </p>
        <Link
          to="/builder"
          className="inline-block px-6 py-4 text-lg rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition text-sky-700 dark:text-sky-300 font-semibold"
        >
          Open
        </Link>
        <div className="mt-10 text-base text-slate-600 dark:text-slate-400">
          <h3 className="font-semibold text-slate-800 dark:text-slate-300 mb-2">Documentation</h3>
          <ul className="space-y-1">
            <li><Link to="/docs/help" className="hover:text-sky-600 dark:hover:text-sky-400">User guide (how to use the builder)</Link></li>
            <li><Link to="/docs/rules" className="hover:text-sky-600 dark:hover:text-sky-400">Competition rules (FAI Sporting Code)</Link></li>
            <li><Link to="/docs/tricks" className="hover:text-sky-600 dark:hover:text-sky-400">Trick reference with restrictions</Link></li>
          </ul>
        </div>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        <span>v{__APP_VERSION__}</span>
        {updateAvailable ? (
          <span className="ml-1 inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
            <span>
              (
              {latestVersion
                ? `update available: v${latestVersion}`
                : 'update available'}
            </span>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => void applyUpdate()}
              className="font-semibold text-sky-700 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-sky-300 dark:hover:text-sky-200"
            >
              Update
            </button>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={dismissUpdate}
              className="font-semibold text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-300 dark:hover:text-slate-100 dark:focus:ring-slate-600"
            >
              Later
            </button>
            <span>)</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
