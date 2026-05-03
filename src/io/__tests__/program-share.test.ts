import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  compressProgram,
  createShortLink,
  decompressProgram,
  fetchSharedProgram,
  getShareId,
  isShortenerEnabled,
} from '../program-share';
import type { Program } from '../../rules/types';

const SAMPLE_PROGRAM: Program = {
  awtMode: false,
  runs: [
    {
      id: 'r1',
      tricks: [
        { id: 't1', manoeuvreId: 'sat', side: 'R', selectedBonuses: ['twisted'] },
        { id: 't2', manoeuvreId: 'twister', side: 'L', selectedBonuses: [] },
      ],
    },
    { id: 'r2', tricks: [] },
  ],
  repeatAfterRuns: 2,
  defaultBonuses: [],
};

describe('compress / decompress', () => {
  it('round-trips a program through the v1 envelope', () => {
    const payload = compressProgram(SAMPLE_PROGRAM, 'fixture');
    expect(payload.startsWith('v1.')).toBe(true);
    const { program, name } = decompressProgram(payload);
    expect(program).toEqual(SAMPLE_PROGRAM);
    expect(name).toBe('fixture');
  });

  it('rejects an empty payload', () => {
    expect(() => decompressProgram('')).toThrow(/empty/i);
  });

  it('rejects a malformed payload with no version separator', () => {
    expect(() => decompressProgram('abc')).toThrow(/malformed/i);
  });

  it('rejects an unknown version tag', () => {
    expect(() => decompressProgram('v999.abc')).toThrow(/version/i);
  });

  it('rejects garbled compressed bytes', () => {
    expect(() => decompressProgram('v1.!!!notvalid!!!')).toThrow();
  });
});

describe('getShareId', () => {
  it('extracts a valid id from a query string', () => {
    expect(getShareId('?s=Ab12Cd34')).toBe('Ab12Cd34');
    expect(getShareId('s=Ab12Cd34')).toBe('Ab12Cd34');
  });

  it('returns null when absent', () => {
    expect(getShareId('')).toBeNull();
    expect(getShareId('?other=1')).toBeNull();
  });

  it('rejects ids with disallowed characters', () => {
    expect(getShareId('?s=ab/cd')).toBeNull();
    expect(getShareId('?s=ab cd')).toBeNull();
    expect(getShareId('?s=' + 'a'.repeat(64))).toBeNull();
  });
});

describe('isShortenerEnabled', () => {
  it('reports the build-time URL state', () => {
    expect(isShortenerEnabled()).toBe(true);
  });
});

describe('createShortLink', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the compressed payload and builds an absolute URL with ?s=<id>', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: 'Ab12Cd34' }), { status: 200 }),
    );
    const url = await createShortLink(SAMPLE_PROGRAM, 'fixture');
    expect(url).toMatch(/\/builder\?s=Ab12Cd34$/);
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(1);
    const [endpoint, init] = calls[0];
    expect(endpoint).toMatch(/\/r$/);
    expect(init.method).toBe('POST');
    expect(String(init.body).startsWith('v1.')).toBe(true);
  });

  it('maps 413 to a payload-too-large error', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('too big', { status: 413 }),
    );
    await expect(createShortLink(SAMPLE_PROGRAM, null)).rejects.toThrow(/too large/i);
  });

  it('maps 429 to a rate-limit error', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('slow down', { status: 429 }),
    );
    await expect(createShortLink(SAMPLE_PROGRAM, null)).rejects.toThrow(/too many/i);
  });

  it('maps network failure to a friendly error', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('network'));
    await expect(createShortLink(SAMPLE_PROGRAM, null)).rejects.toThrow(/could not reach/i);
  });

  it('rejects an invalid id from the worker', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: '../etc/passwd' }), { status: 200 }),
    );
    await expect(createShortLink(SAMPLE_PROGRAM, null)).rejects.toThrow(/invalid response/i);
  });
});

describe('fetchSharedProgram', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs and returns the imported program', async () => {
    const payload = compressProgram(SAMPLE_PROGRAM, 'fixture');
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(payload, { status: 200, headers: { 'Content-Type': 'text/plain' } }),
    );
    const { program, name } = await fetchSharedProgram('Ab12Cd34');
    expect(program).toEqual(SAMPLE_PROGRAM);
    expect(name).toBe('fixture');
  });

  it('maps 404 to expired-or-not-found', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('gone', { status: 404 }),
    );
    await expect(fetchSharedProgram('Ab12Cd34')).rejects.toThrow(/expired/i);
  });

  it('rejects an id with disallowed characters before fetching', async () => {
    await expect(fetchSharedProgram('../boom')).rejects.toThrow(/invalid/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
