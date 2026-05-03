import { useEffect } from 'react';

const SCRIPT_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

function injectBeacon(token: string): void {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.dataset.cfBeacon = JSON.stringify({
    token,
    spa: true,
    siteTag: `v${__APP_VERSION__}`,
  });
  document.head.appendChild(script);
}

/**
 * Cloudflare Web Analytics integration.
 *
 * Injects the beacon script when a build-time token is present.
 * BrowserRouter navigates via History API (pushState / replaceState),
 * which CF's beacon listens to natively in `spa: true` mode - no shim
 * needed for route-level pageviews.
 *
 * No-op when __CF_ANALYTICS_TOKEN__ is null (dev and PR builds).
 */
export function useCloudflareAnalytics(): void {
  useEffect(() => {
    if (!__CF_ANALYTICS_TOKEN__) return;
    injectBeacon(__CF_ANALYTICS_TOKEN__);
  }, []);
}
