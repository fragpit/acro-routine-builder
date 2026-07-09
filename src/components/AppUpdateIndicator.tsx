import { useIsMobile } from '../hooks/useIsMobile';
import { useAppUpdateController } from '../hooks/useAppUpdateController';
import type { UpdateStatus } from '../hooks/useAppUpdate';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { IconRefresh, IconCheck } from './icons';

const PULL_THRESHOLD = 70;

/**
 * Top-anchored pill that visualises app update checks.
 *
 * Mounted once at the App root. On mobile (< lg), listens for a top-of-page
 * pull-down gesture and, on release past the threshold, asks the service
 * worker to check for a new build. Persistent update actions live beside the
 * Home page version instead of in this transient gesture indicator.
 */
export default function AppUpdateIndicator() {
  const isMobile = useIsMobile();
  const { status, checkForUpdate } = useAppUpdateController();
  const { pull, pulling, armed } = usePullToRefresh({
    enabled: isMobile,
    onTrigger: () => void checkForUpdate(),
    threshold: PULL_THRESHOLD,
  });

  const showPull = pulling && pull > 4;
  const topStatus = status === 'update-available' ? 'idle' : status;
  const showStatus = topStatus !== 'idle';
  if (!showPull && !showStatus) return null;

  const offset = showStatus
    ? PULL_THRESHOLD
    : Math.min(pull, PULL_THRESHOLD + 30);
  const opacity = showStatus
    ? 1
    : Math.min(1, pull / (PULL_THRESHOLD * 0.8));
  const spinning = topStatus === 'checking' || topStatus === 'updating';

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
          'pointer-events-none',
        ].join(' ')}
      >
        {topStatus === 'up-to-date' ? (
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
        <span>{labelFor(topStatus, armed, pulling)}</span>
      </div>
    </div>
  );
}

function labelFor(
  status: Exclude<UpdateStatus, 'update-available'>,
  armed: boolean,
  pulling: boolean,
): string {
  if (status === 'checking') return 'Checking for updates';
  if (status === 'updating') return 'Updating';
  if (status === 'up-to-date') return 'Up to date';
  if (status === 'offline') return 'Offline - try again';
  if (pulling) return armed ? 'Release to refresh' : 'Pull to refresh';
  return '';
}
