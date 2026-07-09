import { useIsMobile } from '../hooks/useIsMobile';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { IconRefresh, IconCheck } from './icons';

const PULL_THRESHOLD = 70;

/**
 * Top-anchored pill that visualises app update checks and update prompts.
 *
 * Mounted once at the App root. On mobile (< lg), listens for a top-of-page
 * pull-down gesture and, on release past the threshold, asks the service
 * worker to check for a new build. The same pill then morphs to show status
 * or a persistent "Update available" prompt. On desktop the gesture is
 * disabled, but automatic version checks still surface the prompt.
 *
 * The plugin is configured with `registerType: 'prompt'`, so a waiting SW
 * never auto-activates; tapping Update is the user's explicit consent.
 */
export default function AppUpdateIndicator() {
  const isMobile = useIsMobile();
  const {
    status,
    latestVersion,
    checkForUpdate,
    applyUpdate,
    dismissUpdate,
  } = useAppUpdate();
  const { pull, pulling, armed } = usePullToRefresh({
    enabled: isMobile,
    onTrigger: () => void checkForUpdate(),
    threshold: PULL_THRESHOLD,
  });

  const showPull = pulling && pull > 4;
  const showStatus = status !== 'idle';
  if (!showPull && !showStatus) return null;

  const offset = showStatus
    ? PULL_THRESHOLD
    : Math.min(pull, PULL_THRESHOLD + 30);
  const opacity = showStatus
    ? 1
    : Math.min(1, pull / (PULL_THRESHOLD * 0.8));
  const spinning = status === 'checking' || status === 'updating';
  const updateAvailable = status === 'update-available';

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-0 right-0 flex justify-center z-[60]"
      style={{
        top: 'env(safe-area-inset-top)',
        transform: `translateY(${offset - PULL_THRESHOLD}px)`,
        transition: showStatus
          ? 'transform 220ms ease-out'
          : pulling
            ? 'none'
            : 'transform 180ms ease-out',
        opacity,
      }}
    >
      <div
        className={[
          'mt-2 flex items-center gap-2 rounded-full border border-slate-200',
          'dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 px-3',
          'py-1.5 shadow-md text-slate-700 dark:text-slate-200 text-xs',
          updateAvailable ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
      >
        {status === 'up-to-date' ? (
          <IconCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <IconRefresh
            className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
            style={
              !spinning && !showStatus
                ? { transform: `rotate(${Math.min(360, pull * 4)}deg)`, transition: 'none' }
                : undefined
            }
          />
        )}
        <span>{labelFor(status, armed, pulling, latestVersion)}</span>
        {updateAvailable ? (
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => void applyUpdate()}
              className="rounded-full bg-sky-600 px-2.5 py-1 font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              Update
            </button>
            <button
              type="button"
              onClick={dismissUpdate}
              className="rounded-full px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-slate-600"
            >
              Later
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function labelFor(
  status: ReturnType<typeof useAppUpdate>['status'],
  armed: boolean,
  pulling: boolean,
  latestVersion: string | null,
): string {
  if (status === 'checking') return 'Checking for updates';
  if (status === 'update-available') {
    return latestVersion
      ? `Update available: v${latestVersion}`
      : 'Update available';
  }
  if (status === 'updating') return 'Updating';
  if (status === 'up-to-date') return 'Up to date';
  if (status === 'offline') return 'Offline - try again';
  if (pulling) return armed ? 'Release to refresh' : 'Pull to refresh';
  return '';
}
