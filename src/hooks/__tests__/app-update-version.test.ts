import { describe, expect, it, vi } from 'vitest';
import { checkAppVersion, versionUrl } from '../app-update-version';

describe('app update version check', () => {
  it('builds a cache-busted version URL under the app base path', () => {
    expect(versionUrl('/acro-routine-builder/', 'abc 123')).toBe(
      '/acro-routine-builder/app-version.json?t=abc%20123',
    );
  });

  it('reports up to date when the deployed version matches', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ version: '1.2.3' })),
    );

    await expect(
      checkAppVersion({
        baseUrl: '/',
        currentVersion: '1.2.3',
        cacheBust: 1,
        fetcher,
      }),
    ).resolves.toEqual({ status: 'up-to-date' });
    expect(fetcher).toHaveBeenCalledWith('/app-version.json?t=1', {
      cache: 'no-store',
    });
  });

  it('reports an available update when the deployed version differs', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ version: '1.2.4' })),
    );

    await expect(
      checkAppVersion({
        baseUrl: '/',
        currentVersion: '1.2.3',
        fetcher,
      }),
    ).resolves.toEqual({ status: 'update-available', version: '1.2.4' });
  });

  it('reports offline when the version endpoint cannot be read', async () => {
    const fetcher = vi.fn(async () => new Response('', { status: 404 }));

    await expect(
      checkAppVersion({
        baseUrl: '/',
        currentVersion: '1.2.3',
        fetcher,
      }),
    ).resolves.toEqual({ status: 'offline' });
  });
});
