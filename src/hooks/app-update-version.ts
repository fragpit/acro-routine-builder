export type AppVersionCheckResult =
  | { status: 'up-to-date' }
  | { status: 'update-available'; version: string }
  | { status: 'offline' };

interface CheckAppVersionOptions {
  baseUrl: string;
  currentVersion: string;
  fetcher?: typeof fetch;
  cacheBust?: string | number;
}

interface AppVersionPayload {
  version?: unknown;
}

/**
 * Checks the deployed version marker without relying on the Service Worker
 * update lifecycle.
 */
export async function checkAppVersion({
  baseUrl,
  currentVersion,
  fetcher = fetch,
  cacheBust = Date.now(),
}: CheckAppVersionOptions): Promise<AppVersionCheckResult> {
  try {
    const response = await fetcher(versionUrl(baseUrl, cacheBust), {
      cache: 'no-store',
    });
    if (!response.ok) return { status: 'offline' };

    const payload = (await response.json()) as AppVersionPayload;
    if (typeof payload.version !== 'string' || payload.version.length === 0) {
      return { status: 'offline' };
    }

    if (payload.version !== currentVersion) {
      return { status: 'update-available', version: payload.version };
    }

    return { status: 'up-to-date' };
  } catch {
    return { status: 'offline' };
  }
}

export function versionUrl(baseUrl: string, cacheBust: string | number): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}app-version.json?t=${encodeURIComponent(String(cacheBust))}`;
}
